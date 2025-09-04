import React, {useState} from "react";
import Button from "./Button";
import Toast from "./Toast";
import Modal from "./Modal";
import {useMainContext} from "../context/Context";
import {decryptWallet, encryptPassword} from "../utils/wallet";

const WalletPasswordModal = ({ isOpen, onClose }) => {
  const { connectWallet, isConnecting, disconnect} = useMainContext();

  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    password: ''
  });

  const handleConnect = async () => {
    const result = await connectWallet('keystore', formData)

    if (result.success) {
      setToast({ message: 'Wallet connected successfully!', type: 'success' });
      onClose();
    } else {
      setToast({ message: result.error, type: 'error' });
    }
  };

  const resetConnection = async () => {
    await disconnect()
    localStorage.removeItem('wallet');
    setToast({ message: 'Wallet data were removed successfully!', type: 'success' });
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
        <div className="wallet-form">
          <p className="p-wallet">Enter the password to connect on your existing wallet!</p>
          <div className="wallet-form-block">
            <input
              type="text"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <Button onClick={handleConnect} disabled={isConnecting} variant="secondary">
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>

          <Button onClick={resetConnection}>
            Reset Connection
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
export default WalletPasswordModal;


















