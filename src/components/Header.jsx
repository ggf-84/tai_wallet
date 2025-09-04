import React, {useEffect, useState} from "react";
import Button from "./Button";
import WalletModal from "./WalletModal";
import {useMainContext} from "../context/Context";
import { useCart } from "../context/CartContext";
import {useLocation, useNavigate} from "react-router-dom";
import WalletPasswordModal from "./WalletPasswordModal";
import {decryptWallet} from "../utils/wallet";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme, wallet, disconnect, showWalletModal, setShowWalletModal, isAdmin} = useMainContext();
  const { cartItems, setIsOpen } = useCart();
  const [savedWallet, setSavedWallet] = useState(null);


  useEffect(() => {
    const existingWallet = decryptWallet(localStorage.getItem('wallet'));
    setSavedWallet(existingWallet);
    console.log(2323, isAdmin)
  }, [disconnect]);

  return (
    <header className="header">
      <div className="container">
        <div>
          <button className="logo" onClick={() => {
            window.location.href = '/'
          }}>
            <h1>TaiRun</h1>
          </button>

          {isAdmin && location.pathname !== '/admin' && <nav className="nav" style={{display: 'inline-block',marginLeft: 20}}>
            <button onClick={() => {
              window.location.href = '/admin'
            }}>Admin</button>
          </nav>}
        </div>


        <nav className="nav">
          <button onClick={() => {
            navigate('/market')
          }}>Marketplace</button>
        </nav>


        <div className="header-actions">
          <div className="cart-action">
            <div onClick={() => setIsOpen(true)} className="header-cart" style={{cursor: cartItems.length === 0 ? 'default' : `pointer`}}>
              🛒 Cart <span className="cart-count">{cartItems.length === 0 ? '' : `${cartItems.length}`}</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
          {wallet ? (
            <div className="wallet-info">
              <div className="address-balance">
                <span>{wallet.userAccount.slice(0, 6)}...{wallet.userAccount.slice(-5)}</span>
                <span>{parseFloat(wallet.balanceETH).toFixed(6)} ETH</span>
              </div>
              <Button onClick={disconnect} variant="secondary">Disconnect</Button>
            </div>
          ) : (
            <Button onClick={() => setShowWalletModal(true)}>Connect Wallet</Button>
          )}
        </div>
      </div>

      { savedWallet && savedWallet.encryptedJson ?
        <WalletPasswordModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} /> :
        <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      }
    </header>
  );
};
export default Header;
