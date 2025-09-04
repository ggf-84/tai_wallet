import React, {useState} from "react";
import Button from "./Button";
import Toast from "./Toast";
import Modal from "./Modal";
import {useMainContext} from "../context/Context";
import {decryptWallet, encryptPassword} from "../utils/wallet";

const WalletModal = ({ isOpen, onClose }) => {
  const { connectWallet, isConnecting, setChainId } = useMainContext();
  const [activeTab, setActiveTab] = useState('browser');
  const [formData, setFormData] = useState({
    mnemonic: '',
    privateKey: '',
    keystoreJson: '',
    password: '',
    chainId: 167000
  });
  const [toast, setToast] = useState(null);

  const handleConnect = async () => {
    const result = await connectWallet(activeTab, formData)

    if (result.success) {
      setToast({ message: 'Wallet connected successfully!', type: 'success' });
      onClose();
    } else {
      setToast({ message: result.error, type: 'error' });
    }
  };

  const handleChangeTab = (tabId) => {
    setActiveTab(tabId);
    resetFormData()
  };

  const resetFormData = () => {
    setFormData({
      mnemonic: '',
      privateKey: '',
      keystoreJson: '',
      password: '',
      chainId: 167000
    });
  };

  const SelectChain = () => {
    return (<select
      value={formData.chainId}
      onChange={(e) => {
        setFormData({...formData, chainId: parseInt(e.target.value)});
        setChainId(parseInt(e.target.value));
      }
      }
    >
      <option value="167000">Taiko</option>
      <option value="1">Ethereum</option>
      <option value="137">Polygon</option>
      <option value="5000">Linea</option>
    </select>);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
        <div className="wallet-tabs">
          <button
            className={activeTab === 'browser' ? 'tab active' : 'tab'}
            onClick={() => handleChangeTab('browser')}
          >
            Browser Wallet
          </button>
          <button
            className={activeTab === 'mnemonic' ? 'tab active' : 'tab'}
            onClick={() => handleChangeTab('mnemonic')}
          >
            Recovery Phrase
          </button>
          <button
            className={activeTab === 'privateKey' ? 'tab active' : 'tab'}
            onClick={() => handleChangeTab('privateKey')}
          >
            Private Key
          </button>
        </div>

        <div className="wallet-form">
          {activeTab === 'browser' && (
            <div className="wallet-form-block">
              <p>Connect using MetaMask, OKX, or other browser wallets</p>
            </div>
          )}

          {activeTab === 'mnemonic' && (
            <div className="wallet-form-block">
              <SelectChain />
              <textarea
                placeholder="Enter your 12-word recovery phrase"
                value={formData.mnemonic}
                onChange={(e) => setFormData({...formData, mnemonic: e.target.value})}
              />
              <input
                type="text"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}

          {activeTab === 'privateKey' && (
            <div className="wallet-form-block">
              <SelectChain />
              <input
                type="text"
                placeholder="Private Key"
                value={formData.privateKey}
                onChange={(e) => setFormData({...formData, privateKey: e.target.value})}
              />
              <input
                type="text"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}

          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
export default WalletModal;
