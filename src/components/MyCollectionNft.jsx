import React, {useEffect, useState} from 'react';
import Toast from "./Toast";
import {useMainContext} from "../context/Context";
import {DOMAIN_NAME, DOMAIN_VERSION, ERC1155_ABI, ERC721_ABI, LISTING_TYPE, MARKETPLACE_ADDRESS} from "../lib/config";
import {keccak256, toUtf8Bytes, parseEther, JsonRpcProvider, ethers} from "ethers";
import Button from "./Button";
import Modal from "./Modal";
import MyNFTCard from "./MyNFTCard";
import {chainUrlList} from "../lib/chainUrlList";
import ListingModal from "./ListingModal";
import ChangePriceModal from "./ChangePriceModal";
import {cancelListingNft, getListed, saveListingNft, updateListed} from "../services/apiService";

const MyCollectionNFTs = ({nfts, loadMyCollections}) => {

  const {
    userAccount,
    contract,
    walletType,
    userSigner,
    chainId,
    provider,
    setProvider,
    currentCollectionAddress
  } = useMainContext()

  const [toast, setToast] = useState(null);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [collectionNFTs, setCollectionNFTs] = useState([]);
  const [currentListingForPriceChange, setCurrentListingForPriceChange] = useState(null)
  const [changePrice, setChangePrice] = useState(false)
  const [strategy, setStrategy] = useState('uniform');
  const [openListModal, setOpenListModal] = useState(false)
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState('2592000');
  const [newListingPrice, setNewListingPrice] = useState('');
  const [currentListing, setCurrentListing] = useState(null);
  // const [updatedData, setUpdatedData] = useState(false);


  const [progress, setProgress] = useState({
    show: false,
    title: '',
    current: 0,
    total: 0,
    nftName: '',
    status: ''
  });

  useEffect(() => {
    if (!provider && !chainId) {
      const prvdr = new JsonRpcProvider(chainUrlList[1])
      setProvider(prvdr);
    }
  }, []);


  useEffect(() => {
      setCollectionNFTs(nfts);
  }, [nfts]);

  const toggleNFTSelection = (nft) => {
    const exists = selectedNFTs.find(n => n.contract === nft.contract && n.tokenId === nft.tokenId);

    if (exists) {
      setSelectedNFTs(prev => prev.filter(n => !(n.contract === nft.contract && n.tokenId === nft.tokenId)));
    } else {
      setSelectedNFTs(prev => [...prev, nft]);
    }
  };

  const cancelNFTListing = async (itemId, listingType, listingHash, contract, tokenId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this listing?')) {
      return;
    }
    console.log(12345, itemId, listingType, listingHash, contract, tokenId)
    try {
      if (listingType === 'signature') {
        const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
        const listing = listings.find(l => l.hash === listingHash);

        if (removeSignatureListing(listingHash)) {
          if (listing) {
            addToActivityLog({
              type: 'cancelled',
              nft: listing.nftName || `Token #${listing.listing.tokenId}`,
              user: userAccount,
              price: listing.priceETH,
              time: new Date(),
              collection: listing.listing.nftContract,
              method: 'signature'
            });
          }

          await cancelListingNft({contract, tokenId});

          setToast({message: 'Signature listing cancelled successfully!', type: 'success'});
          loadMyCollections();
          // await loadCollectionMarketplace();
        } else {
          setToast({message: 'Error cancelling signature listing', type: 'error'});
        }
      } else {
        if (!contract) {
          setToast({message: 'Contract not connected', type: 'error'});
          return;
        }

        // await contract.methods.cancelListing(itemId).send({ from: userAccount });
        if (walletType === 'tairun') {
          // Ethers.js variant
          const tx = await contract.cancelListing(itemId);
          await tx.wait();
        } else {
          // Web3.js variant
          await contract.methods.cancelListing(itemId).send({
            from: userAccount
          });
        }

        addToActivityLog({
          type: 'cancelled',
          nft: `Item #${itemId}`,
          user: userAccount,
          time: new Date(),
          collection: currentCollectionAddress,
          method: 'traditional'
        });

        await cancelListingNft({contract, tokenId});

        setToast({message: 'Traditional listing cancelled successfully!', type: 'success'});
        loadMyCollections();
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      setToast({message: 'Error cancelling listing: ' + error.message, type: 'error'});
    }
  }

  function removeSignatureListing(hash) {
    try {
      let listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const originalLength = listings.length;
      listings = listings.filter(listing => listing.hash !== hash);

      if (listings.length < originalLength) {
        localStorage.setItem('signature_listings', JSON.stringify(listings));
        console.log('Signature listing removed:', hash);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing signature listing:', error);
      return false;
    }
  }


  const openChangePriceModal = async (listingHash, currentPrice, tokenId) => {
    console.log('Opening price change modal for hash:', listingHash);

    if (!contract || !userAccount) {
      setToast({message: 'Please connect your wallet first', type: 'error'});
      return;
    }

    const data = await getListed({hash: listingHash, owner: userAccount, tokenId, collection: currentCollectionAddress});

    if (data.status === false) {
      setToast({message: data.message, type: 'error'});
      return;
    }

    if (data.listing ) {
      console.log('Listing get:',currentCollectionAddress, listingHash, currentPrice, tokenId, data.listing);
      setCurrentListing(data.listing);
      setCurrentListingForPriceChange(listingHash);
      setChangePrice(true)
      return;
    }

    setToast({message: 'Unknown error', type: 'error'});
  }

  if (collectionNFTs?.length === 0) {
    return <div className="loading">You don’t own any NFTs from this collection</div>;
  }

  async function confirmPriceChange() {

    if (!newListingPrice || parseFloat(newListingPrice) <= 0) {
      setToast({message: 'Please enter a valid price', type: 'error'});
      return;
    }

    try {

      setToast({message: 'Creating new signature...', type: 'success'});

      console.log('signListing3',
        currentListing.listing.nftContract,
        currentListing.listing.tokenId,
        parseFloat(newListingPrice),
        currentListing.listing.amount,
        currentListing.listing.tokenType,
        currentListing.listing.deadline);

      const newSignedListing = await signListing(
        currentListing.listing.nftContract,
        currentListing.listing.tokenId,
        parseFloat(newListingPrice),
        currentListing.listing.amount,
        currentListing.listing.tokenType,
        currentListing.listing.deadline
      );

      newSignedListing.nftName = currentListing.nftName;
      newSignedListing.collection = currentListing.collection;

      console.log('New signature created with hash:', newSignedListing.hash);

      setToast({message: 'Updating listing...', type: 'success'});

      // localStorage.setItem('signature_listings', JSON.stringify(listings));


      const res = await updateListed({
        id: currentListing.id,
        hash: newSignedListing.hash,
        owner: userAccount,
        tokenId: currentListing.listing.tokenId.toString(),
        collection: currentCollectionAddress,
        price: newSignedListing.priceWei,
        signature: newSignedListing.signature
      });
      console.log('status rez', res)
      if(res.status === true) {
        setToast({message: 'Price updated successfully!', type: 'success'});
        loadMyCollections();
      }
      else{
        setToast({message: res.message, type: 'error'});
      }

      setTimeout(() => {
        closeChangePriceModal();
      }, 1500);

    } catch (error) {
      console.error('Error changing price:', error);

      let errorMessage = 'Error changing price: ';
      if (error.code === 4001) {
        errorMessage += 'Transaction was cancelled by user';
      } else {
        errorMessage += error.message;
      }

      setToast({message: errorMessage, type: 'error'});
    }
  }

  function addToActivityLog(activity) {
    try {
      let activities = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      activities.unshift(activity); // Add to beginning

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities = activities.slice(0, 100);
      }

      localStorage.setItem('marketplace_activity', JSON.stringify(activities));
      console.log('📊 Activity logged:', activity);
    } catch (error) {
      console.error('❌ Error logging activity:', error);
    }
  }

  const ProgressModal = () => {
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    if (!progress.show) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}
      >
        <div
          style={{
            background: 'white',
            padding: 30,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333'}}>
            {progress.title}
          </div>
          <div style={{fontSize: 48, fontWeight: 'bold', color: '#667eea', margin: '20px 0'}}>
            {progress.current}
          </div>
          <div style={{fontSize: 18, color: '#666', marginBottom: 20}}>
            Total: {progress.total}
          </div>
          <div style={{fontSize: 16, color: '#333', margin: '15px 0', fontWeight: 500}}>
            {progress.nftName}
          </div>
          <div
            style={{
              background: '#f0f0f0',
              height: 8,
              borderRadius: 4,
              margin: '20px 0',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: '#667eea',
                height: '100%',
                width: `${percentage}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{color: '#666', fontSize: 14, marginTop: 15}}>
            {progress.status}
          </div>
        </div>
      </div>
    );
  };

  async function listSelectedNFTs() {
    console.log('Starting listing process...');

    if (!contract || !userAccount) {
      setToast({message: 'Please connect your wallet first', type: 'error'});
      return;
    }

    if (selectedNFTs.length === 0) {
      setToast({message: 'No NFTs selected', type: 'error'});
      return;
    }

    let prices = [];

    try {
      if (strategy === 'uniform') {
        if (!listingDuration || parseFloat(listingDuration) <= 0) {
          setToast({message: 'Please enter a valid uniform price', type: 'error'});
          return;
        }
        prices = selectedNFTs.map(() => parseFloat(listingPrice));
        // console.log('uniformPrice', prices, listingDuration, selectedNFTs)
      } else {
        prices = selectedNFTs.map((nft, index) => {
          const price = nft.customPrice || 0;
          if (price <= 0) {
            throw new Error(`Please set a valid price for ${nft.name}`);
          }
          return parseFloat(price);
        });

        // console.log('individualPrice', prices, listingDuration, selectedNFTs)
      }
    } catch (error) {
      setToast({message: error.message, type: 'error'});
      return;
    }

    try {
      setOpenListModal(false);
      setProgress({
        show: true,
        title: 'Signing NFTs',
        current: 0,
        total: selectedNFTs.length,
        nftName: '',
        status: ''
      });

      // Check and handle approvals
      const uniqueContracts = [...new Set(selectedNFTs.map(nft => nft.contract.toLowerCase()))];

      for (const contractAddress of uniqueContracts) {
        const nft = selectedNFTs.find(n => n.contract.toLowerCase() === contractAddress?.toLowerCase());

        setProgress(prev => ({
          ...prev,
          nftName: '',
          status: `Checking approval for ${nft.contract}...`
        }));


        let signer;
        if (walletType === 'tairun') {
          signer = userSigner; // keystore-based
        } else {
          // const provider = new BrowserProvider(window.ethereum);
          signer = await provider.getSigner(); // MetaMask or browser wallet
        }

        const abi = nft.tokenType === 0 ? ERC721_ABI : ERC1155_ABI;
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        const isApproved = await nftContract.isApprovedForAll(userAccount, MARKETPLACE_ADDRESS);

        if (!isApproved) {
          setProgress(prev => ({
            ...prev,
            status: `Approving ${nft?.contract}...`
          }));

          const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);

          try {
            const approveTxApproved = await Promise.race([
              approveTx.wait(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('⏳ Transaction confirmation timeout')), 10000)
              )
            ]);

            console.log('Confirmed:', approveTxApproved);

            setToast({
              message: 'NFT approved successfully',
              type: 'success'
            });
          } catch (error) {
            console.error('Approval failed:', error);

            setToast({
              message: error.message || 'Approval failed',
              type: 'error'
            });
          }

          setProgress(prev => ({
            ...prev,
            status: `✅ ${nft?.contract} approved!`
          }));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      try {
        if (selectedNFTs.length > 1) {
          const statusBatch = await createBatchListing(prices, parseInt(listingDuration));
          console.log(777, statusBatch)
        } else {
          const statusSingle = await createSingleListing(prices[0], parseInt(listingDuration));
          console.log(555, statusSingle)
        }
      } catch (error) {
        console.log('1234 Error in createListing:', error.message);
      }


      setProgress(prev => ({
        ...prev,
        show: false
      }));
    } catch (error) {
      console.error('Error in listing process:', error);
      setProgress(prev => ({
        ...prev,
        show: false
      }));
      setToast({message: 'Error in listing process: ' + error.message, type: 'error'});
    }
  }

  async function signListing(nftContract, tokenId, priceETH, amount, tokenType, deadline) {
    try {
      const priceWei = parseEther(priceETH.toString()).toString();
      const nonce = await contract.getUserNonce(userAccount)

      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: chainId,
        verifyingContract: MARKETPLACE_ADDRESS
      };

      const listing = {
        nftContract: nftContract,
        tokenId: parseInt(tokenId),
        price: priceWei,
        amount: parseInt(amount),
        tokenType: parseInt(tokenType),
        deadline: parseInt(deadline),
        seller: userAccount,
        nonce: parseInt(nonce)
      };

      let signature;

      console.log("userSigner", userSigner);
      signature = await userSigner.signTypedData(domain, LISTING_TYPE, listing);

      const uniqueString = `${listing.nftContract}_${listing.tokenId}_${listing.price}_${listing.nonce}_${listing.seller}`;
      const hash = keccak256(toUtf8Bytes(uniqueString));

      return {
        listing: listing,
        signature: signature,
        hash: hash,
        timestamp: Date.now(),
        priceETH: priceETH,
        priceWei: priceWei,
        deadline: deadline,
      };
    } catch (error) {
      console.log('Listing Nft error:', error.message);
    }
  }

  async function createSingleListing(price, duration) {
    const deadline = duration === 0 ?
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) :
      Math.floor(Date.now() / 1000) + parseInt(duration);

    const nft = selectedNFTs[0];


    try {
      setProgress(prev => ({
        ...prev,
        current: 1,
        total: 1,
        nftName: nft.name,
        status: 'Signing...'
      }));
      console.log('signListing1',
        nft.contract,
        nft.tokenId,
        price,
        nft.amount,
        nft.type,
        deadline, nft);

      const signedListing = await signListing(
        nft.contract,
        nft.tokenId,
        price,
        nft.amount,
        nft.type,
        deadline
      );

      saveSignatureListing(signedListing, nft);

      setProgress(prev => ({
        ...prev,
        status: 'Listed Successfully!'
      }));

      setTimeout(() => {
        setProgress(prev => ({
          ...prev,
          show: false
        }));
        setSelectedNFTs([]);
        loadMyCollections();
        // loadCollectionMarketplace();
        // setUpdatedData(true);
      }, 2000);

      await saveListingNft({
        contract: nft.contract.toLowerCase(),
        name: nft.name,
        img: nft.image,
        token_id: nft.tokenId,
        seller: userAccount.toLowerCase(),
        price: signedListing?.priceWei,
        deadline: new Date(signedListing?.deadline * 1000).toISOString(),
        signature: signedListing?.signature,
        token_type: nft.type,
        nonce: signedListing?.listing?.nonce,
        hash: signedListing?.hash,
      });

    } catch (error) {
      console.error('Error creating listing:', error);
      setProgress(prev => ({
        ...prev,
        show: false
      }));
      setToast({message: 'Error creating listing: ' + error.message, type: 'error'});
    }
  }

  function saveSignatureListing(signedListing, nft) {
    let listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');

    signedListing.nftName = nft.name;
    signedListing.collection = nft.collection;

    listings.push(signedListing);
    localStorage.setItem('signature_listings', JSON.stringify(listings));

    console.log('Listing saved with hash:', signedListing.hash);

    addToActivityLog({
      type: 'listed',
      nft: nft.name,
      user: userAccount,
      price: signedListing.priceETH,
      time: new Date(),
      collection: nft.contract,
      method: 'signature'
    });
  }

  async function createBatchListing(prices, duration) {
    const deadline = duration === 0 ?
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) :
      Math.floor(Date.now() / 1000) + parseInt(duration);

    try {
      for (let i = 0; i < selectedNFTs.length; i++) {
        const nft = selectedNFTs[i];
        const price = prices[i];

        setProgress(prev => ({
          ...prev,
          current: i + 1,
          total: selectedNFTs.length,
          nftName: nft.name,
          status: 'Signing...'
        }));

        console.log('signListing2',
          nft.contract,
          nft.tokenId,
          price,
          nft.amount,
          nft.type,
          deadline);

        const signedListing = await signListing(
          nft.contract,
          nft.tokenId,
          price,
          nft.amount,
          nft.type,
          deadline
        );

        saveSignatureListing(signedListing, nft);

        setProgress(prev => ({
          ...prev,
          status: 'Signed!'
        }));

        await saveListingNft({
          contract: nft.contract.toLowerCase(),
          name: nft.name,
          img: nft.image,
          token_id: nft.tokenId,
          seller: userAccount.toLowerCase(),
          price: signedListing?.priceWei,
          deadline: new Date(signedListing?.deadline * 1000).toISOString(),
          signature: signedListing?.signature,
          token_type: nft.type,
          nonce: signedListing?.listing?.nonce,
          hash: signedListing?.hash
        });

        if (i < selectedNFTs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setProgress(prev => ({
        ...prev,
        current: selectedNFTs.length,
        total: selectedNFTs.length,
        nftName: '',
        status: 'All NFTs Listed Successfully!'
      }));

      setTimeout(() => {
        setProgress(prev => ({
          ...prev,
          show: false
        }));
        setSelectedNFTs([]);
        loadMyCollections();
        // loadCollectionMarketplace();
        // setUpdatedData(true);
      }, 2000);

    } catch (error) {
      console.error('Error creating batch listing:', error);
      setProgress(prev => ({
        ...prev,
        show: false
      }));
      setToast({message: 'Error creating batch listing: ' + error.message, type: 'error'});
    }
  }

  function closeChangePriceModal() {
    setCurrentListingForPriceChange(null);
    setChangePrice(false)
  }

  return (
    <>
      {selectedNFTs.length > 0 &&
        <Button onClick={() => setOpenListModal(true)} className="listing-btn">
          {`Listing ${selectedNFTs.length} NfFT${selectedNFTs.length > 1 ? 's' : ''}`}
        </Button>
      }

      <div className="nfts-grid" style={{marginTop: 70}}>
        {collectionNFTs?.map((nft, i) => {
          return (
            <div key={i}>
              <MyNFTCard
                nft={nft}
                provider={provider}
                selectedNFTs={selectedNFTs}
                setSelectedNFTs={setSelectedNFTs}
                toggleNFTSelection={toggleNFTSelection}
                openChangePriceModal={openChangePriceModal}
                cancelNFTListing={cancelNFTListing}
              />
            </div>
          );
        })}
      </div>

      <Modal isOpen={changePrice} onClose={() => setChangePrice(false)} title="Change Listing Price">
        <ChangePriceModal
          newListingPrice={newListingPrice}
          setNewListingPrice={setNewListingPrice}
          confirmPriceChange={confirmPriceChange}
          closeChangePriceModal={closeChangePriceModal}
        />
      </Modal>

      <Modal isOpen={openListModal} onClose={() => setOpenListModal(false)}
             title={`List NFT${selectedNFTs.length > 1 ? 's' : ''} to sell`}>
        <ListingModal
          selectedNFTs={selectedNFTs}
          listingPrice={listingPrice}
          setListingPrice={setListingPrice}
          strategy={strategy}
          setStrategy={setStrategy}
          onSubmit={listSelectedNFTs}
          onCancel={() => setOpenListModal(false)}
          setToast={setToast}
          setSelectedNFTs={setSelectedNFTs}
          listingDuration={listingDuration}
          setListingDuration={setListingDuration}
        />
      </Modal>

      {progress.show && <ProgressModal/>}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
};

export default MyCollectionNFTs;
