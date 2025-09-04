import React, { useEffect, useState } from 'react';
import Toast from "./Toast";
import {useMainContext} from "../context/Context";
import {DOMAIN_NAME, DOMAIN_VERSION, LISTING_TYPE, MARKETPLACE_ADDRESS} from "../lib/config";
import {keccak256, toUtf8Bytes, BrowserProvider, parseEther} from "ethers";
import button from "./Button";

const MyCollectionNFTs = ({ nfts }) => {

  const {userAccount, contract, walletType,userSigner, chainId} = useMainContext()

  const [toast, setToast] = useState(null);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [collectionNFTs, setCollectionNFTs] = useState([]);
  const [currentListingForPriceChange, setCurrentListingForPriceChange] = useState(null)
  const [changePrice, setChangePrice] = useState(false)
  const [strategy, setStrategy] = useState('uniform');
  const [openListModal, setOpenListModal] = useState(false)
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState('2592000');


  useEffect(() => {
    setCollectionNFTs(nfts);
  }, [nfts]);

  const toggleNFTSelection = (contract, tokenId) => {
    const exists = selectedNFTs.find(n => n.contract === contract && n.tokenId === tokenId);
    if (exists) {
      setSelectedNFTs(prev => prev.filter(n => !(n.contract === contract && n.tokenId === tokenId)));
    } else {
      setSelectedNFTs(prev => [...prev, { contract, tokenId }]);
    }
  };

  const cancelNFTListing = (itemId, listingType, listingHash, contract, tokenId) => {
    console.log('Cancel listing', itemId, listingType, listingHash);
    // implement logic or call props callback
  };


  function openChangePriceModal(listingHash, currentPrice) {
    console.log('🔧 Opening price change modal for hash:', listingHash);

    const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
    console.log('🔍 Available listings:', listings.map(l => ({ hash: l.hash, name: l.nftName })));

    const listing = listings.find(l => l.hash === listingHash);

    if (!listing) {
      console.error('❌ Listing not found for hash:', listingHash);
      alert('Error: Listing not found. Please refresh the page.');
      return;
    }

    // Verifică dacă utilizatorul este proprietarul listării
    if (listing.listing.seller.toLowerCase() !== userAccount?.toLowerCase()) {
      alert('Error: You can only modify your own listings.');
      return;
    }

    // Verifică dacă listarea nu a expirat
    if (listing.listing.deadline <= Math.floor(Date.now() / 1000)) {
      alert('Error: This listing has expired and cannot be modified.');
      return;
    }

    // console.log('✅ Found listing:', listing.nftName);
    setCurrentListingForPriceChange(listingHash);
    setChangePrice(true)
    // document.getElementById('newListingPrice').value = currentPrice;

  }

  if (collectionNFTs?.length === 0) {
    return <div className="loading">You don’t own any NFTs from this collection</div>;
  }

  async function confirmPriceChange() {
    const newPrice = document.getElementById('newListingPrice').value;

    if (!newPrice || parseFloat(newPrice) <= 0) {
      setToast({message: 'Please enter a valid price', type: 'error'});
      return;
    }

    if (!currentListingForPriceChange) {
      setToast({message: 'No listing selected', type: 'error'});
      return;
    }

    if (!contract || !userAccount) {
      setToast({message: 'Please connect your wallet first', type: 'error'});
      return;
    }

    try {
      setToast({message: '🔍 Finding listing...', type: 'success'});

      let listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const currentListingIndex = listings.findIndex(l => l.hash === currentListingForPriceChange);

      if (currentListingIndex === -1) {
        setToast({message: 'Listing not found. Please refresh and try again.', type: 'error'});
        return;
      }

      const currentListing = listings[currentListingIndex];
      console.log('✅ Found listing for price change:', currentListing.nftName);

      setToast({message: '📝 Creating new signature...', type: 'success'});

      // Creează o nouă semnătură cu prețul nou
      const newSignedListing = await signListing(
        currentListing.listing.nftContract,
        currentListing.listing.tokenId,
        parseFloat(newPrice),
        currentListing.listing.amount,
        currentListing.listing.tokenType,
        currentListing.listing.deadline
      );

      // Păstrează metadatele
      newSignedListing.nftName = currentListing.nftName;
      newSignedListing.collection = currentListing.collection;

      console.log('✅ New signature created with hash:', newSignedListing.hash);

      setToast({message: '💾 Updating listing...', type: 'success'});

      // Elimină listarea veche și adaugă cea nouă
      listings.splice(currentListingIndex, 1);
      listings.push(newSignedListing);

      localStorage.setItem('signature_listings', JSON.stringify(listings));

      addToActivityLog({
        type: 'price_changed',
        nft: currentListing.nftName,
        user: userAccount,
        oldPrice: currentListing.priceETH,
        newPrice: parseFloat(newPrice),
        time: new Date(),
        collection: currentListing.listing.nftContract,
        method: 'signature'
      });

      setToast({message:  '✅ Price updated successfully!', type: 'success'});

      setTimeout(() => {
        closeChangePriceModal();
      }, 1500);

    } catch (error) {
      console.error('❌ Error changing price:', error);

      let errorMessage = 'Error changing price: ';
      if (error.code === 4001) {
        errorMessage += 'Transaction was cancelled by user';
      } else {
        errorMessage += error.message;
      }

      setToast({message:  errorMessage, type: 'error'});
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



  async function signListing(nftContract, tokenId, priceETH, amount, tokenType, deadline) {
    // const priceWei = web3.utils.toWei(priceETH.toString(), 'ether');
    // const nonce = await contract.methods.getUserNonce(userAccount).call();
    // const chainId = await web3.eth.getChainId();
    const priceWei = parseEther(priceETH.toString()).toString();
    console.log('contract', contract)
    const nonce = walletType === 'tairun' ?
      await contract.getUserNonce(userAccount) :
      await contract.methods.getUserNonce(userAccount).call();

    let ChainId = chainId
    if(walletType === 'browser') {
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); // MetaMask or browser wallet
      ChainId = await signer.getChainId();
      console.log('signer', signer )
    }

    console.log('chainId', chainId )

    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: ChainId,
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

    // const signature = await window.ethereum.request({
    //     method: 'eth_signTypedData_v4',
    //     params: [userAccount, JSON.stringify(data)]
    // });
    let signature;

    if (walletType === 'tairun') {
      console.log("userSigner", userSigner);
      console.log("has _signTypedData", typeof userSigner._signTypedData === 'function');
      // signature = await userSigner._signTypedData(domain, LISTING_TYPE, listing);
      signature = await userSigner.signTypedData(domain, LISTING_TYPE, listing);
    } else {
      const data = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          ...LISTING_TYPE
        },
        domain: domain,
        primaryType: 'Listing',
        message: listing
      };

      signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [userAccount, JSON.stringify(data)],
      });
    }
    // Generează hash unic pentru identificare
    const uniqueString = `${listing.nftContract}_${listing.tokenId}_${listing.price}_${listing.nonce}_${listing.seller}`;
    // const hash = web3.utils.keccak256(uniqueString);
    const hash = keccak256(toUtf8Bytes(uniqueString));

    return {
      listing: listing,
      signature: signature,
      hash: hash,
      timestamp: Date.now(),
      priceETH: priceETH
    };
  }

  function closeChangePriceModal() {
      setCurrentListingForPriceChange(null);
      setChangePrice(false)
  }

  const updateNFTPrice = (index, value) => {
    const updated = [...selectedNFTs];
    updated[index].customPrice = value;
    setSelectedNFTs(updated);
  };

  const ChangePriceModal = () => {
    if(!changePrice) return '';
    return (
      <div id="changePriceModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => closeChangePriceModal()}>&times;</span>
          <h3>Change Listing Price</h3>
          <div id="changePriceMessage"></div>

          <div id="changePriceContent" style={{padding: 20}}>
            <div className="form-group">
              <label>New Price (ETH):</label>
              <input type="number" id="newListingPrice" className="form-input" placeholder="0.001" step="0.001"
                     min="0.001"/>
            </div>

            <div style={{textAlign: "center", marginTop: 20}}>
              <button className="btn btn-success" onClick={() => confirmPriceChange()}>Update Price</button>
              <button className="btn" onClick={() => closeChangePriceModal()} style={{marginLeft: 15}}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ListingModal = () => {

    if(!openListModal) return '';

    // useEffect(() => {
    //   // Reset custom prices on open
    //   const resetNFTs = selectedNFTs.map(nft => ({ ...nft, customPrice: undefined }));
    //   setSelectedNFTs(resetNFTs);
    // }, []);

    if (!selectedNFTs.length) {
      return alert('Please select at least one NFT to list');
    }

    return (
      <div className="modal" style={{ display: 'block' }}>
        <h2>📝 List {selectedNFTs.length} NFTs</h2>

        <label>Pricing Strategy:</label>
        <select value={strategy} onChange={(e) => setStrategy(e.target.value)} id="pricingStrategy">
          <option value="uniform">Uniform</option>
          <option value="individual">Individual</option>
        </select>

        {strategy === 'uniform' && (
          <div id="uniformPricing">
            <label>Price per item (ETH):</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              id="listingPrice"
            />
          </div>
        )}

        {strategy === 'individual' && (
          <div id="individualPricing">
            {selectedNFTs.map((nft, index) => (
              <div
                key={`${nft.contract}-${nft.tokenId}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'white',
                  margin: '8px 0',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{nft.name}</strong><br />
                  <small style={{ color: '#666' }}>{nft.collection} - ID: {nft.tokenId}</small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    className="form-input"
                    step="0.001"
                    min="0.001"
                    value={nft.customPrice || ''}
                    onChange={(e) => updateNFTPrice(index, e.target.value)}
                    style={{ width: '120px' }}
                  />
                  <span style={{ color: '#666', fontSize: '14px' }}>ETH</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <label>Listing Duration (in seconds):</label>
        <input
          type="number"
          value={listingDuration}
          onChange={(e) => setListingDuration(e.target.value)}
          id="listingDuration"
        />

        <button className="btn btn-primary" id="listingButtonText">
          {strategy === 'uniform' ? 'List All NFTs Individually' : 'List All NFTs with Custom Prices'}
        </button>
        <button className="btn btn-secondary" onClick={() => setOpenListModal(false)}>Cancel</button>
      </div>
    );
  };

  return (
    <div className="nft-grid">
      {collectionNFTs?.map(nft => {
        const isSelected = selectedNFTs.find(n => n.contract === nft.contract && n.tokenId === nft.tokenId);
        const listedTag = nft.listingType === 'signature' ? '📝 LISTED' : '⛽ LISTED';

        return (
          <div
            key={`${nft.contract}-${nft.tokenId}`}
            className={`nft-card ${nft.isListed ? 'listed' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
              if (!nft.isListed && e.target.tagName !== 'BUTTON') {
                toggleNFTSelection(nft.contract, nft.tokenId);
              }
            }}
          >
            {nft.isListed && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: '#28a745', color: 'white',
                padding: '4px 8px', borderRadius: 4, fontSize: 12
              }}>
                {listedTag}
              </div>
            )}
            <div className="nft-image">🖼️ NFT #{nft.tokenId}</div>
            <div className="nft-details">
              <div className="nft-title">{nft.name}</div>

              {nft.isListed ? (
                <>
                  <div className="nft-price">{nft.listingPriceETH.toFixed(4)} ETH</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: 10 }}>
                    <button
                      className="btn btn-warning btn-small"
                      onClick={() => openChangePriceModal(nft.listingHash, nft.listingPriceETH)}
                    >
                      💰 Price
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => cancelNFTListing(nft.id, nft.itemId, nft.listingType, nft.listingHash || '', nft.contract, nft.tokenId)}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="btn btn-success btn-small"
                  onClick={() => toggleNFTSelection(nft.contract, nft.tokenId)}
                >
                  {isSelected ? 'Deselect' : 'Select'}
                </button>
              )}

              <div className="nft-info">
                <div>Type: {nft.tokenType === 0 ? 'ERC721' : 'ERC1155'}</div>
                <div>Amount: {nft.amount}</div>
                {nft.isListed && (
                  <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                    {nft.listingType === 'signature' ? '📝 Signature Listed' : '⛽ On-chain Listed'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {setSelectedNFTs?.length > 0 && <button onClick={() => setOpenListModal(true)} >Listing {setSelectedNFTs.length}</button>}

      <ChangePriceModal />
      <ListingModal />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default MyCollectionNFTs;
