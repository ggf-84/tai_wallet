// components/marketplace/PurchaseModal.js - Purchase Modal Component
import React, {useEffect, useState} from 'react';
import Button from "./Button";
import {Dialog} from "@headlessui/react";
import {useMainContext} from "../context/Context";

const PurchaseModal = ({ isOpen, nft, onClose, onPurchase }) => {
  const [confirmed, setConfirmed] = useState(false);
  const {gasLimit} = useMainContext(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.classList.contains('modal')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !nft) return null;

  return (
  <Dialog open={isOpen} onClose={onClose} className="dialog-container">
    <div className="dialog-overlay" onClick={onClose} />

    <div className="dialog-panel">
      <Dialog.Title className="dialog-title">Buy NFT</Dialog.Title>
      <div className="dialog-content">
        <div className="purchase-info">
          <div className="info">
            <div className="label">Name:</div> <span>{nft.name}</span>
          </div>
          <div className="info">
            <div className="label">Price:</div> <span>{nft.sale.price} ETH</span>
          </div>
          <div className="info">
            <div className="label">Price:</div> <span>{nft.sale.usdPrice.toFixed(2)} USD</span>
          </div>
          <div className="info">
            <div className="label">Gas:</div> <span>{gasLimit}</span>
          </div>
          <div className="info">
            <div className="label">Status:</div> <span>{!confirmed ? 'Initialization...' : 'Processing...'}</span>
          </div>
        </div>

        <div className="purchase-steps">
          <div className="purchase-step">
            <div>{!confirmed ? 'Transaction is preparing...' : 'Processing...'}</div>
          </div>
        </div>
      </div>
      {/*<div className="dialog-actions" style={{gap: 8}}>*/}
        <Button onClick={() => {
          onPurchase();
          setConfirmed(true);
        }}
        disabled={confirmed}
        >
          Confirm To Buy
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      {/*</div>*/}
    </div>
  </Dialog>
  );
};

export default PurchaseModal;
