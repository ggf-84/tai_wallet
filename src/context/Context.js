import React, {createContext, useState, useContext, useEffect, use} from 'react';
import {useWalletConnection} from "../hooks/useWalletConnection";
import {decryptWallet, getWalletType} from "../utils/wallet";
import {chainUrlList} from "../lib/chainUrlList";
import {BrowserProvider, Contract, ethers, JsonRpcProvider, Wallet} from "ethers";
import {MARKETPLACE_ABI, MARKETPLACE_ADDRESS, WETH_ABI, WETH_ADDRESS} from "../lib/config";
import {getEthPriceUSD} from "../services/apiService";

const Context = createContext();

export const MainProvider = ({children}) => {

  const [isAdmin, setIsAdmin] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [userSigner, setUserSigner] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [nftCollections, setNftCollections] = useState({});
  const [currentCollectionAddress, setCurrentCollectionAddress] = useState(null);

  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [wethContract, setWethContract] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);

  const [chainId, setChainId] = useState(167000);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [gasLimit, setGasLimit] = useState(20);
  const [ethPriceUSD, setEthPriceUSD] = useState(0);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const toggleTheme = () => setIsDark(!isDark);

  const {connectWallet, walletData, decryptPassword} = useWalletConnection();

  const checkExistingConnection = async () => {
    setProvider(null)
    setUserSigner(null);
    setContract(null);
    setWethContract(null);
    setIsAdmin(false);
    setChainId(167000);
    setWalletType(null);

    const savedWallet = decryptWallet(localStorage.getItem('wallet'));
    const connectionTimeout = localStorage.getItem('connectionTimeout');

    if (savedWallet && connectionTimeout) {
      const timeoutTime = parseInt(connectionTimeout);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (now - timeoutTime < tenMinutes) {
        setWallet(savedWallet);
        await setSignature(
          savedWallet.encryptedJson,
          savedWallet?.secretKey,
          savedWallet?.chainId,
          savedWallet?.isBrowserWallet ? 'browser' : 'keystore'
        )
        await updateConnectionTimeout();
      } else {
        // await localStorage.removeItem('wallet');
        await localStorage.removeItem('connectionTimeout');
      }

      setIsConnecting(false)
    }
  };

  const updateConnectionTimeout = () => {
    localStorage.setItem('connectionTimeout', Date.now().toString());
    setIsConnecting(true)
  };

  const disconnect = () => {
    setWallet(null);
    localStorage.removeItem('connectionTimeout');
    window.location.reload()
  };

  const setSignature = async (encryptedJson, password, chainId, method) => {
    try{
      let signer;
      let prvdr;
      let accountAddres;

      if(method === 'browser') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        prvdr = new ethers.BrowserProvider(window.ethereum);
        signer = await prvdr.getSigner();
        accountAddres = accounts[0];

      } else {
        console.log('walletAddress', method, password );
        const chainUrl = chainUrlList[parseInt(chainId)];
        const decryptedPassword = decryptPassword(password);
        const wallet = await Wallet.fromEncryptedJson(encryptedJson, decryptedPassword);
        prvdr = new JsonRpcProvider(chainUrl);
        signer = wallet.connect(prvdr);
        accountAddres = wallet.address
        // console.log('walletAddress', wallet.address );
      }

      const contract = getContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const wEthContract = getContract(WETH_ADDRESS, WETH_ABI, signer);

      const owner = await contract?.owner();
      // const owner = method !== 'browser' ? await contract?.methods.owner().call() : await contract?.owner();

      setUserAccount(accountAddres);
      setProvider(prvdr)
      setUserSigner(signer);
      setContract(contract);
      setWethContract(wEthContract);
      setIsAdmin(owner?.toLowerCase() === accountAddres?.toLowerCase());

      // console.log(12345, method, encryptedJson, contract, owner, accountAddres, );
      const type = getWalletType();
      setWalletType(type);

      // await initContract(signer, method);
    } catch (err){
      console.error(err)
    }
  };

  function getContract(adr, abi, signerOrProvider) {
    return new ethers.Contract(MARKETPLACE_ADDRESS, abi, signerOrProvider);
  }

  const initContract = async (tairunSigner, method) => {
    const type = getWalletType();
    setWalletType(type);

    if (!tairunSigner) {
      console.warn("⚠️ userSigner not defined");
      return;
    }

    try{

      if (type === 'tairun' || ['keystore','mnemonic','privateKey'].includes(method)) {
        const contr = await new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, tairunSigner);
        const wEthContr = await new Contract(WETH_ADDRESS, WETH_ABI, tairunSigner);

        setContract(contr);
        setWethContract(wEthContr);
      }

      else if (type === 'browser' || method === 'browser') {
        if (typeof window.ethereum === 'undefined') {
          console.warn("⚠️ window.ethereum not found");
          return;
        }

        const prvdr = new BrowserProvider(window.ethereum);
        const signer = await prvdr.getSigner();

        const contr = await new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
        const wEthContr = await new Contract(WETH_ADDRESS, WETH_ABI, signer);

        setContract(contr);
        setProvider(prvdr);
        setWethContract(wEthContr);
      }

      else {
        console.warn('⚠️ Unknown wallet type:', type);
      }
    } catch (err){
      console.log(err.message)
    }
  }

  useEffect(() => {
    (async () => {
      const provider = await new JsonRpcProvider("https://rpc.mainnet.taiko.xyz");
      const marketplaceContract = await new Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );

      setMarketplaceContract(marketplaceContract)
      console.log(1234567890)
    })()

    const weiToUSDCalculate = async () => {
      const ethUSD = await getEthPriceUSD(); // obține cursul actual ETH
      setEthPriceUSD(ethUSD)
    }

    weiToUSDCalculate();
  }, []);


  useEffect(() => {
    (async () => {
      await checkExistingConnection();
    })()
  }, [walletData]);



  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);


  return (
    <Context.Provider value={{
      isAdmin, setIsAdmin,
      userSigner, setUserSigner,
      userAccount, setUserAccount,
      nftCollections, setNftCollections,
      currentCollectionAddress, setCurrentCollectionAddress,
      marketplaceContract,
      contract,
      wethContract,
      showWalletModal,
      setShowWalletModal,
      isDark,
      wallet,
      walletType,
      chainId,
      setChainId,
      isConnecting,
      gasLimit,
      setGasLimit,
      provider,
      setProvider,
      ethPriceUSD,
      setSignature,
      toggleTheme,
      connectWallet,
      disconnect,
      updateConnectionTimeout,
      checkExistingConnection
    }}>
      {children}
    </Context.Provider>
  );
};

export const useMainContext = () => useContext(Context);
