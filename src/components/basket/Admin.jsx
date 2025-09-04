import React, {useEffect, useState} from "react";
import {useMainContext} from "../context/Context";
import {MARKETPLACE_ADDRESS} from "../lib/config";
import {formatUnits} from "ethers";
import Toast from "./Toast";

const Admin = () => {
  const {
    userAccount,
    contract,
    setShowWalletModal,
    walletType,
    nftCollections,
    setNftCollections,
    isDark,
    isAdmin,
  } = useMainContext();


  const [toast, setToast] = useState(null);

  // const [activeSection, setActiveSection] = useState('collections');
  //
  // const handleAddCollection = () => {
  //   console.log('Add collection');
  // };
  //
  // const handleDeleteCollection = () => {
  //   console.log('Delete collection');
  // };
  //
  // const handleExportCSV = () => {
  //   console.log('Export CSV');
  // };
  //
  // const handleExportJSON = () => {
  //   console.log('Export JSON');
  // };
  //
  // const handleWithdrawFees = () => {
  //   console.log('Withdraw fees');
  // };


  useEffect(() => {
    if(isAdmin){
      const COLLECTIONS = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');
      setNftCollections(COLLECTIONS);
      // console.log(777, nftCollections)

      loadAdminData();
    }
  }, []);


  // useEffect(() => {
  //   const initApp = async () => {
  //     if (contract) {
  //       try {
  //         const owner = walletType === 'tairun' ?
  //           await contract?.owner() :
  //           await contract?.methods.owner().call();
  //
  //         const ownerIsAdmin = owner.toLowerCase() === userAccount.toLowerCase();
  //         setIsAdmin(ownerIsAdmin)
  //
  //         if (ownerIsAdmin) {
  //           // updateWalletUI();
  //           loadAdminData();
  //         }
  //
  //       } catch (error) {
  //         console.log('Could not check admin status:', error);
  //       }
  //     }
  //   };
  //
  //   initApp().then(r => contract);
  // }, [contract]);


  const loadAdminData = async () => {
    await Promise.all([
      loadMarketplaceStats(),
      loadRecentActivity(),
      loadStorageInfo(),
      loadDailyStats()
    ]);
  }

  // const updateWalletUI = () => {
  //   const connectButton = document.getElementById('connectWallet');
  //   const walletInfo = document.getElementById('walletInfo');
  //   const walletAddress = document.getElementById('walletAddress');
  //   const contractStatus = document.getElementById('contractStatus');
  //   const connectionMode = document.getElementById('connectionMode');
  //
  //   if (connectButton) connectButton.style.display = 'none';
  //   if (walletInfo) walletInfo.style.display = 'block';
  //   if (walletAddress) {
  //     walletAddress.textContent = userAccount.substring(0, 6) + '...' + userAccount.substring(38);
  //   }
  //
  //   // Show connection mode
  //   if (connectionMode) {
  //     connectionMode.textContent = walletType === 'tairun' ?
  //       'Tairun Wallet' : '🦊 Browser Wallet';
  //   }
  //
  //
  //   const walletBalance = document.getElementById('walletBalance');
  //   getWalletBalance().then(balance => {
  //     if (walletBalance) {
  //       const ethValue = formatEther(balance);
  //       walletBalance.textContent = parseFloat(ethValue).toFixed(5) + ' ETH';
  //     }
  //   });
  //
  //
  //   if (contractStatus) {
  //     contractStatus.textContent = '✅ Contract Connected';
  //     contractStatus.style.color = '#28a745';
  //   }
  // }

  // async function getWalletBalance() {
  //   const chainUrl = chainUrlList[parseInt(chainId)];
  //   const provider = new JsonRpcProvider(chainUrl);
  //
  //   try {
  //     if (walletType === 'tairun') {
  //       return await provider.getBalance(userAccount);
  //     }
  //
  //     if (userSigner?.provider) {
  //       return await userSigner.provider.getBalance(userAccount);
  //     }
  //
  //     return await provider.getBalance(userAccount);
  //   } catch (err) {
  //     console.error("❌ Error fetching balance:", err);
  //     return 0n;
  //   }
  // }


  async function loadMarketplaceStats() {
    if (!contract || !isAdmin) return;

    try {
      // Load real stats from contract
      const platformFee = walletType === 'tairun' ?
        await contract.platformFee() :
        await contract.methods.platformFee().call();

      const ethFees = walletType === 'tairun' ?
        await contract.accumulatedETHFees() :
        await contract.methods.accumulatedETHFees().call();

      const wethFees = walletType === 'tairun' ?
        await contract.accumulatedWETHFees() :
        await contract.methods.accumulatedWETHFees().call();

      const owner = walletType === 'tairun' ?
        await contract.owner() :
        await contract.methods.owner().call();

      // Calculate real stats from localStorage
      const signatureListings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');

      const activeListings = signatureListings.filter(listing =>
        listing.listing.deadline > Math.floor(Date.now() / 1000)
      ).length;

      //need to be modified currentConnectionMode === CONNECTION_MODES.KEYSTORE
      const totalSales = activity.filter(act => act.type === 'sold').length;
      const totalListings = signatureListings.length;
      // const totalFeesETH = parseFloat(web3.utils.fromWei(ethFees, 'ether'));
      // const totalFeesWETH = parseFloat(web3.utils.fromWei(wethFees, 'ether'));

      const totalFeesETH = parseFloat(formatUnits(ethFees, 'ether'));
      const totalFeesWETH = parseFloat(formatUnits(wethFees, 'ether'));
      console.log(555, totalFeesETH, totalListings )
      // Update UI with real data
      document.getElementById('totalListings').textContent = totalListings;
      document.getElementById('totalSales').textContent = totalSales;
      document.getElementById('activeListings').textContent = activeListings;
      document.getElementById('totalFees').textContent = (totalFeesETH + totalFeesWETH).toFixed(4);

      document.getElementById('currentFee').textContent = (Number(platformFee) / 100) + '%';
      document.getElementById('availableETHFees').textContent = totalFeesETH.toFixed(4);
      document.getElementById('availableWETHFees').textContent = totalFeesWETH.toFixed(4);

      // renderCurrentCollections();

    } catch (error) {
      console.error('Error loading marketplace stats:', error);

      // Fallback to localStorage-only stats if contract calls fail
      const signatureListings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');

      const activeListings = signatureListings.filter(listing =>
        listing.listing.deadline > Math.floor(Date.now() / 1000)
      ).length;

      document.getElementById('totalListings').textContent = signatureListings.length;
      document.getElementById('totalSales').textContent = activity.filter(act => act.type === 'sold').length;
      document.getElementById('activeListings').textContent = activeListings;
      document.getElementById('totalFees').textContent = '0.0000';

      // renderCurrentCollections();
    }
  }

  function loadRecentActivity() {
    try {
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const recentActivity = activity.slice(0, 10); // Last 10 activities

      const container = document.getElementById('recentActivity');

      if (container) {
        if (recentActivity.length === 0) {
          container.innerHTML = '<div class="loading">No recent activity</div>';
          return false;
        }

        container.innerHTML = '';

        recentActivity.forEach(act => {
          const item = document.createElement('div');

          item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; background: white; border-radius: 6px; border-left: 4px solid #667eea;';

          const time = new Date(act.time);

          item.innerHTML = `
                <div>
                    <strong>${act.type.toUpperCase()}</strong> - ${act.nft || 'Unknown NFT'}<br>
                    <small style="color: #666;">
                        ${act.user ? `User: ${act.user.substring(0, 10)}...` : ''}
                        ${act.price ? ` | Price: ${act.price} ETH` : ''}
                        ${act.method ? ` | Method: ${act.method}` : ''}
                    </small>
                </div>
                <div style="text-align: right; color: #999; font-size: 12px;">
                    ${time.toLocaleDateString()}<br>
                    ${time.toLocaleTimeString()}
                </div>
            `;

          container.appendChild(item);
        });
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);

      const recentActivityId = document.getElementById('recentActivity')
      if (recentActivityId) {
        recentActivityId.innerHTML = '<div class="error">Error loading activity</div>';
      }
    }
  }

  function loadDailyStats() {
    try {
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const today = new Date().toDateString();

      const todayActivity = activity.filter(act =>
        new Date(act.time).toDateString() === today
      );

      const todaySales = todayActivity.filter(act => act.type === 'sold').length;
      const todayListings = todayActivity.filter(act => act.type === 'listed').length;
      const todayOffers = todayActivity.filter(act => act.type === 'offer_made').length;
      const todayCancellations = todayActivity.filter(act => act.type === 'cancelled').length;

      // document.getElementById('todaySales').textContent = todaySales;
      // document.getElementById('todayListings').textContent = todayListings;
      // document.getElementById('todayOffers').textContent = todayOffers;
      // document.getElementById('todayCancellations').textContent = todayCancellations;

      const todaySalesId = document.getElementById('todaySales')
      if (todaySalesId) {
        todaySalesId.textContent = todaySales;
      }

      const todayListingsId = document.getElementById('todayListings')
      if (todayListingsId) {
        todayListingsId.textContent = todayListings;
      }

      const todayOffersId = document.getElementById('todayOffers')
      if (todayOffersId) {
        todayOffersId.textContent = todayOffers;
      }

      const todayCancellationsId = document.getElementById('todayCancellations')
      if (todayCancellationsId) {
        todayCancellationsId.textContent = todayCancellations;
      }

    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  }

  function loadStorageInfo() {
    try {
      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const offers = JSON.parse(localStorage.getItem('marketplace_offers') || '[]');
      const collections = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');

      const storageListings = document.getElementById('storageListings')
      if (storageListings) {
        storageListings.textContent = listings.length;
      }

      const storageActivity = document.getElementById('storageActivity')
      if (storageActivity) {
        storageActivity.textContent = activity.length;
      }

      const storageOffers = document.getElementById('storageOffers')
      if (storageOffers) {
        storageOffers.textContent = offers.length;
      }

      const storageCollections = document.getElementById('storageCollections')
      if (storageCollections) {
        storageCollections.textContent = Object.keys(collections).length;
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  }

  const addCollectionState = (address, collectionData) => {
    setNftCollections(prev => {
      const updated = {
        ...prev,
        [address]: collectionData
      };

      localStorage.setItem('marketplace_collections', JSON.stringify(updated));
      return updated;
    });
  };

  const addCollection = async () => {
    const address = document.getElementById('newCollectionAddress').value.trim();
    const name = document.getElementById('newCollectionName').value.trim();
    const description = document.getElementById('newCollectionDescription').value.trim();
    const avatar = document.getElementById('newCollectionAvatar').value.trim();

    if (!address || !name) {
      setToast({message: 'Please fill in at least address and name', type: 'error'});
      return false;
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setToast({message: 'Please enter a valid Ethereum address', type: 'error'});
      return false;
    }

    if (nftCollections[address.toLowerCase()]) {
      setToast({message: 'Collection already exists', type: 'error'});
      return false;
    }

    addCollectionState(address.toLowerCase(), {
      name: name,
      description: description || 'New NFT collection',
      avatar: avatar || '🎨'
    });

    // Clear form
    document.getElementById('newCollectionAddress').value = '';
    document.getElementById('newCollectionName').value = '';
    document.getElementById('newCollectionDescription').value = '';
    document.getElementById('newCollectionAvatar').value = '';

    setToast({message: 'Collection added successfully!', type: 'success'});

    // renderCurrentCollections();
    loadStorageInfo();
  }

  function removeCollection(address) {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to remove this collection? This action cannot be undone.')) {
      setNftCollections(prev => {
        const updated = {...prev};
        delete updated[address];
        return updated;
      });
      localStorage.setItem('marketplace_collections', JSON.stringify(nftCollections));

      setToast({message: 'Collection removed successfully!', type: 'success'});
      // renderCurrentCollections();
      loadStorageInfo();
    }
  }

  async function updatePlatformFee() {
    const newFee = document.getElementById('newPlatformFee').value;
    if (!newFee || !contract || !isAdmin) return;

    try {
      const feeBasisPoints = Math.floor(parseFloat(newFee) * 100);
      if (feeBasisPoints < 0 || feeBasisPoints > 1000) {
        setToast({message: 'Fee must be between 0% and 10%', type: 'error'});
        return;
      }

      setToast({message: 'Updating platform fee..', type: 'success'});

      if (walletType === 'tairun') {
        const tx = await contract.setPlatformFee(feeBasisPoints); // ethers.js
        await tx.wait();
      } else if (walletType === 'browser') {
        await contract.methods.setPlatformFee(feeBasisPoints).send({from: userAccount});
      } else {
        setShowWalletModal(true)
      }

      setToast({message: 'Platform fee updated successfully!', type: 'success'});
      await loadMarketplaceStats();

    } catch (error) {
      console.error('Error updating platform fee:', error);
      setToast({message: 'Error updating platform fee: ' + error.message, type: 'error'});

    }
  }


  async function claimETHFees() {
    if (!contract || !isAdmin || !userAccount) {
      setToast({message: 'Admin access required', type: 'error'});
      return;
    }

    try {
      console.log('Checking ETH fees...');

      // Check available fees first
      const availableFees = walletType === 'tairun' ?
        await contract.accumulatedETHFees() :
        await contract.methods.accumulatedETHFees().call();

      //currentConnectionMode === CONNECTION_MODES.KEYSTORE web3
      const feesETH = parseFloat(formatUnits(availableFees, 'ether'));

      console.log('Available ETH fees:', feesETH);

      if (feesETH === 0) {
        setToast({message: 'No ETH fees available to claim', type: 'error'});
        return;
      }

      // eslint-disable-next-line no-restricted-globals
      if (confirm(`Claim ${feesETH.toFixed(4)} ETH in platform fees?`)) {
        setToast({message: 'Claiming ETH fees...', type: 'success'});

        let tx;
        if (walletType === 'tairun') {
          tx = await contract.claimETHFees(); // ethers.js
          await tx.wait();
        } else {
          tx = await contract.methods.claimETHFees().send({from: userAccount});
        }
        console.log('Claim ETH fees transaction:', tx);

        setToast({message: `✅ Successfully claimed ${feesETH.toFixed(4)} ETH fees!`, type: 'success'});

        // Refresh stats after a delay
        setTimeout(() => {
          loadMarketplaceStats();
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming ETH fees:', error);

      let errorMessage = 'Error claiming ETH fees: ';
      if (error.message.includes('revert')) {
        errorMessage += 'Transaction reverted. Check admin permissions.';
      } else {
        errorMessage += error.message;
      }

      setToast({message: errorMessage, type: 'error'});
    }
  }

  async function claimWETHFees() {
    if (!contract || !isAdmin || !userAccount) {
      setToast({message: 'Admin access required', type: 'error'});
      return;
    }

    try {
      console.log('Checking WETH fees...');

      // Check available fees first
      const availableFees = walletType === 'tairun' ?
        await contract.accumulatedWETHFees() :
        await contract.methods.accumulatedWETHFees().call();

      //currentConnectionMode === CONNECTION_MODES.KEYSTORE web3
      const feesWETH = parseFloat(formatUnits(availableFees, 'ether'));

      console.log('Available WETH fees:', feesWETH);

      if (feesWETH === 0) {
        setToast({message: 'No WETH fees available to claim', type: 'error'});
        return;
      }

      // eslint-disable-next-line no-restricted-globals
      if (confirm(`Claim ${feesWETH.toFixed(4)} WETH in platform fees?`)) {
        setToast({message: 'Claiming WETH fees...', type: 'success'});

        let tx;
        if (walletType === 'tairun') {
          // 🔹 Ethers.js (wallet conectat intern)
          tx = await contract.claimWETHFees();
          await tx.wait();
        } else {
          // 🔹 Web3.js (MetaMask/browser wallet)
          tx = await contract.methods.claimWETHFees().send({from: userAccount});
        }


        console.log('Claim WETH fees transaction:', tx);

        setToast({message: `✅ Successfully claimed ${feesWETH.toFixed(4)} WETH fees!`, type: 'success'});

        // Refresh stats after a delay
        setTimeout(() => {
          loadMarketplaceStats();
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming WETH fees:', error);

      let errorMessage = 'Error claiming WETH fees: ';
      if (error.message.includes('revert')) {
        errorMessage += 'Transaction reverted. Check admin permissions.';
      } else {
        errorMessage += error.message;
      }

      setToast({message: errorMessage, type: 'error'});
    }
  }


// Data Management
  async function refreshMarketplaceData() {
    setToast({message: 'Refreshing marketplace data...', type: 'success'});
    await loadAdminData();
    setToast({message: 'Data refreshed!', type: 'success'});
  }

  function exportAllData() {
    try {
      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const offers = JSON.parse(localStorage.getItem('marketplace_offers') || '[]');
      const collections = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');

      const exportData = {
        exportDate: new Date().toISOString(),
        adminAddress: userAccount,
        marketplace: {
          address: MARKETPLACE_ADDRESS,
          collections: collections,
          statistics: {
            totalListings: listings.length,
            totalActivity: activity.length,
            totalOffers: offers.length,
            totalCollections: Object.keys(collections).length
          }
        },
        data: {
          listings: listings,
          activity: activity,
          offers: offers,
          collections: collections
        }
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketplace_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setToast({message: '📥 All marketplace data exported successfully!', type: 'success'});

    } catch (error) {
      console.error('Error exporting data:', error);
      setToast({message: 'Error exporting data: ' + error.message, type: 'error'});
    }
  }

  function clearOldData() {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('This will remove activity older than 30 days. Continue?')) return;

    try {
      const removedActivity = clearOldActivity(30);

      setToast({message: `🧹 Cleared ${removedActivity} old activity records`, type: 'success'});
      loadAdminData();

    } catch (error) {
      console.error('Error clearing old data:', error);
      setToast({message: 'Error clearing old data: ' + error.message, type: 'error'});
    }
  }

// Analytics & Reports
  function exportActivityReport() {
    try {
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');

      if (activity.length === 0) {
        alert('No activity data to export');
        return;
      }

      // Create detailed report
      const report = {
        reportDate: new Date().toISOString(),
        reportType: 'Activity Report',
        totalActivities: activity.length,
        summary: {
          sales: activity.filter(a => a.type === 'sold').length,
          listings: activity.filter(a => a.type === 'listed').length,
          offers: activity.filter(a => a.type === 'offer_made').length,
          cancellations: activity.filter(a => a.type === 'cancelled').length
        },
        volumeAnalysis: {
          totalVolume: activity.reduce((sum, a) => sum + (a.price || 0), 0),
          averagePrice: activity.length > 0 ? activity.reduce((sum, a) => sum + (a.price || 0), 0) / activity.length : 0
        },
        activities: activity
      };

      const jsonContent = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonContent], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setToast({message: '📊 Activity report exported successfully!', type: 'success'});

    } catch (error) {
      console.error('Error exporting activity report:', error);
      setToast({message: 'Error exporting activity report: ' + error.message, type: 'error'});
    }
  }

  function exportCollectionReport() {
    try {
      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const collections = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');

      const collectionStats = {};

      Object.entries(collections).forEach(([address, collection]) => {
        const collectionListings = listings.filter(l =>
          l.listing.nftContract.toLowerCase() === address.toLowerCase()
        );
        const collectionActivity = activity.filter(a =>
          a.collection && a.collection.toLowerCase() === address.toLowerCase()
        );
        const collectionSales = collectionActivity.filter(a => a.type === 'sold');

        collectionStats[address] = {
          name: collection.name,
          description: collection.description,
          avatar: collection.avatar,
          statistics: {
            totalListings: collectionListings.length,
            activeListings: collectionListings.filter(l =>
              l.listing.deadline > Math.floor(Date.now() / 1000)
            ).length,
            totalSales: collectionSales.length,
            totalVolume: collectionSales.reduce((sum, s) => sum + (s.price || 0), 0),
            floorPrice: collectionListings.length > 0 ?
              Math.min(...collectionListings.map(l => l.priceETH || 0)) : 0
          }
        };
      });

      const report = {
        reportDate: new Date().toISOString(),
        reportType: 'Collection Report',
        totalCollections: Object.keys(collections).length,
        collectionStats: collectionStats
      };

      const jsonContent = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonContent], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collection_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setToast({message: '📈 Collection report exported successfully!', type: 'success'});

    } catch (error) {
      console.error('Error exporting collection report:', error);
      setToast({message: 'Error exporting collection report: ' + error.message, type: 'error'});
    }
  }

// Data Cleanup Functions
  function cleanupExpiredListings() {
    try {
      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const currentTime = Math.floor(Date.now() / 1000);

      const activeListing = listings.filter(listing =>
        listing.listing.deadline > currentTime
      );

      const removedCount = listings.length - activeListing.length;

      localStorage.setItem('signature_listings', JSON.stringify(activeListing));

      setToast({message: `🧹 Cleaned up ${removedCount} expired listings`, type: 'success'});
      loadAdminData();

    } catch (error) {
      console.error('Error cleaning expired listings:', error);
      setToast({message: 'Error cleaning expired listings: ' + error.message, type: 'error'});
    }
  }

  function cleanupOldActivity() {
    try {
      const removedCount = clearOldActivity(30);
      setToast({message: `📅 Cleaned up ${removedCount} old activity records`, type: 'success'});
      loadAdminData();

    } catch (error) {
      console.error('Error cleaning old activity:', error);
      setToast({message: 'Error cleaning old activity: ' + error.message, type: 'error'});
    }
  }

  function resetAllData() {

    // eslint-disable-next-line no-restricted-globals
    if (!confirm('⚠️ WARNING: This will permanently delete ALL marketplace data including listings, activity, and offers. This action CANNOT be undone!\n\nType "RESET" to confirm:')) {
      return;
    }

    const confirmation = prompt('Type "RESET" to confirm deletion of all data:');
    if (confirmation !== 'RESET') {
      setToast({message: 'Reset cancelled', type: 'success'});
      return;
    }

    try {
      // Clear all localStorage data except collections (admin managed)
      localStorage.removeItem('signature_listings');
      localStorage.removeItem('marketplace_activity');
      localStorage.removeItem('marketplace_offers');
      localStorage.removeItem('marketplace_cart');

      setToast({message: '🗑️ All marketplace data has been reset!', type: 'error'});
      loadAdminData();

    } catch (error) {
      console.error('Error resetting data:', error);
      setToast({message: 'Error resetting data: ' + error.message, type: 'error'});
    }
  }

  function clearOldActivity(daysToKeep = 30) {
    try {
      const activities = loadGlobalActivity();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filteredActivities = activities.filter(act =>
        new Date(act.time) >= cutoffDate
      );

      localStorage.setItem('marketplace_activity', JSON.stringify(filteredActivities));

      const removedCount = activities.length - filteredActivities.length;
      console.log(`🧹 Cleared ${removedCount} old activity records`);

      return removedCount;

    } catch (error) {
      console.error('Error clearing old activity:', error);
      return 0;
    }
  }

  function loadGlobalActivity() {
    try {
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      return activity.map(act => ({
        ...act,
        time: new Date(act.time)
      }));
    } catch (error) {
      console.error('Error loading global activity:', error);
      return [];
    }
  }


  // const [password, setPassword] = useState('');
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const handleLogin = () => {
  //   // Mock admin password check
  //   if (password === 'admin123') {
  //     setIsAuthenticated(true);
  //   } else {
  //     alert('Invalid password');
  //   }
  // };
  //
  // if (!isAuthenticated) {
  //   return (
  //     <div className="admin-login">
  //       <div className="container">
  //         <div className="login-form">
  //           <h1>Admin Login</h1>
  //           <input
  //             type="password"
  //             placeholder="Admin Password"
  //             value={password}
  //             onChange={(e) => setPassword(e.target.value)}
  //           />
  //           <Button onClick={handleLogin}>Login</Button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  //


  return (
    <div className="tairun-container">
      {isAdmin && <div id="adminContent" className="content-section">
        <h2>⚙️ Marketplace Administration</h2>
        <p style={{marginBottom: '20px', color: '#666'}}>Manage collections, fees, and marketplace settings</p>

        <div className="stats-grid">
          {['totalListings', 'totalSales', 'activeListings', 'totalFees'].map((id, index) => (
            <div className="stat-card" key={id}>
              <div className="stat-value" id={id}>0</div>
              <div className="stat-label">
                {['Total Listings', 'Total Sales', 'Active Listings', 'Fees Collected (ETH)'][index]}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-grid">
          {/* Collection Management */}
          <div className="admin-card">
            <h4>🎨 Collection Management</h4>
            <div className="form-group">
              <label>Contract Address:</label>
              <input type="text" id="newCollectionAddress" className="form-input" placeholder="0x..." maxLength="42"/>
            </div>
            <div className="form-group">
              <label>Collection Name:</label>
              <input type="text" id="newCollectionName" className="form-input" placeholder="My Collection"/>
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea id="newCollectionDescription" className="form-input" rows="3"
                        placeholder="Description..."></textarea>
            </div>
            <div className="form-group">
              <label>Avatar Emoji:</label>
              <input type="text" id="newCollectionAvatar" className="form-input" placeholder="collection image url"/>
            </div>
            <button className="btn btn-success" onClick={() => addCollection()}>✅ Add Collection</button>

            <h5 style={{margin: '30px 0 0 0', color: '#374151'}}>Current Collections:</h5>
            <div className="collections-list">
              <div id="currentCollections">
                {Object.entries(nftCollections).length > 0 ? (
                  Object.entries(nftCollections).map(([address, collection]) => (
                    <div className="collection-item" key={address}>
                      <div className="collection-item-info">
                        <h5>{collection.name}</h5>
                        <img src={collection.avatar} width={150} alt={collection.name}/>
                        <p>{collection.description}</p>
                        <small style={{fontSize: '0.77rem', color: '#999'}}>{address}</small>
                      </div>
                      <button className="btn btn-danger btn-small" onClick={() => removeCollection(address)}>Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="loading">No collections added yet</div>
                )}

              </div>
            </div>
          </div>

          {/* Fee Management */}
          <div className="admin-card">
            <h4>💰 Fee Management</h4>
            <div className="form-group">
              <label>Platform Fee (%):</label>
              <input type="number" id="newPlatformFee" className="form-input" placeholder="2.5" step="0.1" min="0"
                     max="10"/>
              <small style={{color: '#666'}}>Current fee: <span id="currentFee">2.5%</span></small>
            </div>
            <button className="btn btn-warning" onClick={() => updatePlatformFee()}>💱 Update Fee</button>

            <div className="form-group" style={{marginTop: '30px'}}>
              <label>Available ETH Fees:</label>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
                margin: '10px 0',
                textAlign: 'center',
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <span id="availableETHFees">0.0000</span> ETH
              </div>
            </div>
            <button className="btn btn-success" onClick={() => claimETHFees()}>💰 Claim ETH Fees</button>

            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Available WETH Fees:</label>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#667eea',
                margin: '10px 0',
                textAlign: 'center',
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <span id="availableWETHFees">0.0000</span> WETH
              </div>
            </div>
            <button className="btn btn-success" onClick={() => claimWETHFees()}>💰 Claim WETH Fees</button>
          </div>

          {/* Marketplace Controls */}
          <div className="admin-card">
            <h4>🎛️ Marketplace Controls</h4>
            <div className="form-group">
              <label>Quick Actions:</label>
              <button className={`btn btn-secondary`} onClick={() => refreshMarketplaceData()}
                      style={{marginBottom: '5px', width: '100%'}}>
                🔄 Refresh Data
              </button>
              <button className={`btn btn-warning`} onClick={() => exportAllData()}
                      style={{marginBottom: '5px', width: '100%'}}>
                📥 Export All Data
              </button>
              <button className={`btn btn-danger`} onClick={() => clearOldData()}
                      style={{marginBottom: '5px', width: '100%'}}>
                🧹 Clear Old Data
              </button>
            </div>

            <div className="form-group">
              <label>Contract Info:</label>
              <div style={{
                background: isDark ? '#607d8b' : '#e5e5e5',
                padding: '15px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                wordBreak: 'break-word'
              }}>
                <strong>Address:</strong><br/>
                <span>{MARKETPLACE_ADDRESS}</span><br/><br/>
                <strong>Owner:</strong><br/>
                <span>{userAccount.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="admin-card">
            <h4>📊 Analytics & Reports</h4>
            <div className="form-group">
              <label>Activity Overview:</label>
              <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                  {['todaySales', 'todayListings'].map((id, idx) => (
                    <div style={{textAlign: 'center'}} key={id}>
                      <div style={{fontSize: '20px', fontWeight: 'bold', color: idx === 0 ? '#28a745' : '#667eea'}}
                           id={id}>0
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>{idx === 0 ? "Today's Sales" : "Today's Listings"}</div>
                    </div>
                  ))}
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  {['todayOffers', 'todayCancellations'].map((id, idx) => (
                    <div style={{textAlign: 'center'}} key={id}>
                      <div style={{fontSize: '20px', fontWeight: 'bold', color: idx === 0 ? '#ffc107' : '#dc3545'}}
                           id={id}>0
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>{idx === 0 ? "Today's Offers" : "Today's Cancellations"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <button className="btn btn-secondary" onClick={() => exportActivityReport()} style={{flex: 1}}>📊 Export
                Activity
              </button>
              <button className="btn btn-secondary" onClick={() => exportCollectionReport()} style={{flex: 1}}>📈
                Collection Report
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="admin-card">
            <h4>🔧 System Health</h4>
            <div className="form-group">
              <label>Storage Usage:</label>
              <div style={{background: isDark ? '#607d8b' : '#e5e5e5', padding: '15px', borderRadius: '8px'}}>
                {['Signature Listings', 'Activity Records', 'Offers', 'Collections'].map((label, idx) => (
                  <div style={{marginBottom: '10px'}} key={label}>
                    <strong>{label}:</strong> <span id={`storage${label.replace(/\s/g, '')}`}>0</span> items
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Data Maintenance:</label>
              <button className={`btn btn-warning`} onClick={() => cleanupExpiredListings()}
                      style={{marginBottom: '5px', width: '100%'}}>
                🧹 Clean Expired Listings
              </button>
              <button className={`btn btn-warning`} onClick={() => cleanupOldActivity()}
                      style={{marginBottom: '5px', width: '100%'}}>
                📅 Clean Old Activit
              </button>
              <button className={`btn btn-danger`} onClick={() => resetAllData()}
                      style={{marginBottom: '5px', width: '100%'}}>
                🗑️ Reset All Data
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-card" style={{gridColumn: '1 / -1'}}>
            <h4>📋 Recent Marketplace Activity</h4>
            <div style={{
              background: isDark ? '#607d8b' : '#e5e5e5',
              padding: '15px',
              borderRadius: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              <div id="recentActivity">
                <div className="loading">Loading recent activity...</div>
              </div>
            </div>
          </div>
        </div>

        <div id="adminMessage"></div>
      </div>}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );

  // return (
  //   <div className="admin-panel">
  //     <div className="container">
  //       <h1>Admin Panel</h1>
  //
  //       <div className="admin-tabs">
  //         <button
  //           className={activeSection === 'collections' ? 'tab active' : 'tab'}
  //           onClick={() => setActiveSection('collections')}
  //         >
  //           Collections
  //         </button>
  //         <button
  //           className={activeSection === 'activities' ? 'tab active' : 'tab'}
  //           onClick={() => setActiveSection('activities')}
  //         >
  //           Activities
  //         </button>
  //         <button
  //           className={activeSection === 'fees' ? 'tab active' : 'tab'}
  //           onClick={() => setActiveSection('fees')}
  //         >
  //           Fees
  //         </button>
  //       </div>
  //
  //       {activeSection === 'collections' && (
  //         <div className="admin-collections">
  //           <div className="admin-actions">
  //             <input type="text" placeholder="Contract Address" />
  //             <Button onClick={handleAddCollection}>Add Collection</Button>
  //             <Button onClick={handleDeleteCollection} variant="secondary">Delete Selected</Button>
  //           </div>
  //           <div className="collections-list">
  //             {mockCollections.map(collection => (
  //               <div key={collection.id} className="admin-collection-item">
  //                 <span>{collection.name}</span>
  //                 <span>{collection.contractAddress}</span>
  //                 <Button variant="secondary">Remove</Button>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       )}
  //
  //       {activeSection === 'activities' && (
  //         <div className="admin-activities">
  //           <div className="admin-actions">
  //             <input type="date" />
  //             <Button onClick={handleExportCSV}>Export CSV</Button>
  //             <Button onClick={handleExportJSON}>Export JSON</Button>
  //           </div>
  //           <p>Activity data will be displayed here</p>
  //         </div>
  //       )}
  //
  //       {activeSection === 'fees' && (
  //         <div className="admin-fees">
  //           <div className="fee-balance">
  //             <h2>Commission Balance</h2>
  //             <div className="balance-amount">
  //               <span>5.2 ETH</span>
  //               <span>$10,400</span>
  //             </div>
  //           </div>
  //           <Button onClick={handleWithdrawFees}>Withdraw Fees</Button>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
};
export default Admin;
