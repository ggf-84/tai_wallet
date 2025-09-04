import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {useMainContext} from "../../context/Context";

const MarketplaceStats = () => {

  const {userSigner, userAccount, contract} = useMainContext()
  const [fee, setFee] = useState('');
  const [ethFees, setEthFees] = useState('0');
  const [wethFees, setWethFees] = useState('0');
  const [owner, setOwner] = useState('');

  const loadStats = async () => {
    try {
      const feeRaw = await contract.platformFee();
      const ethRaw = await contract.accumulatedETHFees();
      const wethRaw = await contract.accumulatedWETHFees();
      const ownerAddr = await contract.owner();

      setFee((Number(feeRaw) / 100).toFixed(2));
      setEthFees(ethers.formatEther(ethRaw));
      setWethFees(ethers.formatEther(wethRaw));
      setOwner(ownerAddr);
    } catch (err) {
      console.error('Eroare la încărcarea statisticilor:', err);
    }
  };

  useEffect(() => {
    if (userSigner && userAccount) {
      loadStats();
      console.log('admin stats', owner)
    }
  }, [userSigner, userAccount]);

  return (
    <div className="admin-card">
      <h4>Marketplace Stats</h4>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Platform Fee</div>
          <div className="stat-value">{fee}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ETH Fees</div>
          <div className="stat-value">{ethFees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">WETH Fees</div>
          <div className="stat-value">{wethFees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Owner</div>
          <div className="stat-value" >{owner.slice(0, 6)}...{owner.slice(-4)}</div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceStats;
