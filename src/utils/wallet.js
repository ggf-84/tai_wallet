import CryptoJS from 'crypto-js';

export const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, process.env.REACT_APP_PSW_KEY).toString();
};

export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance) => {
  return parseFloat(balance).toFixed(4);
};

// API calls for wallet connection
export const connectWalletWithMnemonic = async (mnemonic, password, chainId = 167000) => {

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/wallet/mnemonic-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mnemonic,
        password: password,
        chainId
      }),
    });

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Connection failed');
  }
};

export const connectWalletWithPrivateKey = async (privateKey, password, chainId = 167000) => {

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/wallet/privatekey-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privateKey,
        password: password,
        chainId
      }),
    });

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Connection failed');
  }
};

export const connectWalletWithKeystore = async (keystoreJson, password, chainId = 167000) => {

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/wallet/keystore-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keystoreJson,
        password: password,
        chainId
      }),
    });

    // if (!response.ok) {
    //   throw new Error('Failed to connect wallet: ' + (response?.details ?? response?.error) ?? 'Check password');
    // }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Connection failed');
  }
};

export const getWalletType = () => {
  const savedWallet = decryptWallet(localStorage.getItem('wallet'));
  const connectionTimeout = localStorage.getItem('connectionTimeout');
  let timeout = false;

  if (!savedWallet) {
    return null;
  }

  if (connectionTimeout) {
    const timeoutTime = parseInt(connectionTimeout);
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    timeout = now - timeoutTime < tenMinutes;
  }

  if (savedWallet.isBrowserWallet === true && timeout) {
    return 'browser';
  }

  if (savedWallet.encryptedJson && timeout) {
    return 'tairun';
  }

  return null;
};

export const decryptWallet = (encrypted) => {
  if (encrypted) {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, process.env.REACT_APP_PSW_KEY);
      const decryptedJson = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedJson)
    } catch (err) {
      return null
    }
  }
};


// Tairun MarketPlace starts here

