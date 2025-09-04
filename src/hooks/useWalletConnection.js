import {useCallback, useState} from 'react';
import {
  connectWalletWithKeystore,
  connectWalletWithMnemonic,
  connectWalletWithPrivateKey,
  decryptWallet
} from '../utils/wallet';
import CryptoJS from "crypto-js";
import {BrowserProvider, formatEther} from "ethers";
// import {BrowserProvider, formatEther, JsonRpcProvider, Wallet, Contract} from "ethers";
// import {MARKETPLACE_ABI, MARKETPLACE_ADDRESS, WETH_ABI, WETH_ADDRESS} from "../lib/config";
// import {chainUrlList} from "../lib/chainUrlList";
// import {useMainContext} from "../context/Context";


export const useWalletConnection = () => {
  // const {userSigner, setUserSigner, setUserAccount, chainId} = useMainContext();

  const [walletData, setWalletData] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // const [contract, setContract] = useState(null);
  // const [wethContract, setWethContract] = useState(null);

  const updateConnectionTimeout = useCallback(() => {
    localStorage.setItem('connectionTimeout', Date.now().toString());
  }, []);

  const encryptPassword = (password) => {
    return CryptoJS.AES.encrypt(password, process.env.REACT_APP_PSW_KEY).toString();
  };

  const decryptPassword = (encrypted) => {
    const pswKey = process.env.REACT_APP_PSW_KEY;
    const bytes = CryptoJS.AES.decrypt(encrypted, pswKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const connectWallet = async (method, credentials) => {
    setIsConnectingWallet(true);
    setConnectionError(null);

    try {
      let result;

      const encryptedPass = encryptPassword(credentials?.password);

      switch (method) {
        case 'mnemonic':
          result = await connectWalletWithMnemonic(credentials?.mnemonic, encryptedPass, credentials?.chainId);

          if(result.error) {
            throw new Error(result.error);
          }

          result.chainId = credentials?.chainId;
          result.secretKey = encryptedPass;
          // await setSignature(result.encryptedJson, encryptedPass)

          break;
        case 'privateKey':
          result = await connectWalletWithPrivateKey(credentials?.privateKey, encryptedPass, credentials?.chainId);

          if(result.error) {
            throw new Error(result.error);
          }

          result.chainId = credentials?.chainId;
          result.secretKey = encryptedPass;
          // await setSignature(result.encryptedJson, encryptedPass)

          break;
        case 'keystore':
          const savedWallet = await decryptWallet(localStorage.getItem('wallet'));
          result = await connectWalletWithKeystore(savedWallet?.encryptedJson, encryptedPass, savedWallet?.chainId);

          if(result.error) {
            throw new Error(result.error);
          }

          result.chainId = savedWallet?.chainId
          result.secretKey = encryptedPass;
          // await setSignature(result.encryptedJson, encryptedPass)

          break;
        case 'browser':
          // Handle browser wallet connection with ethers
          if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new BrowserProvider(window.ethereum);

            const address = accounts[0];
            const balanceWei = await provider.getBalance(address);
            const balanceETH = formatEther(balanceWei);

            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            result = {
              userAccount: address,
              balanceETH: balanceETH, // You would fetch this from the blockchain
              connectionTimeout: Date.now(),
              isBrowserWallet: true,
              chainId: chainId
            };
            console.log('wallet', result, balanceWei)
          } else {
            throw new Error('No browser wallet found');
          }
          break;
        default:
          throw new Error('Invalid connection method');
      }

      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(result), process.env.REACT_APP_PSW_KEY).toString();

      setWalletData(result);
      localStorage.setItem('wallet', encryptedData);
      localStorage.setItem('connectionTimeout', result.connectionTimeout.toString());

      return { success: true };
    } catch (error) {
      setConnectionError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsConnectingWallet(false);
    }
  };


  const disconnect = useCallback(() => {
    setWalletData(null);
    setConnectionError(null);
    // localStorage.removeItem('wallet');
    localStorage.removeItem('connectionTimeout');
  }, []);

  // Tairun MarketPlace starts here


  return {
    walletData,
    isConnectingWallet,
    connectionError,
    connectWallet,
    disconnect,
    updateConnectionTimeout,
    decryptPassword
  };
};
