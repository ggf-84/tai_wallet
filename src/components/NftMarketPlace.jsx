import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMainContext} from "../context/Context";
import {Contract, ethers, formatEther, keccak256, parseEther, toUtf8Bytes, BrowserProvider} from "ethers";
import Toast from "./Toast";
import {
  DOMAIN_NAME,
  DOMAIN_VERSION,
  ERC1155_ABI,
  ERC721_ABI, FALLBACK_ERC1155_ABI, FALLBACK_ERC721_ABI,
  LISTING_TYPE,
  MARKETPLACE_ADDRESS,
  TAIKO_CHAIN_ID,
  TAIKOSCAN_API_KEY
} from "../lib/config";

const NftMarketPlace = () => {
  const navigate = useNavigate()
  const {
    nftCollections,
    setNftCollections,
    isAdmin,
    setIsAdmin,
    userAccount,
    contract,
    wethContract,
    walletType,
    userSigner,
    chainId,
    provider
  } = useMainContext();

  const [toast, setToast] = useState(null);
  const [selectedNFTs, setSelectedNFTs] = useState([])
  const [currentCollectionTab, setCurrentCollectionTab] = useState('marketplace')
  const [currentCollection, setCurrentCollection] = useState(null)
  const [collectionMyNFTs, setCollectionMyNFTs] = useState([])
  const [collectionListing, setCollectionListing] = useState([])
  const [currentOfferNFT, setCurrentOfferNFT] = useState(null)
  const [currentCollectionOffer, setCurrentCollectionOffer] = useState(null)
  const [currentListingForPriceChange, setCurrentListingForPriceChange] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')
  const [collectionOffers, setCollectionOffers] = useState(null)
  const [collectionData, setCollectionData] = useState(null)
  const [collectionAddress, setCollectionAddress] = useState(null)
  const [openListModal, setOpenListModal] = useState(false)
  const [strategy, setStrategy] = useState('uniform');
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState('2592000');


  useEffect(() => {
    const COLLECTIONS = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');
    setNftCollections(COLLECTIONS);
    loadCollectionData()
  }, []);


  useEffect(() => {
    const initApp = async () => {
      if (contract) {
        try {
          const owner = walletType === 'tairun' ?
            await contract?.owner() :
            await contract?.methods.owner().call();

          const ownerIsAdmin = owner.toLowerCase() === userAccount.toLowerCase();
          setIsAdmin(ownerIsAdmin)

          console.log('Could not check admin status:', owner.toLowerCase() , userAccount.toLowerCase());

        } catch (error) {
          console.log('Could not check admin status:', error);
        }
      }
    };

    initApp().then(r => contract);
  }, [contract]);



  // =========================


  const CollectionsGrid = ({ nftCollections, isAdmin, showCollection }) => {
    const generateGradientFromAddress = (address) => {
      // Exemplu de gradient (poți înlocui cu algoritmul tău)
      const hash = address.slice(2, 8);
      return `linear-gradient(135deg, #${hash}88, #${hash}cc)`;
    };

    if (!nftCollections || Object.keys(nftCollections).length === 0) {
      return (
        <div className="loading">
          <h3>No collections available</h3>
          <p>Collections will be added by marketplace administrators.</p>
          {isAdmin && <p><strong>As an admin, you can add collections in the Admin panel.</strong></p>}
        </div>
      );
    }

    return (
      <div className="collections-grid">
        {Object.entries(nftCollections).map(([address, collection]) => {
          // checkCollections()
          return (
            <div className="collection-card" key={address} onClick={() => showCollection(address)}>
              <img src={collection.avatar} style={{width:'100%', maxHeight: 300, objectFit: 'cover'}} alt={collection.name} />
              <div className="collection-info">
                <div className="collection-name">{collection.name}</div>
                <div className="collection-description">{collection.description}</div>
                <div className="collection-stats">
                  <div className="collection-stat">
                    <div className="collection-stat-value">∞</div>
                    <div className="collection-stat-label">Items</div>
                  </div>
                  <div className="collection-stat">
                    <div className="collection-stat-value">-</div>
                    <div className="collection-stat-label">Listed</div>
                  </div>
                  <div className="collection-stat">
                    <div className="collection-stat-value">-</div>
                    <div className="collection-stat-label">Floor</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  function showCollection(address) {
    setCurrentCollection(address);
    setCurrentPage('collection');
    setCurrentCollectionTab('marketplace');

    const collection = nftCollections[address];

    showTab('collection');
    // updateCollectionHeader(collection, address);
    setCollectionData(collection);
    setCollectionAddress(address);
    showCollectionTab('marketplace');
    loadCollectionData(address);
  }

  const HeaderCollection = ({ collection, address }) => {
    if (!collection) return null;

    const colors = generateGradientFromAddress(address);

    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: colors,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            marginRight: 20,
            color: 'white',
            overflow: 'hidden',
          }}
        >
          {collection.avatar ? (
            <img src={collection.avatar} alt={collection.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{collection.name?.charAt(0) || '🎨'}</span>
          )}
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>{collection.name}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>{collection.description}</p>
          <small style={{ color: '#999', fontFamily: 'monospace' }}>{address}</small>
        </div>
      </div>
    );
  };


  function generateGradientFromAddress(address) {
    const hash = address.slice(2, 8);
    const hue1 = parseInt(hash.slice(0, 2), 16) * 360 / 255;
    const hue2 = parseInt(hash.slice(2, 4), 16) * 360 / 255;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 70%))`;
  }

  async function loadCollectionData(address) {
    await Promise.all([
      loadCollectionMarketplace(),
      loadCollectionMyNFTs(),
      loadCollectionOffers(),
      loadCollectionActivity()
    ]);
  }

  function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      if ((tabName === 'home' && tab.textContent.includes('Collections'))) {
        tab.classList.add('active');
      }
    });
  }

  function showHome() {
    setCurrentPage('home');
    setSelectedNFTs([]);
    document.getElementById('breadcrumb').style.display = 'none';
    showTab('home');
    // renderCollections();
  }

  function showCollectionTab(tabName) {
    setCurrentCollectionTab(tabName);

    document.querySelectorAll('.collection-nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.textContent.toLowerCase().includes(tabName)) {
        tab.classList.add('active');
      }
    });

    document.querySelectorAll('.collection-tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const targetContent = document.getElementById(`collection-${tabName}`);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // eslint-disable-next-line default-case
    switch (tabName) {
      case 'marketplace':
        loadCollectionMarketplace();
        break;
      case 'mynfts':
        loadCollectionMyNFTs();
        break;
      case 'offers':
        loadCollectionOffers();
        break;
      case 'activity':
        loadCollectionActivity();
        break;
    }
  }

  async function loadCollectionMarketplace() {
    // const container = document.getElementById('collectionNFTs');
    // if (!container) return;

    // container.innerHTML = '<div class="loading">Loading marketplace NFTs...</div>';

    try {
      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const collectionListings = listings.filter(listing =>
        listing.listing.nftContract.toLowerCase() === currentCollection.toLowerCase() &&
        listing.listing.deadline > Math.floor(Date.now() / 1000)
      );

      setCollectionListing(collectionListings)

      console.log(`📋 Found ${collectionListings.length} active listings for collection`);

      // renderCollectionNFTs(collectionListings);

    } catch (error) {
      console.error('Error loading collection marketplace:', error);
      // container.innerHTML = '<div class="error">Error loading marketplace NFTs</div>';
    }
  }


  const NFTCard = ({ listing, userAccount, onBuy, onAddToCart, onOffer, onChangePrice, onCancel, index }) => {
    const price = parseFloat(listing.listing.priceETH);
    const isOwnListing = listing.listing.seller.toLowerCase() === userAccount?.toLowerCase();

    return (
      <div className="nft-card" key={index}>
        <div style={{ position: 'absolute', top: 10, left: 10, background: '#667eea', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
          📝 SIGNATURE
        </div>
        <div className="nft-image">🖼️ NFT #{listing.listing.tokenId}</div>

        <div className="nft-details">
          <div className="nft-title">{listing.nftName || `Token #${listing.listing.tokenId}`}</div>
          <div className="nft-price">{price.toFixed(4)} ETH</div>
          <div className="nft-info">
            <div>Type: {listing.listing.tokenType === 0 ? 'ERC721' : 'ERC1155'}</div>
            <div>Amount: {listing.listing.amount}</div>
            <div>Seller: {listing.listing.seller.slice(0, 10)}...</div>
          </div>

          {!isOwnListing && userAccount ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-success" onClick={() => onBuy(listing.hash)} style={{ flex: 1 }}>💰 Buy</button>
                <button className="btn btn-secondary" onClick={() => onAddToCart(listing.hash)} style={{ flex: 1 }}>🛒</button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  className="btn btn-warning"
                  onClick={() =>
                    onOffer(
                      listing.listing.nftContract,
                      listing.listing.tokenId,
                      listing.listing.seller,
                      listing.listing.tokenType
                    )
                  }
                  style={{ width: '100%' }}
                >
                  💰 Make Offer (WETH)
                </button>
              </div>
            </>
          ) : isOwnListing ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary" onClick={() => onChangePrice(listing.hash, price)} style={{ flex: 1 }}>
                💰 Price
              </button>
              <button className="btn btn-danger" onClick={() => onCancel(listing.hash, 'signature', listing.hash)} style={{ flex: 1 }}>
                ❌ Cancel
              </button>
            </div>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic', marginTop: 10 }}>
              Connect wallet to buy/offer
            </div>
          )}
        </div>
      </div>
    );
  };

  const MyNFTCard = ({ nft, isSelected, onSelect, onChangePrice, onCancel, index }) => {
    const handleCardClick = (e) => {
      // Evită propagarea dacă s-a apăsat un buton
      if (e.target.tagName === 'BUTTON') return;
      if (!nft.isListed) {
        onSelect(nft.contract, nft.tokenId);
      }
    };

    return (
      <div
        className={`nft-card ${nft.isListed ? 'listed' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleCardClick} key={index}
      >
        {nft.isListed && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: '#28a745',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {nft.listingType === 'signature' ? '📝 LISTED' : '⛽ LISTED'}
          </div>
        )}

        <div className="nft-image">🖼️ NFT #{nft.tokenId}</div>

        <div className="nft-details">
          <div className="nft-title">{nft.name}</div>

          {nft.isListed ? (
            <>
              <div className="nft-price">{nft.listingPriceETH.toFixed(4)} ETH</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn btn-warning btn-small"
                  onClick={() => onChangePrice(nft.listingHash, nft.listingPriceETH)}
                >
                  💰 Price
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => onCancel(nft.itemId, nft.listingType, nft.listingHash || '')}
                >
                  ❌ Cancel
                </button>
              </div>
            </>
          ) : (
            <button
              className="btn btn-success btn-small"
              onClick={() => onSelect(nft.contract, nft.tokenId)}
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
  };

  async function buyNFTListing(listingHash) {
    if (!contract || !userAccount) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      console.log('🛒 Starting purchase for listing hash:', listingHash);

      const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const listing = listings.find(l => l.hash === listingHash);

      if (!listing) {
        console.error('❌ Listing not found for hash:', listingHash);
        alert('Listing not found. The item may have been sold or cancelled.');

        if (typeof loadCollectionMarketplace === 'function') {
          loadCollectionMarketplace();
        }
        return;
      }

      console.log('✅ Found listing:', listing.nftName);

      if (listing.listing.deadline <= Math.floor(Date.now() / 1000)) {
        alert('This listing has expired');

        const updatedListings = listings.filter(l => l.hash !== listingHash);
        localStorage.setItem('signature_listings', JSON.stringify(updatedListings));

        if (typeof loadCollectionMarketplace === 'function') {
          loadCollectionMarketplace();
        }
        return;
      }

      if (listing.listing.seller.toLowerCase() === userAccount.toLowerCase()) {
        alert('You cannot buy your own listing');
        return;
      }

      const priceETH = listing.priceETH || parseFloat(parseEther(listing.listing.price.toString()));

      // eslint-disable-next-line no-restricted-globals
      if (!confirm(`Buy ${listing.nftName || `Token #${listing.listing.tokenId}`} for ${priceETH.toFixed(4)} ETH?`)) {
        return;
      }

      // Actualizează butonul
      // eslint-disable-next-line no-restricted-globals
      const buyButton = event.target;
      const originalText = buyButton.textContent;
      buyButton.textContent = '🔄 Buying...';
      buyButton.disabled = true;

      console.log('💰 Processing purchase transaction...');

      let result;
      let receipt;

      if (walletType === 'tairun') {
        // 🟢 Ethers.js
        result = await contract.buyWithSignature(listing.listing, listing.signature, {
          value: listing.listing.price,
          gasLimit: 300000 // Not string, should be number
        });
        receipt = await result.wait();
      } else {
        // 🟢 Web3.js
        const txData = {
          from: userAccount,
          to: MARKETPLACE_ADDRESS,
          value: listing.listing.price,
          gas: 300000 // can be a number or string, Web3 accepts both
        };

        result = await contract.methods.buyWithSignature(listing.listing, listing.signature).send(txData);
      }

      console.log('✅ Purchase successful:', walletType === 'tairun' ? receipt.transactionHash : result.transactionHash);

      const updatedListings = listings.filter(l => l.hash !== listingHash);
      localStorage.setItem('signature_listings', JSON.stringify(updatedListings));

      addToActivityLog({
        type: 'bought',
        nft: listing.nftName || `Token #${listing.listing.tokenId}`,
        buyer: userAccount,
        seller: listing.listing.seller,
        price: priceETH,
        time: new Date(),
        collection: listing.listing.nftContract,
        method: 'signature',
        txHash: walletType === 'tairun' ? receipt.transactionHash : result.transactionHash
      });

      alert(`✅ Successfully bought ${listing.nftName || `Token #${listing.listing.tokenId}`} for ${priceETH.toFixed(4)} ETH!`);

      await Promise.all([
        typeof loadCollectionMarketplace === 'function' ? loadCollectionMarketplace() : Promise.resolve(),
        // typeof loadUserNFTs === 'function' ? loadUserNFTs() : Promise.resolve(),
        typeof loadCollectionMyNFTs === 'function' ? loadCollectionMyNFTs() : Promise.resolve()
      ]);

      buyButton.textContent = originalText;
      buyButton.disabled = false;

    } catch (error) {
      console.error('❌ Error buying with signature:', error);

      // eslint-disable-next-line no-restricted-globals
      if (event.target) {
        // eslint-disable-next-line no-restricted-globals
        event.target.textContent = '💰 Buy';
        // eslint-disable-next-line no-restricted-globals
        event.target.disabled = false;
      }

      let errorMessage = 'Error buying NFT: ';

      if (error.code === 4001) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH balance to complete purchase';
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
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

  function filterCollectionNFTs() {
    console.log('Filtering NFTs...');
    // Implementation will be in specific modules
  }

  function clearCollectionFilters() {
    document.getElementById('collectionSortBy').value = 'newest';
    document.getElementById('collectionStatus').value = 'listed';
    document.getElementById('collectionMinPrice').value = '';
    document.getElementById('collectionMaxPrice').value = '';
  }

  function refreshCollectionNFTs() {
    if (currentCollection) {
      loadCollectionData(currentCollection);
    }
  }

  function closeListModal() {
    document.getElementById('listModal').style.display = 'none';
  }

  function closeMakeOfferModal() {
    document.getElementById('makeOfferModal').style.display = 'none';
    setCurrentOfferNFT(null);
  }

  function showOffersMessage(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);

    // Try to use global showMessage if available
    // eslint-disable-next-line no-self-compare
    if (typeof showOffersMessage === 'function' && showOffersMessage !== showOffersMessage) {
      try {
        showOffersMessage(message, type);
        return;
      } catch (error) {
        console.warn('Global showMessage failed:', error);
      }
    }

    // Fallback to alert
    alert(`${type.toUpperCase()}: ${message}`);
  }

  async function signOffer(offer) {
    if (!userAccount) throw new Error('Wallet not connected');

    const typedData = createOfferTypedData(offer);

    console.log('✍️ Requesting signature for offer...');
    console.log('📋 Complete typed data:', JSON.stringify(typedData, null, 2));

    try {
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [userAccount, JSON.stringify(typedData)]
      });

      console.log('✅ Signature created successfully');
      console.log('🔐 Signature:', signature);

      return signature;
    } catch (error) {
      console.error('Signature failed:', error);
      throw new Error('Signature cancelled or failed');
    }
  }

  function closeCollectionOfferModal() {
    document.getElementById('collectionOfferModal').style.display = 'none';
    setCurrentCollectionOffer(null);
  }

  function closeChangePriceModal() {
    setCurrentListingForPriceChange(null);
    document.getElementById('changePriceModal').style.display = 'none';
  }

  function createOfferTypedData(offer) {
    // Use exact same domain as config.js
    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: parseInt(TAIKO_CHAIN_ID, 16),
      verifyingContract: MARKETPLACE_ADDRESS
    };

    // CRITICAL: Use CORRECT order matching contract TYPEHASH
    // "ItemOffer(address nftContract,uint256 tokenId,uint256 price,uint256 amount,uint8 tokenType,uint256 deadline,address offerer,uint256 nonce)"
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      ItemOffer: [
        { name: 'nftContract', type: 'address' },    // 1. nftContract
        { name: 'tokenId', type: 'uint256' },        // 2. tokenId
        { name: 'price', type: 'uint256' },          // 3. price (FIXED ORDER)
        { name: 'amount', type: 'uint256' },         // 4. amount (FIXED ORDER)
        { name: 'tokenType', type: 'uint8' },        // 5. tokenType
        { name: 'deadline', type: 'uint256' },       // 6. deadline (FIXED ORDER)
        { name: 'offerer', type: 'address' },        // 7. offerer (FIXED ORDER)
        { name: 'nonce', type: 'uint256' }           // 8. nonce
      ]
    };

    // Message MUST match the exact order above
    const message = {
      nftContract: offer.nftContract.toString(),
      tokenId: offer.tokenId.toString(),
      price: offer.price.toString(),               // POSITION 3 - FIXED
      amount: offer.amount.toString(),             // POSITION 4 - FIXED
      tokenType: parseInt(offer.tokenType),        // POSITION 5
      deadline: offer.deadline.toString(),         // POSITION 6 - FIXED
      offerer: offer.offerer.toString(),           // POSITION 7 - FIXED
      nonce: offer.nonce.toString()                // POSITION 8
    };

    console.log('🏗️ Building CORRECTED typed data (matching contract TYPEHASH):');
    console.log('  Domain:', domain);
    console.log('  Types:', types);
    console.log('  Message:', message);

    return {
      types: types,
      primaryType: 'ItemOffer',
      domain: domain,
      message: message
    };
  }

  function addToCartFromCard(listingHash) {
    const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
    const listing = listings.find(l => l.hash === listingHash);

    if (!listing) {
      alert('Listing not found');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');

    if (cart.some(item => item.hash === listingHash)) {
      alert('Item already in cart');
      return;
    }

    cart.push({
      hash: listingHash,
      type: 'signature',
      nftName: listing.nftName,
      tokenId: listing.listing.tokenId,
      price: listing.priceETH || parseFloat(parseEther(listing.listing.price.toString())),
      collection: listing.collection,
      seller: listing.listing.seller
    });

    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    updateCartUIListing();
    alert('✅ Added to cart!');
  }

  function updateCartUIListing() {
    const cartButton = document.getElementById('cartButton');
    const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');

    if (cartButton) {
      cartButton.textContent = `🛒 Cart (${cart.length})`;
    }
  }

  function openOfferModalForNFT(nftContract, tokenId, tokenType = 0) {
    console.log('🎯 Opening offer modal for NFT:', nftContract, tokenId, 'tokenType:', tokenType);

    if (!userAccount) {
      showOffersMessage('Please connect your wallet first', 'error');
      return;
    }

    // Normalize tokenType
    const validTokenType = (tokenType === 1 || tokenType === '1') ? 1 : 0;

    setCurrentOfferNFT({
      nftContract,
      tokenId: parseInt(tokenId),
      tokenType: validTokenType
    });

    // Fill modal fields
    document.getElementById('offerContract').value = nftContract;
    document.getElementById('offerTokenId').value = parseInt(tokenId);
    document.getElementById('offerTokenType').value = validTokenType;
    document.getElementById('offerPrice').value = '';
    document.getElementById('offerAmount').value = 1;

    // Configure amount field based on token type
    const amountField = document.getElementById('offerAmount');
    if (validTokenType === 0) {
      amountField.value = 1;
      amountField.readOnly = true;
      amountField.style.background = '#f8f9fa';
    } else {
      amountField.readOnly = false;
      amountField.style.background = '';
    }

    // Show modal
    document.getElementById('makeOfferModal').style.display = 'block';
    document.getElementById('offerMessage').innerHTML = '';

    // Display WETH status
    displayWETHStatus();
  }

  async function displayWETHStatus() {
    if (!userAccount || !wethContract) return;

    try {
      const balance = walletType === 'tairun' ?
        await wethContract.balanceOf(userAccount) :
        await wethContract.methods.balanceOf(userAccount).call();

      const balanceETH = formatEther(balance);

      document.getElementById('offerMessage').innerHTML = `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #2196f3;">
                <h5 style="margin: 0 0 8px 0; color: #1976d2;">💳 Your WETH Balance</h5>
                <div style="font-size: 18px; font-weight: bold; color: #1976d2;">
                    ${parseFloat(balanceETH).toFixed(4)} WETH
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    WETH will be approved automatically when creating the offer
                </div>
            </div>
        `;
    } catch (error) {
      console.error('Error displaying WETH status:', error);
    }
  }

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

    console.log('✅ Found listing:', listing.nftName);
    setCurrentListingForPriceChange(listingHash);
    document.getElementById('newListingPrice').value = currentPrice;
    document.getElementById('changePriceModal').style.display = 'block';
  }

  async function cancelNFTListing(itemId, listingType, listingHash) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this listing?')) {
      return;
    }

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

          alert('✅ Signature listing cancelled successfully!');
          await loadCollectionMyNFTs();
          await loadCollectionMarketplace();
        } else {
          alert('❌ Error cancelling signature listing');
        }
      } else {
        if (!contract) {
          alert('Contract not connected');
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
          collection: currentCollection,
          method: 'traditional'
        });

        alert('✅ Traditional listing cancelled successfully!');
        await loadCollectionMyNFTs();
        await loadCollectionMarketplace();
      }
    } catch (error) {
      console.error('Error cancelling listing:', error);
      alert('Error cancelling listing: ' + error.message);
    }
  }

  function removeSignatureListing(hash) {
    try {
      let listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
      const originalLength = listings.length;
      listings = listings.filter(listing => listing.hash !== hash);

      if (listings.length < originalLength) {
        localStorage.setItem('signature_listings', JSON.stringify(listings));
        console.log('🗑️ Signature listing removed:', hash);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error removing signature listing:', error);
      return false;
    }
  }

  async function loadCollectionMyNFTs() {
    // const container = document.getElementById('collectionMyNFTs');

    // if (!userAccount) {
    //   container.innerHTML = '<div class="info">Please connect your wallet to see your NFTs</div>';
    //   return;
    // }

    // container.innerHTML = '<div class="loading">Loading your NFTs...</div>';

    try {
      console.log('🔍 Loading NFTs for user:', userAccount, 'collection:', currentCollection);

      // Load NFTs from TaikoScan for this specific collection
      const userNFTs = await getUserNFTsFromCollection(currentCollection);

      console.log('📦 Found', userNFTs.length, 'NFTs for user');

      // Check which ones are listed (both signature and traditional)
      const signatureListings = getSignatureListingsForCollection(currentCollection);

      // Mark NFTs as listed and add listing info
      const nftsWithStatus = userNFTs.map(nft => {
        // Check signature listings
        const sigListing = signatureListings.find(listing =>
          listing.listing.tokenId === nft.tokenId
        );

        if (sigListing) {
          return {
            ...nft,
            isListed: true,
            listingPrice: sigListing.listing.price,
            listingPriceETH: sigListing.priceETH,
            listingType: 'signature',
            listingHash: sigListing.hash,
            itemId: `sig_${sigListing.hash}`
          };
        }

        return nft;
      });

      // Sort to show listed items first
      nftsWithStatus.sort((a, b) => {
        if (a.isListed && !b.isListed) return -1;
        if (!a.isListed && b.isListed) return 1;
        return 0;
      });

      console.log('✅ Processed', nftsWithStatus.length, 'NFTs with listing status');

      // renderCollectionMyNFTs(nftsWithStatus);
      setCollectionMyNFTs(nftsWithStatus);

    } catch (error) {
      console.error('Error loading collection my NFTs:', error);
      // container.innerHTML = '<div class="error">Error loading your NFTs</div>';
    }
  }

  // function toggleNFTSelection(contract, tokenId) {
  //   // Find the real NFT from the loaded collection
  //   const nft = collectionMyNFTs.find(n => n.contract.toLowerCase() === contract.toLowerCase() && n.tokenId === tokenId);
  //   if (!nft || nft.isListed) return;
  //
  //   const isAlreadySelected = selectedNFTs.find(n => n.contract.toLowerCase() === contract.toLowerCase() && n.tokenId === tokenId);
  //
  //   let selectedNFT = selectedNFTs;
  //   if (isAlreadySelected) {
  //     selectedNFT = selectedNFTs.filter(n => !(n.contract.toLowerCase() === contract.toLowerCase() && n.tokenId === tokenId));
  //   } else {
  //     selectedNFT.push({...nft});
  //   }
  //
  //   setSelectedNFTs(selectedNFT)
  //
  //   updateSelectionUI();
  //   // renderCollectionMyNFTs(collectionMyNFTs); // Use the loaded NFTs
  //   setCollectionMyNFTs(collectionMyNFTs); // Use the loaded NFTs
  // }

  const toggleNFTSelection = (contract, tokenId) => {
    const nft = collectionMyNFTs.find(n => n.contract.toLowerCase() === contract.toLowerCase() && n.tokenId === tokenId);
    if (!nft || nft.isListed) return;

    setSelectedNFTs((prevSelected) => {
      const isAlreadySelected = prevSelected.some(
        (n) => n.contract.toLowerCase() === nft.contract.toLowerCase() && n.tokenId === nft.tokenId
      );

      if (isAlreadySelected) {
        return prevSelected.filter(
          (n) => !(n.contract.toLowerCase() === nft.contract.toLowerCase() && n.tokenId === nft.tokenId)
        );
      } else {
        return [...prevSelected, { ...nft }];
      }
    });

    updateSelectionUI();
    // renderCollectionMyNFTs(collectionMyNFTs); // Use the loaded NFTs
    setCollectionMyNFTs(collectionMyNFTs);
  };

  function updateSelectionUI() {
    const selectedCount = selectedNFTs.length;
    const listBtn = document.getElementById('listSelectedCollectionBtn');
    const selectedCountSpan = document.getElementById('selectedCollectionCount');

    if (listBtn && selectedCountSpan) {
      if (selectedCount > 0) {
        listBtn.style.display = 'block';
        selectedCountSpan.textContent = selectedCount;
      } else {
        listBtn.style.display = 'none';
      }
    }
  }

  function getSignatureListingsForCollection(nftContract) {
    const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
    const filteredListings = listings.filter(listing =>
      listing.listing.nftContract?.toLowerCase() === nftContract?.toLowerCase() &&
      listing.listing.deadline > Math.floor(Date.now() / 1000) &&
      listing.listing.seller.toLowerCase() === userAccount?.toLowerCase()
    );

    console.log(`📋 Found ${filteredListings.length} signature listings for collection ${nftContract}`);
    return filteredListings;
  }

  async function fetchTaikoScanData(url) {
    try {
      console.log('🌐 Fetching from:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('📥 API Response:', data.status, data.message);
      return data.result || [];
    } catch (error) {
      console.error('Error fetching from TaikoScan:', error);
      return [];
    }
  }

  function calculateNFTHoldings(transactions) {
    const holdings = {};
    console.log('🧮 Calculating holdings from', transactions.length, 'transactions');

    for (const tx of transactions) {
      const key = `${tx.contractAddress}_${tx.tokenID || ''}`;
      const direction = tx.to.toLowerCase() === userAccount.toLowerCase() ? 1 : -1;
      const amount = Number(tx.value || tx.tokenValue || 1);
      if (!holdings[key]) {
        holdings[key] = { ...tx, balance: 0 };
      }
      holdings[key].balance += direction * amount;
    }
    const result = Object.values(holdings).filter(h => h.balance > 0);
    console.log('📊 Final holdings:', result.length, 'NFTs owned');
    return result;
  }

  async function getUserNFTsFromCollection(collectionAddress) {
    try {
      console.log('🔍 Fetching NFTs from TaikoScan for:', collectionAddress, 'user:', userAccount);

      // Fetch NFTs for this specific collection
      const erc721URL = `https://api.taikoscan.io/api?module=account&action=tokennfttx&contractaddress=${collectionAddress}&address=${userAccount}&page=1&offset=1000&sort=asc&apikey=${TAIKOSCAN_API_KEY}`;
      const erc1155URL = `https://api.taikoscan.io/api?module=account&action=token1155tx&contractaddress=${collectionAddress}&address=${userAccount}&page=1&offset=1000&sort=asc&apikey=${TAIKOSCAN_API_KEY}`;

      const [erc721Raw, erc1155Raw] = await Promise.all([
        fetchTaikoScanData(erc721URL),
        fetchTaikoScanData(erc1155URL),
      ]);

      console.log('📦 TaikoScan data:', {
        erc721: erc721Raw.length,
        erc1155: erc1155Raw.length
      });

      // Calculate holdings
      const allTokens = calculateNFTHoldings(erc721Raw.concat(erc1155Raw));

      console.log('📊 Calculated holdings:', allTokens.length);

      // Add metadata and listing status
      const nftsWithData = allTokens.map((token) => {
        const tokenType = erc1155Raw.find(e => e.tokenID === token.tokenID) ? 1 : 0;

        return {
          contract: token.contractAddress,
          tokenId: parseInt(token.tokenID),
          name: `Token #${token.tokenID}`,
          collection: nftCollections[collectionAddress.toLowerCase()]?.name || 'Unknown Collection',
          tokenType: tokenType,
          amount: token.balance,
          image: '',
          isListed: false,
          listingPrice: null,
          itemId: null
        };
      });

      console.log('✅ Final NFTs with data:', nftsWithData.length);
      return nftsWithData;

    } catch (error) {
      console.error('Error getting collection NFTs:', error);
      return [];
    }
  }

  function loadCollectionOffers() {
    console.log('📊 loadCollectionOffers called for collection:', currentCollection);

    // Delegate to the offers system if available
    // if (typeof renderOffersForCollection === 'function') {
      // console.log('✅ Delegating to renderOffersForCollection from offers.js');
      // renderOffersForCollection();
    // } else {
      console.log('❌ renderOffersForCollection not available, showing placeholder');

      // Fallback placeholder until offers.js loads
      const container = document.getElementById('offersContent');
      if (container) {
        container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h4>💰 FIXED Offers System Loading...</h4>
                    <p>The FIXED offers system is initializing. Please wait a moment.</p>
                    <div style="margin-top: 20px;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;

        // Retry after a short delay
        // setTimeout(() => {
          // if (typeof renderOffersForCollection === 'function') {
          //   console.log('🔄 Retrying renderOffersForCollection...');
          //   // renderOffersForCollection();
          // }
        // }, 2000);
      }
    // }
  }


  function renderCollectionActivity(activities) {
    const container = document.getElementById('collectionActivity');

    if (activities.length === 0) {
      container.innerHTML = '<div class="loading">No recent activity for this collection</div>';
      return;
    }

    const timeline = document.createElement('div');
    timeline.className = 'activity-timeline';

    activities.forEach(activity => {
      const item = createActivityItem(activity);
      timeline.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(timeline);
  }

  function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';

    let icon, title, details;

    switch (activity.type) {
      case 'listed':
        icon = '📝';
        title = `${activity.nft} listed for sale`;
        details = `By ${activity.user.substring(0, 10)}... for ${activity.price} ETH (${activity.method})`;
        break;
      case 'sold':
        icon = '💰';
        title = `${activity.nft} sold`;
        details = `From ${activity.seller.substring(0, 10)}... to ${activity.buyer.substring(0, 10)}... for ${activity.price} ETH`;
        break;
      case 'cancelled':
        icon = '❌';
        title = `${activity.nft} listing cancelled`;
        details = `By ${activity.user.substring(0, 10)}... (was ${activity.price} ETH)`;
        break;
      case 'offer_made':
        icon = '💸';
        title = `Offer made on ${activity.nft}`;
        details = `${activity.price} WETH by ${activity.user.substring(0, 10)}...`;
        break;
      case 'offer_accepted':
        icon = '✅';
        title = `Offer accepted for ${activity.nft}`;
        details = `${activity.price} WETH - Sold to ${activity.buyer.substring(0, 10)}...`;
        break;
      case 'offer_cancelled':
        icon = '🚫';
        title = `Offer cancelled for ${activity.nft}`;
        details = `${activity.price} WETH by ${activity.user.substring(0, 10)}...`;
        break;
      case 'offer_rejected':
        icon = '❌';
        title = `Offer rejected for ${activity.nft}`;
        details = `${activity.price} WETH offer by ${activity.offerer.substring(0, 10)}... was rejected`;
        break;
      default:
        icon = '📊';
        title = `${activity.type} - ${activity.nft}`;
        details = activity.details || '';
    }

    item.innerHTML = `
        <div class="activity-icon ${activity.type}">
            ${icon}
        </div>
        <div class="activity-content">
            <div class="activity-title">${title}</div>
            <div class="activity-details">${details}</div>
        </div>
        <div class="activity-time">
            ${formatTimeAgo(activity.time)}
        </div>
    `;

    return item;
  }

  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function loadCollectionActivity() {
    const container = document.getElementById('collectionActivity');
    container.innerHTML = '<div class="loading">Loading collection activity...</div>';

    try {
      // Load real activity from localStorage
      const activity = JSON.parse(localStorage.getItem('marketplace_activity') || '[]');
      const collectionActivity = activity.filter(act =>
        act.collection && act.collection.toLowerCase() === currentCollection.toLowerCase()
      ).map(act => ({
        ...act,
        time: new Date(act.time) // Convert back to Date object
      }));

      console.log(`📊 Found ${collectionActivity.length} activity items for collection`);

      renderCollectionActivity(collectionActivity);

    } catch (error) {
      console.error('Error loading collection activity:', error);
      container.innerHTML = '<div class="error">Error loading activity</div>';
    }
  }

  const openListingModal = () => {
    setOpenListModal(true)
    // console.log('📝 Opening list modal, selected NFTs:', selectedNFTs.length);
    //
    // if (selectedNFTs.length === 0) {
    //   alert('Please select at least one NFT to list');
    //   return;
    // }
    //
    // document.getElementById('modalSelectedCount').textContent = selectedNFTs.length;
    // document.getElementById('pricingStrategy').value = 'uniform';
    // document.getElementById('listingPrice').value = '';
    // document.getElementById('listingDuration').value = '2592000';
    //
    // selectedNFTs.forEach(nft => {
    //   delete nft.customPrice;
    // });
    //
    // togglePricingMode();
    //
    // document.getElementById('listModal').style.display = 'block';
  }

  function togglePricingMode() {
    const strategy = document.getElementById('pricingStrategy').value;
    const uniformDiv = document.getElementById('uniformPricing');
    const individualDiv = document.getElementById('individualPricing');
    const buttonText = document.getElementById('listingButtonText');

    if (strategy === 'uniform') {
      uniformDiv.style.display = 'block';
      individualDiv.style.display = 'none';
      buttonText.textContent = 'List All NFTs Individually';
    } else {
      uniformDiv.style.display = 'none';
      individualDiv.style.display = 'block';
      // renderIndividualPrices();
      buttonText.textContent = 'List All NFTs with Custom Prices';
    }
  }
  const removeNFTFromSelection = (contract, tokenId) => {
    const updated = selectedNFTs.filter(n => !(n.contract === contract && n.tokenId === tokenId));
    setSelectedNFTs(updated);
  };

  // function renderIndividualPrices() {
  //   const container = document.getElementById('individualPricesList');
  //   if (!container) return;
  //
  //   container.innerHTML = '';
  //
  //   selectedNFTs.forEach((nft, index) => {
  //     const item = document.createElement('div');
  //     item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; margin: 8px 0; border-radius: 6px; border: 1px solid #ddd;';
  //
  //     item.innerHTML = `
  //           <div style="flex: 1;">
  //               <strong>${nft.name}</strong><br>
  //               <small style="color: #666;">${nft.collection} - ID: ${nft.tokenId}</small>
  //           </div>
  //           <div style="display: flex; align-items: center; gap: 10px;">
  //               <input type="number"
  //                      id="price_${index}"
  //                      class="form-input"
  //                      placeholder="0.001"
  //                      step="0.001"
  //                      min="0.001"
  //                      style="width: 120px;"
  //                      value="${nft.customPrice || ''}"
  //                      onchange="updateNFTPrice(${index}, this.value)">
  //               <span style="color: #666; font-size: 14px;">ETH</span>
  //           </div>
  //       `;
  //
  //     container.appendChild(item);
  //   });
  // }

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

  const updateNFTPrice = (index, value) => {
    const updated = [...selectedNFTs];
    updated[index].customPrice = value;
    setSelectedNFTs(updated);
  };

  // function updateNFTPrice(index, price) {
  //   if (selectedNFTs[index]) {
  //     selectedNFTs[index].customPrice = parseFloat(price) || 0;
  //   }
  // }

  async function listSelectedNFTs() {
    console.log('📝 Starting listing process...');

    if (!contract || !userAccount) {
      setToast({message: 'Please connect your wallet first', type: 'error'});
      return;
    }

    if (selectedNFTs.length === 0) {
      setToast({message: 'No NFTs selected', type: 'error'});
      return;
    }

    const strategy = document.getElementById('pricingStrategy').value;
    const duration = document.getElementById('listingDuration').value;
    let prices = [];

    try {
      if (strategy === 'uniform') {
        const uniformPrice = document.getElementById('listingPrice').value;
        if (!uniformPrice || parseFloat(uniformPrice) <= 0) {
          setToast({message: 'Please enter a valid uniform price', type: 'error'});
          return;
        }
        prices = selectedNFTs.map(() => parseFloat(uniformPrice));
      } else {
        prices = selectedNFTs.map((nft, index) => {
          const price = nft.customPrice || 0;
          if (price <= 0) {
            throw new Error(`Please set a valid price for ${nft.name}`);
          }
          return price;
        });
      }
    } catch (error) {
      setToast({message: error.message, type: 'error'});
      return;
    }

    try {
      closeListModal();
      showProgressModal('📝 Signing NFTs', selectedNFTs.length);

      // Check and handle approvals
      const uniqueContracts = [...new Set(selectedNFTs.map(nft => nft.contract.toLowerCase()))];

      for (const contractAddress of uniqueContracts) {
        const nft = selectedNFTs.find(n => n.contract.toLowerCase() === contractAddress);

        updateProgress(0, selectedNFTs.length, '', `🔐 Checking approval for ${nft.collection}...`);

        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const signer = provider.getSigner();
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
          updateProgress(0, selectedNFTs.length, '', `🔐 Approving ${nft.collection}...`);
          const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
          await approveTx.wait();
          updateProgress(0, selectedNFTs.length, '', `✅ ${nft.collection} approved!`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (selectedNFTs.length > 1) {
        await createBatchListing(prices, duration);
      } else {
        await createSingleListing(prices[0], duration);
      }

    } catch (error) {
      console.error('Error in listing process:', error);
      hideProgressModal();
      setToast({message: 'Error in listing process: ' + error.message, type: 'error'});
    }
  }

  async function createSingleListing(price, duration) {
    const deadline = duration === '0' ?
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) :
      Math.floor(Date.now() / 1000) + parseInt(duration);

    const nft = selectedNFTs[0];

    try {
      updateProgress(1, 1, nft.name, '📝 Signing...');

      const signedListing = await signListing(
        nft.contract,
        nft.tokenId,
        price,
        nft.amount,
        nft.tokenType,
        deadline
      );

      saveSignatureListing(signedListing, nft);

      updateProgress(1, 1, nft.name, '🎉 Listed Successfully!');

      setTimeout(() => {
        hideProgressModal();
        setSelectedNFTs([]);
        updateSelectionUI();
        loadCollectionMyNFTs();
        loadCollectionMarketplace();
      }, 2000);

    } catch (error) {
      console.error('Error creating listing:', error);
      hideProgressModal();
      setToast({message: 'Error creating listing: ' + error.message, type: 'error'});
    }
  }

  function showProgressModal(title, total) {
    let progressModal = document.getElementById('progressModal');
    if (!progressModal) {
      progressModal = document.createElement('div');
      progressModal.id = 'progressModal';
      progressModal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.7); display: none; z-index: 10000;
            justify-content: center; align-items: center;
        `;

      const content = document.createElement('div');
      content.style.cssText = `
            background: white; padding: 30px; border-radius: 12px; 
            max-width: 500px; width: 90%; text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

      content.innerHTML = `
            <div id="progressTitle" style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;"></div>
            <div id="progressCurrent" style="font-size: 48px; font-weight: bold; color: #667eea; margin: 20px 0;"></div>
            <div id="progressTotal" style="font-size: 18px; color: #666; margin-bottom: 20px;"></div>
            <div id="progressNFTName" style="font-size: 16px; color: #333; margin: 15px 0; font-weight: 500;"></div>
            <div style="background: #f0f0f0; height: 8px; border-radius: 4px; margin: 20px 0; overflow: hidden;">
                <div id="progressBar" style="background: #667eea; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <div id="progressStatus" style="color: #666; font-size: 14px; margin-top: 15px;"></div>
        `;

      progressModal.appendChild(content);
      document.body.appendChild(progressModal);
    }

    document.getElementById('progressTitle').textContent = title;
    document.getElementById('progressTotal').textContent = `of ${total} NFTs`;
    document.getElementById('progressCurrent').textContent = '0';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressNFTName').textContent = '';
    document.getElementById('progressStatus').textContent = 'Preparing...';

    progressModal.style.display = 'flex';
  }

  function updateProgress(current, total, nftName, status) {
    const progressCurrent = document.getElementById('progressCurrent');
    const progressNFTName = document.getElementById('progressNFTName');
    const progressStatus = document.getElementById('progressStatus');
    const progressBar = document.getElementById('progressBar');

    if (progressCurrent) progressCurrent.textContent = current;
    if (progressNFTName) progressNFTName.textContent = nftName || '';
    if (progressStatus) progressStatus.textContent = status || '';

    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = percentage + '%';
    }
  }

  function hideProgressModal() {
    const progressModal = document.getElementById('progressModal');
    if (progressModal) {
      progressModal.style.display = 'none';
    }
  }

  async function createBatchListing(prices, duration) {
    const deadline = duration === '0' ?
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) :
      Math.floor(Date.now() / 1000) + parseInt(duration);

    try {
      for (let i = 0; i < selectedNFTs.length; i++) {
        const nft = selectedNFTs[i];
        const price = prices[i];

        updateProgress(i + 1, selectedNFTs.length, nft.name, '📝 Signing...');

        const signedListing = await signListing(
          nft.contract,
          nft.tokenId,
          price,
          nft.amount,
          nft.tokenType,
          deadline
        );

        saveSignatureListing(signedListing, nft);

        updateProgress(i + 1, selectedNFTs.length, nft.name, '✅ Signed!');

        if (i < selectedNFTs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      updateProgress(selectedNFTs.length, selectedNFTs.length, '', '🎉 All NFTs Listed Successfully!');

      setTimeout(() => {
        hideProgressModal();
        setSelectedNFTs([]);
        updateSelectionUI();
        loadCollectionMyNFTs();
        loadCollectionMarketplace();
      }, 2000);

    } catch (error) {
      console.error('Error creating batch listing:', error);
      hideProgressModal();
      setToast({message: 'Error creating batch listing: ' + error.message, type: 'error'});
    }
  }

  function saveSignatureListing(signedListing, nft) {
    let listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');

    signedListing.nftName = nft.name;
    signedListing.collection = nft.collection;

    listings.push(signedListing);
    localStorage.setItem('signature_listings', JSON.stringify(listings));

    console.log('✅ Listing saved with hash:', signedListing.hash);

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













  //offer-gg
  function showCollectionOfferMessage(message, type) {
    const messageDiv = document.getElementById('collectionOfferMessage');
    if (!messageDiv) return;

    const bgColor = type === 'error' ? '#ffebee' : type === 'success' ? '#e8f5e8' : type === 'warning' ? '#fff3cd' : '#e3f2fd';
    const borderColor = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ffc107' : '#2196f3';
    const textColor = type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : type === 'warning' ? '#856404' : '#1976d2';
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔄';

    messageDiv.innerHTML = `
        <div style="background: ${bgColor}; padding: 15px; border-radius: 8px; border-left: 4px solid ${borderColor}; margin-bottom: 15px;">
            <div style="color: ${textColor}; font-weight: bold;">${icon} ${message}</div>
        </div>
    `;
  }

  async function checkWETHBalance(userAddress, requiredAmount) {
    if (!wethContract || !userAddress) return { hasBalance: false, balance: '0' };

    try {
      const balance = walletType === 'tairun' ?
        await wethContract.balanceOf(userAddress) :
        await wethContract.methods.balanceOf(userAddress).call();

      return {
        // hasBalance: web3.utils.toBN(balance).gte(web3.utils.toBN(requiredAmount)),
        // balance: balance,
        // balanceETH: web3.utils.fromWei(balance, 'ether'),
        // requiredETH: web3.utils.fromWei(requiredAmount, 'ether')

        // eslint-disable-next-line no-undef
        hasBalance: BigInt(balance) >= BigInt(requiredAmount),
        balance: balance,
        balanceETH: formatEther(balance),
        requiredETH: formatEther(requiredAmount)
      };
    } catch (error) {
      console.error('Error checking WETH balance:', error);
      return { hasBalance: false, balance: '0' };
    }
  }

  async function checkWETHAllowance(userAddress, requiredAmount) {
    if (!wethContract || !userAddress || !MARKETPLACE_ADDRESS) return { hasAllowance: false, allowance: '0' };

    try {
      const allowance = walletType === 'tairun' ?
        await wethContract.allowance(userAddress, MARKETPLACE_ADDRESS) :
        await wethContract.methods.allowance(userAddress, MARKETPLACE_ADDRESS).call();
      return {
        // hasAllowance: web3.utils.toBN(allowance).gte(web3.utils.toBN(requiredAmount)),
        // allowance: allowance,
        // allowanceETH: web3.utils.fromWei(allowance, 'ether')

        // eslint-disable-next-line no-undef
        hasAllowance: BigInt(allowance) >= BigInt(requiredAmount),
        allowance: allowance,
        allowanceETH: formatEther(allowance)
      };
    } catch (error) {
      console.error('Error checking WETH allowance:', error);
      return { hasAllowance: false, allowance: '0' };
    }
  }

  async function approveWETH(amount, userAddress) {
    if (!wethContract || !userAddress || !MARKETPLACE_ADDRESS) {
      throw new Error('WETH contract not available');
    }

    console.log('🔐 Approving WETH spending:', formatEther(amount));

    if (walletType === 'tairun') {
      // 🟢 Ethers.js (signer-based)
      const tx = await wethContract.approve(MARKETPLACE_ADDRESS, amount);
      return await tx.wait(); // așteaptă confirmarea
    } else {
      // 🟢 Web3.js (MetaMask or browser wallet)
      return await wethContract.methods.approve(MARKETPLACE_ADDRESS, amount).send({
        from: userAddress,
        gas: 100000 });
    }

  }

  //offer-gg
  async function submitCollectionOffer() {
    if (!userAccount) {
      showCollectionOfferMessage('Please connect your wallet', 'error');
      return;
    }

    if (!currentCollectionOffer) {
      showCollectionOfferMessage('Invalid collection data', 'error');
      return;
    }

    const pricePerItem = document.getElementById('collectionOfferPrice').value;
    const itemCount = document.getElementById('collectionOfferQuantity').value;
    const duration = parseInt(document.getElementById('collectionOfferDuration').value);

    if (!pricePerItem || parseFloat(pricePerItem) <= 0) {
      showCollectionOfferMessage('Please enter a valid price per item', 'error');
      return;
    }

    if (!itemCount || parseInt(itemCount) <= 0) {
      showCollectionOfferMessage('Please enter a valid quantity', 'error');
      return;
    }

    try {

      const pricePerItemWei = parseEther(pricePerItem.toString()); // string -> BigInt (in wei)
      // eslint-disable-next-line no-undef
      const totalPrice = pricePerItemWei * BigInt(itemCount);

      showCollectionOfferMessage('Checking WETH requirements...', 'info');

      // Check WETH balance
      const balanceCheck = await checkWETHBalance(userAccount, totalPrice.toString());
      if (!balanceCheck.hasBalance) {
        showCollectionOfferMessage(
          `Insufficient WETH balance. You need ${parseEther(totalPrice.toString())} WETH but have ${balanceCheck.balanceETH} WETH.`,
          'error'
        );
        return;
      }

      // Check WETH allowance
      const allowanceCheck = await checkWETHAllowance(userAccount, totalPrice.toString());
      if (!allowanceCheck.hasAllowance) {
        showCollectionOfferMessage('Approving WETH spending...', 'info');
        await approveWETH(totalPrice.toString(), userAccount);
        showCollectionOfferMessage('WETH approved successfully!', 'success');
      }

      showCollectionOfferMessage('Creating collection offer signature...', 'info');

      // Get user nonce
      const nonce = await getUserNonce(userAccount);
      const deadline = duration === 0 ? 0 : Math.floor(Date.now() / 1000) + duration;

      // Create collection offer object using correct EIP-712 structure
      const collectionOffer = {
        nftContract: currentCollectionOffer.nftContract,
        pricePerItem: pricePerItemWei,
        itemCount: parseInt(itemCount),
        tokenType: 0, // Default to ERC721 for collections
        deadline: deadline,
        offerer: userAccount,
        nonce: parseInt(nonce),
        // UI data
        pricePerItemETH: parseFloat(pricePerItem),
        totalPriceETH: parseFloat(pricePerItem) * parseInt(itemCount)
      };

      // Create EIP-712 signature
      collectionOffer.signature = await signCollectionOffer(collectionOffer);

      // Save the collection offer
      saveCollectionOffer(collectionOffer);
      showCollectionOfferMessage('✅ Collection offer created successfully!', 'success');

      setTimeout(() => {
        closeCollectionOfferModal();
        // Refresh offers display
        // if (typeof renderOffersForCollection === 'function') {
        //   renderOffersForCollection();
        // }
      }, 2000);

    } catch (error) {
      console.error('Error creating collection offer:', error);

      let errorMessage = 'Failed to create collection offer';
      if (error.message.includes('cancelled') || error.message.includes('User denied')) {
        errorMessage = 'Collection offer creation was cancelled';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showCollectionOfferMessage(errorMessage, 'error');
    }
  }


  //offer-gg
  function getStoredCollectionOffers() {
    try {
      const stored = localStorage.getItem('marketplace_collection_offers_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading collection offers:', error);
      return [];
    }
  }

  //offer-gg
  function saveCollectionOffer(offer) {
    try {
      const offers = getStoredCollectionOffers();
      offer.id = `collection_offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      offer.createdAt = Date.now();
      offer.status = 'active';
      offer.remainingItems = offer.itemCount; // Track remaining items
      offers.push(offer);
      localStorage.setItem('marketplace_collection_offers_v1', JSON.stringify(offers));
      console.log('✅ Collection offer saved:', offer.id);
      return offer.id;
    } catch (error) {
      console.error('Error saving collection offer:', error);
      throw new Error('Failed to save collection offer');
    }
  }

  //offer-gg
  async function signCollectionOffer(offer) {
    if (!userAccount) throw new Error('Wallet not connected');

    const typedData = createCollectionOfferTypedData(offer);

    console.log('✍️ Requesting signature for collection offer...');
    console.log('📋 Complete typed data:', JSON.stringify(typedData, null, 2));

    try {
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [userAccount, JSON.stringify(typedData)]
      });

      console.log('✅ Collection offer signature created successfully');
      console.log('🔐 Signature:', signature);

      return signature;
    } catch (error) {
      console.error('Collection offer signature failed:', error);
      throw new Error('Signature cancelled or failed');
    }
  }

  async function getUserNonce(userAddress) {
    if (!contract || !userAddress) throw new Error('Contract not available');
    try {
      return walletType === 'tairun' ?
        await contract.getUserNonce(userAddress) :
        await contract.methods.getUserNonce(userAddress).call();
    } catch (error) {
      console.error('Error getting user nonce:', error);
      throw new Error('Failed to get user nonce');
    }
  }

  //offer-gg
  function createCollectionOfferTypedData(offer) {
    const domain = {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      chainId: parseInt(TAIKO_CHAIN_ID, 16),
      verifyingContract: MARKETPLACE_ADDRESS
    };

    // Correct order matching contract TYPEHASH for CollectionOffer
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      CollectionOffer: [
        { name: 'nftContract', type: 'address' },
        { name: 'pricePerItem', type: 'uint256' },
        { name: 'itemCount', type: 'uint256' },
        { name: 'tokenType', type: 'uint8' },
        { name: 'deadline', type: 'uint256' },
        { name: 'offerer', type: 'address' },
        { name: 'nonce', type: 'uint256' }
      ]
    };

    const message = {
      nftContract: offer.nftContract.toString(),
      pricePerItem: offer.pricePerItem.toString(),
      itemCount: offer.itemCount.toString(),
      tokenType: parseInt(offer.tokenType),
      deadline: offer.deadline.toString(),
      offerer: offer.offerer.toString(),
      nonce: offer.nonce.toString()
    };

    console.log('🏗️ Building collection offer typed data:');
    console.log('  Domain:', domain);
    console.log('  Types:', types);
    console.log('  Message:', message);

    return {
      types: types,
      primaryType: 'CollectionOffer',
      domain: domain,
      message: message
    };
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
        loadCollectionMyNFTs();
        loadCollectionMarketplace();
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


  //offer-gg
  async function submitOffer() {
    if (!userAccount) {
      showOffersMessage('Please connect your wallet', 'error');
      return;
    }

    if (!currentOfferNFT) {
      showOffersMessage('Invalid NFT data', 'error');
      return;
    }

    const price = document.getElementById('offerPrice').value;
    const amount = document.getElementById('offerAmount').value;
    const duration = parseInt(document.getElementById('offerDuration').value);

    if (!price || parseFloat(price) <= 0) {
      showOffersMessage('Please enter a valid price', 'error');
      return;
    }

    if (!amount || parseInt(amount) <= 0) {
      showOffersMessage('Please enter a valid amount', 'error');
      return;
    }

    try {
      const priceWei = parseEther(price.toString());

      setToast({message: 'Checking WETH requirements...', type: 'success'});

      // Check WETH balance
      const balanceCheck = await checkWETHBalance(userAccount, priceWei);
      if (!balanceCheck.hasBalance) {
        setToast({message:
            `Insufficient WETH balance. You need ${balanceCheck.requiredETH} WETH but have ${balanceCheck.balanceETH} WETH.`,
          type: 'error'}
        );
        return;
      }

      // Check WETH allowance
      const allowanceCheck = await checkWETHAllowance(userAccount, priceWei);
      if (!allowanceCheck.hasAllowance) {
        setToast({message: 'Approving WETH spending...', type: 'success'});
        await approveWETH(priceWei, userAccount);
        setToast({message: 'WETH approved successfully!', type: 'success'});
      }

        setToast({message: 'Creating offer signature...', type: 'success'});

      // Get user nonce
      const nonce = await getUserNonce(userAccount);
      const deadline = duration === 0 ? 0 : Math.floor(Date.now() / 1000) + duration;

      // Create offer object
      const offer = {
        nftContract: currentOfferNFT.nftContract,
        tokenId: currentOfferNFT.tokenId,
        offerer: userAccount,
        price: priceWei,
        amount: parseInt(amount),
        tokenType: currentOfferNFT.tokenType,
        deadline: deadline,
        nonce: parseInt(nonce),
        // UI data
        priceETH: parseFloat(price)
      };

      // Sign the offer
      offer.signature = await signOffer(offer);

      // Save the offer
      const offerId = saveOffer(offer);

        setToast({message: '✅ Offer created successfully!', type: 'success'});

      setTimeout(() => {
        closeMakeOfferModal();
        // Refresh offers display
        // if (typeof renderOffersForCollection === 'function') {
        //   renderOffersForCollection();
        // }
      }, 2000);

    } catch (error) {
      console.error('Error creating offer:', error);

      let errorMessage = 'Failed to create offer';
      if (error.message.includes('cancelled') || error.message.includes('User denied')) {
        errorMessage = 'Offer creation was cancelled';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message) {
        errorMessage = error.message;
      }

          setToast({message: errorMessage, type: 'error'});
    }
  }

  //offer-gg
  function saveOffer(offer) {
    try {
      const offers = getStoredOffers();
      offer.id = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      offer.createdAt = Date.now();
      offer.status = 'active';
      offers.push(offer);
      localStorage.setItem('marketplace_nft_offers_v1', JSON.stringify(offers));
      console.log('✅ Offer saved:', offer.id);
      return offer.id;
    } catch (error) {
      console.error('Error saving offer:', error);
      throw new Error('Failed to save offer');
    }
  }

  //offer-gg
  function getStoredOffers() {
    try {
      const stored = localStorage.getItem('marketplace_nft_offers_v1');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading offers:', error);
      return [];
    }
  }

  //offer-gg
  function getOffersForCollection(collectionContract) {
    const offers = getStoredOffers();
    const filteredOffers = offers.filter(offer =>
      offer.nftContract.toLowerCase() === collectionContract.toLowerCase() &&
      offer.status === 'active' &&
      !isOfferExpired(offer)
    );

    setCollectionOffers(filteredOffers)
  }

  //offer-gg
  function isOfferExpired(offer) {
    if (offer.deadline === 0) return false;
    return Math.floor(Date.now() / 1000) > offer.deadline;
  }

  // function renderOffersForCollection() {
    // if (!currentCollection) {
    //   console.log('❌ No current collection set');
    //   return;
    // }
    //
    // console.log('📊 Rendering offers for collection:', currentCollection);

    // const container = document.getElementById('offersContent');
    // if (!container) {
    //   console.log('❌ Offers container not found');
    //   return;
    // }

    // const collectionOffers = getOffersForCollection(currentCollection);

    // let html = '';
    //
    // if (userAccount) {
    //   html += `
    //         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    //             <h3>💰 Active Offers for Collection</h3>
    //             <div style="display: flex; gap: 10px;">
    //                 <button class="btn btn-primary" onclick="alert('Browse NFTs to make individual offers!')">
    //                     💰 Make Offer
    //                 </button>
    //             </div>
    //         </div>
    //     `;
    // } else {
    //   html += '<h3>💰 Active Offers for Collection</h3>';
    // }

    // if (collectionOffers.length === 0) {
    //   html += `
    //         <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;">
    //             <h4>💰 No Active Offers</h4>
    //             <p>No offers found for this collection yet.</p>
    //             ${userAccount ? `
    //                 <p style="margin-top: 15px;">Browse NFTs in the Marketplace tab to make offers!</p>
    //             ` : ''}
    //         </div>
    //     `;
    // } else {
    //   html += `
    //         <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
    //             <h5 style="color: #2e7d32; margin-bottom: 8px;">✅ FIXED Signature-Based Offers System</h5>
    //             <p style="color: #666; margin: 0; font-size: 14px;">
    //                 These offers use the corrected EIP-712 signature order. Signatures should now be valid!
    //             </p>
    //         </div>
    //         <div class="offers-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    //     `;

      // collectionOffers.forEach(offer => {
      //   const timeLeft = getTimeLeft(offer.deadline);
      //   const isOwner = userAccount && offer.offerer.toLowerCase() === userAccount.toLowerCase();
      //   const canAccept = userAccount && !isOwner;
      //
      //   html += `
      //           <div class="offer-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      //               <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
      //                   <div>
      //                       <div style="font-size: 18px; font-weight: bold; color: #333;">
      //                           ${offer.priceETH} ETH
      //                       </div>
      //                       <div style="font-size: 14px; color: #666; margin-top: 5px;">
      //                           Token #${offer.tokenId}
      //                       </div>
      //                   </div>
      //                   <div style="font-size: 12px; color: #4caf50; font-weight: bold; background: #e8f5e8; padding: 4px 8px; border-radius: 4px;">
      //                       FIXED ✅
      //                   </div>
      //               </div>
      //
      //               <div style="font-size: 12px; color: #666; margin-bottom: 15px; line-height: 1.4;">
      //                   <div><strong>From:</strong> ${formatAddress(offer.offerer)}</div>
      //                   <div><strong>Amount:</strong> ${offer.amount}</div>
      //                   <div><strong>Type:</strong> ${offer.tokenType === 0 ? 'ERC721' : 'ERC1155'}</div>
      //                   <div><strong>Expires:</strong> ${timeLeft}</div>
      //                   <div style="color: #2e7d32;"><strong>✅ Corrected signature</strong></div>
      //               </div>
      //
      //               <div style="display: flex; gap: 8px; justify-content: flex-end;">
      //                   ${canAccept ? `
      //                       <button class="btn btn-success" style="padding: 8px 16px; font-size: 14px;" onclick="acceptItemOffer('${offer.id}')">
      //                           Accept Offer
      //                       </button>
      //                   ` : ''}
      //                   ${isOwner ? `
      //                       <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;" onclick="cancelOffer('${offer.id}')">
      //                           Cancel
      //                       </button>
      //                   ` : ''}
      //               </div>
      //           </div>
      //       `;
      // });
      //
      // html += '</div>';
    // }

  //   container.innerHTML = html;
  //   console.log('✅ Offers rendered successfully');
  // }

  //offer-gg
  const OffersForCollection = ({ currentCollection, userAccount, offers, onAccept, onCancel }) => {
    if (!currentCollection) {
      return <div>❌ No current collection set</div>;
    }

    const collectionOffers = offers || [];

    const getTimeLeft = (deadline) => {
      const msLeft = new Date(deadline).getTime() - Date.now();
      if (msLeft <= 0) return 'Expired';
      const minutes = Math.floor(msLeft / 1000 / 60);
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    };

    const formatAddress = (addr) => {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
      <div id="offersContent">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>💰 Active Offers for Collection</h3>
          {userAccount && (
            <button className="btn btn-primary" onClick={() => alert('Browse NFTs to make individual offers!')}>
              💰 Make Offer
            </button>
          )}
        </div>

        {collectionOffers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666', background: '#f8f9fa', borderRadius: 8 }}>
            <h4>💰 No Active Offers</h4>
            <p>No offers found for this collection yet.</p>
            {userAccount && <p style={{ marginTop: 15 }}>Browse NFTs in the Marketplace tab to make offers!</p>}
          </div>
        ) : (
          <>
            <div
              style={{
                background: '#e8f5e8',
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                borderLeft: '4px solid #4caf50'
              }}
            >
              <h5 style={{ color: '#2e7d32', marginBottom: 8 }}>✅ FIXED Signature-Based Offers System</h5>
              <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
                These offers use the corrected EIP-712 signature order. Signatures should now be valid!
              </p>
            </div>

            <div className="offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {collectionOffers.map((offer) => {
                const isOwner = userAccount && offer.offerer.toLowerCase() === userAccount.toLowerCase();
                const canAccept = userAccount && !isOwner;
                const timeLeft = getTimeLeft(offer.deadline);

                return (
                  <div
                    key={offer.id}
                    className="offer-card"
                    style={{
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{offer.priceETH} ETH</div>
                        <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Token #{offer.tokenId}</div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#4caf50',
                          fontWeight: 'bold',
                          background: '#e8f5e8',
                          padding: '4px 8px',
                          borderRadius: 4
                        }}
                      >
                        FIXED ✅
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#666', marginBottom: 15, lineHeight: 1.4 }}>
                      <div>
                        <strong>From:</strong> {formatAddress(offer.offerer)}
                      </div>
                      <div>
                        <strong>Amount:</strong> {offer.amount}
                      </div>
                      <div>
                        <strong>Type:</strong> {offer.tokenType === 0 ? 'ERC721' : 'ERC1155'}
                      </div>
                      <div>
                        <strong>Expires:</strong> {timeLeft}
                      </div>
                      <div style={{ color: '#2e7d32' }}>
                        <strong>✅ Corrected signature</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {canAccept && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '8px 16px', fontSize: 14 }}
                          onClick={() => onAccept?.(offer.id)}
                        >
                          Accept Offer
                        </button>
                      )}
                      {isOwner && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 16px', fontSize: 14 }}
                          onClick={() => onCancel?.(offer.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  //offer-gg
  function updateOfferStatus(offerId, status) {
    try {
      const offers = getStoredOffers();
      const offerIndex = offers.findIndex(o => o.id === offerId);
      if (offerIndex !== -1) {
        offers[offerIndex].status = status;
        offers[offerIndex].updatedAt = Date.now();
        localStorage.setItem('marketplace_nft_offers_v1', JSON.stringify(offers));
        console.log('🔄 Offer status updated:', offerId, '->', status);
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
    }
  }

  //offer-gg
  function cancelOffer(offerId) {
    if (!userAccount) {
      showOffersMessage('Please connect your wallet', 'error');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    const confirmed = confirm('Are you sure you want to cancel this offer?');
    if (!confirmed) return;

    try {
      updateOfferStatus(offerId, 'cancelled');
      showOffersMessage('Offer cancelled successfully!', 'success');

      // if (typeof renderOffersForCollection === 'function') {
      //   renderOffersForCollection();
      // }
    } catch (error) {
      console.error('Error cancelling offer:', error);
      showOffersMessage('Error cancelling offer', 'error');
    }
  }

  function getERC721ABI() {
    return FALLBACK_ERC721_ABI;
  }

  function getERC1155ABI() {
    return FALLBACK_ERC1155_ABI;
  }

  //offer-gg
  async function acceptItemOffer(offerId) {
    console.log('🔄 Accepting item offer:', offerId);

    if (!userAccount) {
      showOffersMessage('Please connect your wallet first', 'error');
      return;
    }

    if (!contract) {
      showOffersMessage('Marketplace contract not initialized', 'error');
      return;
    }

    try {
      const offers = getStoredOffers();
      const offer = offers.find(o => o.id === offerId);

      if (!offer) {
        showOffersMessage('Offer not found', 'error');
        return;
      }

      if (offer.status !== 'active') {
        showOffersMessage('Offer is no longer active', 'error');
        return;
      }

      if (isOfferExpired(offer)) {
        showOffersMessage('Offer has expired', 'error');
        updateOfferStatus(offerId, 'expired');
        return;
      }

      if (offer.offerer.toLowerCase() === userAccount.toLowerCase()) {
        showOffersMessage('You cannot accept your own offer', 'error');
        return;
      }

      // Confirm acceptance
      // eslint-disable-next-line no-restricted-globals
      const confirmed = confirm(`Accept offer of ${offer.priceETH} ETH for token #${offer.tokenId}?`);
      if (!confirmed) return;

      console.log('🚀 Accepting offer through contract...');
      showOffersMessage('Processing offer acceptance...', 'info');

      // Check buyer's WETH status
      console.log('💰 Checking buyer WETH status...');
      const balanceCheck = await checkWETHBalance(offer.offerer, offer.price);

      if (!balanceCheck.hasBalance) {
        const errorMsg = `Buyer has insufficient WETH balance. Required: ${balanceCheck.requiredETH} WETH, Available: ${balanceCheck.balanceETH} WETH`;
        showOffersMessage(errorMsg, 'error');
        return;
      }

      const allowanceCheck = await checkWETHAllowance(offer.offerer, offer.price);

      if (!allowanceCheck.hasAllowance) {
        const errorMsg = `Buyer needs to approve WETH spending. Required: ${formatEther(offer.price)} WETH, Approved: ${allowanceCheck.allowanceETH} WETH`;
        showOffersMessage(errorMsg, 'error');
        return;
      }

      // Check NFT ownership and approval
      console.log('🖼️ Checking NFT ownership and approvals...');
      try {
        let nftContract;
        if (offer.tokenType === 0) {
          // ERC721
          // nftContract = new web3.eth.Contract(getERC721ABI(), offer.nftContract);

          // const provider = new BrowserProvider(window.ethereum);
          // const signer = await provider.getSigner();
          // nftContract = new Contract(offer.nftContract, getERC721ABI(), signer);

          nftContract = new Contract(offer.nftContract, getERC721ABI(), userSigner);

          const owner = await nftContract.methods.ownerOf(offer.tokenId).call();

          if (owner.toLowerCase() !== userAccount.toLowerCase()) {
            throw new Error(`You don't own this NFT. Owner: ${owner}`);
          }

          // Check approvals
          const approvedAddress = await nftContract.methods.getApproved(offer.tokenId).call();
          const isApprovedForAll = await nftContract.methods.isApprovedForAll(userAccount, MARKETPLACE_ADDRESS).call();

          if (approvedAddress.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase() && !isApprovedForAll) {
            // eslint-disable-next-line no-restricted-globals
            const shouldApprove = confirm('This NFT is not approved for the marketplace. Approve now?');

            if (shouldApprove) {
              showOffersMessage('Approving NFT for marketplace...', 'info');
              await nftContract.methods.setApprovalForAll(MARKETPLACE_ADDRESS, true).send({
                from: userAccount,
                gas: 100000
              });
              showOffersMessage('NFT approved!', 'success');
            } else {
              throw new Error('NFT approval is required to accept offers.');
            }
          }

        } else {
          // ERC1155
          // nftContract = new web3.eth.Contract(getERC1155ABI(), offer.nftContract);

          // const provider = new BrowserProvider(window.ethereum);
          // const signer = await provider.getSigner();
          // nftContract = new Contract(offer.nftContract, getERC721ABI(), signer);

          nftContract = new Contract(offer.nftContract, getERC721ABI(), userSigner);

          const balance = await nftContract.methods.balanceOf(userAccount, offer.tokenId).call();

          if (parseInt(balance) < offer.amount) {
            throw new Error(`Insufficient NFT balance. Need: ${offer.amount}, Have: ${balance}`);
          }

          const isApprovedForAll = await nftContract.methods.isApprovedForAll(userAccount, MARKETPLACE_ADDRESS).call();

          if (!isApprovedForAll) {
            // eslint-disable-next-line no-restricted-globals
            const shouldApprove = confirm('This NFT collection is not approved for the marketplace. Approve now?');

            if (shouldApprove) {
              showOffersMessage('Approving NFT collection for marketplace...', 'info');
              await nftContract.methods.setApprovalForAll(MARKETPLACE_ADDRESS, true).send({
                from: userAccount,
                gas: 100000
              });
              showOffersMessage('NFT collection approved!', 'success');
            } else {
              throw new Error('NFT collection approval is required to accept offers.');
            }
          }
        }

      } catch (nftError) {
        console.error('❌ NFT check failed:', nftError);
        showOffersMessage('NFT Error: ' + nftError.message, 'error');
        return;
      }

      // CRITICAL: Prepare contract offer structure matching ABI struct order
      // The contract's struct order is different from EIP-712 TYPEHASH order!
      // From ABI: nftContract, tokenId, offerer, price, amount, tokenType, deadline, nonce
      const contractOffer = {
        nftContract: offer.nftContract,
        tokenId: offer.tokenId,
        offerer: offer.offerer,      // Position 3 in struct
        price: offer.price,          // Position 4 in struct
        amount: offer.amount,        // Position 5 in struct
        tokenType: offer.tokenType,  // Position 6 in struct
        deadline: offer.deadline,    // Position 7 in struct
        nonce: offer.nonce           // Position 8 in struct
      };

      console.log('📋 Contract offer structure (ABI order):', contractOffer);
      console.log('🔐 Signature:', offer.signature);

      try {
        // Estimate gas
        console.log('⛽ Estimating gas for transaction...');

        let gasEstimate;
        if (walletType === 'tairun') {
          gasEstimate = await contract.estimateGas.acceptItemOffer(
            contractOffer,
            offer.signature
          );
        } else {
          gasEstimate = await contract.methods.acceptItemOffer(
            contractOffer,
            offer.signature
          ).estimateGas({ from: userAccount });
        }

        console.log('✅ Gas estimated successfully:', gasEstimate);

        const gasLimit = Math.floor(gasEstimate * 1.2);

        showOffersMessage('Transaction prepared. Please check your wallet...', 'info');

        // Execute transaction

        let result;
        if (walletType === 'tairun') {
          const tx = await contract.callStatic.acceptItemOffer(contractOffer, offer.signature, {
            gasLimit
          });
          result = await tx.wait();
        } else {
          result = await contract.methods.acceptItemOffer(
            contractOffer,
            offer.signature
          ).send({
            from: userAccount,
            gas: gasLimit
          });
        }

        console.log('🎉 Transaction successful!', result);

        // Update offer status
        updateOfferStatus(offerId, 'accepted');

        showOffersMessage(`✅ NFT sold successfully! Transaction: ${result.transactionHash}`, 'success');

        // Refresh UI
        // if (typeof renderOffersForCollection === 'function') {
        //   renderOffersForCollection();
        // }
        if (typeof loadCollectionMarketplace === 'function') {
          loadCollectionMarketplace();
        }

        return result;

      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);

        if (gasError.message.includes('revert')) {
          const errorMatch = gasError.message.match(/revert (.+?)"/);
          const revertReason = errorMatch ? errorMatch[1] : 'Unknown contract error';
          throw new Error(`Contract revert: ${revertReason}`);
        } else {
          throw gasError;
        }
      }

    } catch (error) {
      console.error('❌ Offer acceptance failed:', error);

      let errorMessage = 'Failed to accept offer';
      if (error.message.includes('User denied')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('revert')) {
        const revertReason = error.message.match(/revert (.+)"/);
        errorMessage = 'Contract error: ' + (revertReason ? revertReason[1] : 'Unknown error');
      } else if (error.message) {
        errorMessage = error.message;
      }

      showOffersMessage(errorMessage, 'error');
    }
  }

  function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  function getTimeLeft(deadline) {
    if (deadline === 0) return 'No expiry';

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;

    if (timeLeft <= 0) return 'Expired';

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  //============================

  const checkCollections = () => {
    const collections = JSON.parse(localStorage.getItem('marketplace_collections') || '{}');
    console.log('Collections in localStorage:', collections);
    console.log('Collections count:', Object.keys(collections).length);
    return collections;
  }

  // Force render collections manually
  // const forceRenderCollections = () => {
  //   const container = document.getElementById('collectionsContent');
  //   if (!container) {
  //     console.error('Container not found!');
  //     return;
  //   }
  //
  //   const collections = checkCollections();
  //
  //   if (Object.keys(collections).length === 0) {
  //     container.innerHTML = `
  //                   <div className="loading">
  //                       <h3>No collections found</h3>
  //                       <p>Add collections via admin panel or check localStorage.</p>
  //                       <button onClick={() => navigate('/admin')} style="margin-top: 10px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px;">
  //                           Go to Admin Panel
  //                       </button>
  //                   </div>
  //               `;
  //   } else {
  //     // Simple render without complex functions
  //     let html = '<div class="collections-grid">';
  //     Object.entries(collections).forEach(([address, collection]) => {
  //       html += `
  //                       <div class="collection-card" onclick="alert('Collection: ${collection.name} 123')">
  //                           <div class="collection-banner" style="background: linear-gradient(135deg, #667eea, #764ba2);"></div>
  //                           <div class="collection-avatar">
  //                           <img src={collection.avatar} width={150} alt={collection.name}/>
  //                           </div>
  //                           <div class="collection-info">
  //                               <div class="collection-name">${collection.name}</div>
  //                               <div class="collection-description">${collection.description}</div>
  //                           </div>
  //                       </div>
  //                   `;
  //     });
  //     html += '</div>';
  //     container.innerHTML = html;
  //   }
  // }

  return (
    <>
      <div className="tairun-container">
        {/* Tot conținutul HTML tău transformat în JSX */}
        {/* De exemplu, header-ul */}
        {/*<div className="header">*/}
        {/*  <div className="header-content">*/}
        {/*    <div className="logo" onClick={() => Utils.showHome()}>Taiko NFT Marketplace</div>*/}

        {/*    <div className="wallet-section">*/}
        {/*      <div id="networkInfo" style={{fontSize: 14, color: "#666"}}>Taiko Mainnet</div>*/}
        {/*      <div id="connectWallet" className="connect-wallet-container"></div>*/}

        {/*      <div id="walletInfo" className="wallet-info" style={{display: "none"}}>*/}
        {/*        <div className="wallet-address">*/}
        {/*          <strong>Address:</strong> <span id="walletAddress"></span>*/}
        {/*        </div>*/}
        {/*        <div className="wallet-balance">*/}
        {/*          <strong>Balance:</strong> <span id="walletBalance"></span>*/}
        {/*        </div>*/}
        {/*        <div className="connection-mode">*/}
        {/*          <span id="connectionMode"></span>*/}
        {/*        </div>*/}

        {/*        <div className="wallet-actions">*/}
        {/*          <div id="contractStatus" style={{fontSize: 12, color: "#999"}}></div>*/}
        {/*          <button className="btn btn-secondary" onClick={() => Utils.disconnectWallet()}>*/}
        {/*            Disconnect*/}
        {/*          </button>*/}
        {/*        </div>*/}
        {/*      </div>*/}

        {/*      <div className="cart-icon" onClick={() => Utils.toggleCart()}>*/}
        {/*        🛒*/}
        {/*        <div id="cartBadge" className="cart-badge" style={{display: "none"}}>0</div>*/}
        {/*        <div id="cartDropdown" className="cart-dropdown">*/}
        {/*          <div id="cartItems"></div>*/}
        {/*          <div style={{padding: 15, borderTop: "1px solid #eee", textAlign: "center"}}>*/}
        {/*            <div id="cartTotal" style={{fontWeight: "bold", marginBottom: 10}}>Total: 0 ETH</div>*/}
        {/*            <button className="btn btn-success" onClick={() => Utils.checkoutCart()}*/}
        {/*                    style={{width: "100%"}}>Checkout*/}
        {/*            </button>*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}

        {/*    </div>*/}


        {/*  </div>*/}
        {/*</div>*/}

        {/* Continuă cu restul HTML-ului transformat în JSX */}
        {/* Exemplu de tab-uri */}
        <div className="nav-tabs">
          <div className="nav-tab active" onClick={() => showTab('home')}>Collections</div>
          <div id="adminTab" className="nav-tab" style={{display: "none"}}
               onClick={() => navigate('/admin')}>Admin
          </div>
        </div>

        {/* Breadcrumb */}
        <div id="breadcrumb" className="breadcrumb" style={{display: "none"}}></div>

        {/* Exemplu de tab content */}
        <div id="home" className="tab-content active">
          <div className="content-section">
            <h2>🎨 NFT Collections</h2>
            <p style={{marginBottom: "20px", color: "#666"}}>
              Discover amazing NFT collections on Taiko network
            </p>
            <div id="collectionsContent">
              {/*<div className="loading">Loading collections...</div>*/}
              {Object.keys(nftCollections).length > 0 && <CollectionsGrid
                nftCollections={nftCollections}
                isAdmin={isAdmin}
                showCollection={showCollection}
              />}
            </div>
          </div>
        </div>

        {/* Collection Detail Page */}
        <div id="collection" className="tab-content">
          <button className="back-button" onClick={() => showHome()}>← Back to Collections</button>
          <div className="content-section">
            <div id="collectionHeader">
              <HeaderCollection collection={collectionData} address={collectionAddress} />
            </div>

            {/* Collection Navigation */}
            <div className="collection-nav">
              <button className="collection-nav-tab active" onClick={() => showCollectionTab('marketplace')}>🛒 Marketplace
              </button>
              <button className="collection-nav-tab" onClick={() => showCollectionTab('mynfts')}>My NFTs</button>
              <button className="collection-nav-tab" onClick={() => showCollectionTab('offers')}>Offers</button>
              <button className="collection-nav-tab" onClick={() => showCollectionTab('activity')}>Activity</button>
            </div>

            {/* Collection Marketplace Tab */}
            <div id="collection-marketplace" className="collection-tab-content active">
              {/* Filters */}
              <div className="filters">
                <div className="filter-group">
                  <label>Sort by:</label>
                  <select id="collectionSortBy" className="filter-input" onClick={() => filterCollectionNFTs()}>
                    <option value="newest">Newest Listed</option>
                    <option value="oldest">Oldest Listed</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status:</label>
                  <select id="collectionStatus" className="filter-input" onClick={() => filterCollectionNFTs()}>
                    <option value="listed">For Sale Only</option>
                    <option value="all">All NFTs</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Price Range (ETH):</label>
                  <input type="number" id="collectionMinPrice" className="filter-input" placeholder="Min" step="0.001"
                         onClick={() => filterCollectionNFTs()}/>
                </div>
                <div className="filter-group">
                  <label>&nbsp;</label>
                  <input type="number" id="collectionMaxPrice" className="filter-input" placeholder="Max" step="0.001"
                         onClick={() => filterCollectionNFTs()}/>
                </div>
                <div className="filter-group">
                  <label>&nbsp;</label>
                  <button className="btn btn-secondary" onClick={() => clearCollectionFilters()}>Clear Filters</button>
                </div>
              </div>
              <div id="collectionNFTs">
                {/*<div className="loading">Loading collection NFTs...</div>*/}

                <div className="nft-grid">
                  {collectionListing.length === 0 ? (
                    <div className="loading">No NFTs listed for sale in this collection</div>
                  ) : (
                    collectionListing.map((listing, i) => (
                      <NFTCard
                        listing={listing}
                        userAccount={userAccount}
                        onBuy={buyNFTListing}
                        onAddToCart={addToCartFromCard}
                        onOffer={openOfferModalForNFT}
                        onChangePrice={openChangePriceModal}
                        onCancel={cancelNFTListing}
                        index={i}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Collection My NFTs Tab */}
            <div id="collection-mynfts" className="collection-tab-content">
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
                <h3>My NFTs from this Collection</h3>
                <div style={{display: "flex", gap: 10}}>
                  <button className="btn btn-secondary" onClick={() => refreshCollectionNFTs()}>Refresh</button>
                  <button id="listSelectedCollectionBtn" className="btn btn-success" onClick={() => openListingModal()}
                          style={{display: "none"}}>
                    List Selected (<span id="selectedCollectionCount">0</span>)
                  </button>
                </div>
              </div>
              <div id="collectionMyNFTs">
                {/*<div className="loading">Loading your NFTs from this collection...</div>*/}
                <div className="nft-grid">
                  {collectionMyNFTs.length === 0 ? (
                    <div className="loading">You don't own any NFTs from this collection</div>
                  ) : (
                    collectionMyNFTs.map((nft, i) => (
                      <MyNFTCard
                        key={`${nft.contract}-${nft.tokenId}`}
                        nft={nft}
                        isSelected={selectedNFTs.some(n => n.contract === nft.contract && n.tokenId === nft.tokenId)}
                        onSelect={toggleNFTSelection}
                        onChangePrice={openChangePriceModal}
                        onCancel={cancelNFTListing}
                        index={i}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Collection Offers Tab */}
            <div id="collection-offers" className="collection-tab-content">
              <div className="offers-section">
                {/*<div id="offersContent">*/}
                {/*  <div className="loading">Loading offers...</div>*/}
                {/*</div>*/}

                {/*{collectionOffers?.length > 0 &&*/}

                    <OffersForCollection
                      currentCollection={collectionAddress}
                      userAccount={userAccount}
                      offers={() => getOffersForCollection(collectionAddress)}
                      onAccept={(id) => acceptItemOffer(id)}
                      onCancel={(id) => cancelOffer(id)}
                    />
                  {/*}*/}
              </div>
            </div>

            {/* Collection Activity Tab */}
            <div id="collection-activity" className="collection-tab-content">
              <h3>Collection Activity</h3>
              <p style={{marginBottom: 20, color: "#666"}}>Recent listings, sales, and activity for this collection</p>

              <div id="collectionActivity">
                <div className="loading">Loading collection activity...</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* List NFTs Modal */}
      <ListingModal />
      <div id="listModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => closeListModal()}>&times;</span>
          <h3>Individual NFT Listing</h3>
          <div id="listMessage"></div>

          <div
            style={{background: "linear-gradient(135deg, #e3f2fd, #f3e5f5)", padding: 20, borderRdius: 12, marginBottom: 20}}>
            <h4 style={{color: "#667eea", marginBottom: 15}}>Individual Signature System</h4>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15}}>
              <div style={{background: "white", padding: "15", borderRadius: 8, borderLeft: "4px solid #ffc107"}}>
                <h5 style={{color: "#856404", marginBottom: 8}}>Auto-Approve</h5>
                <p style={{fontSize: 14, color: "#666", margin: 0}}>If needed, approve collection first<br/><strong>Costs: Gas fee</strong></p>
              </div>
              <div style={{background: "white", padding: 15, borderRadius: 8, borderLeft: "4px solid #28a745"}}>
                <h5 style={{color: "#155724", marginBottom: 8}}>Individual Signatures</h5>
                <p style={{fontSize: 14, color: "#666", margin: 0}}>Each NFT gets its own signature<br/><strong>Costs:
                  FREE!</strong></p>
              </div>
            </div>
          </div>

          <div style={{background: "#f8f9fa", padding: 20, borderRadius: 8}}>
            <h4>Selected NFTs (<span id="modalSelectedCount">0</span>)</h4>
            <div id="selectedNFTsList" style={{maxHeight: 300, overflowY: "auto", marginBottom: 20}}>

              {selectedNFTs && selectedNFTs.map((nft, i) => {
                return (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', margin: '8px 0', borderRadius: 6, border: '1px solid #eee'}} key={i}>
                    <div>
                      <strong>${nft.name}</strong><br/>
                      <small style={{color: '#666'}}>${nft.collection} - ID: ${nft.tokenId}</small>
                    </div>
                    <button className="btn btn-danger btn-small" onClick={() => removeNFTFromSelection(nft.contract, nft.tokenId)}>Remove</button>
                  </div>)
              })}

            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25}}>
              <div className="form-group">
                <label>Pricing Strategy:</label>
                <select id="pricingStrategy" className="form-input" onClick={() => togglePricingMode()}>
                  <option value="uniform">Same price for all NFTs</option>
                  <option value="individual">Individual price for each NFT</option>
                </select>
              </div>

              <div className="form-group">
                <label>Listing Duration:</label>
                <select id="listingDuration" className="form-input">
                  <option value="86400">1 Day</option>
                  <option value="604800">7 Days</option>
                  <option value="2592000">30 Days</option>
                  <option value="7776000">90 Days</option>
                  <option value="0">Forever</option>
                </select>
              </div>
            </div>

            <div id="uniformPricing" style={{marginBottom: 25}}>
              <div className="form-group">
                <label>Listing Price (ETH per NFT):</label>
                <input type="number" id="listingPrice" className="form-input" placeholder="0.001" step="0.001"
                       min="0.001"/>
              </div>
            </div>

            <div id="individualPricing" style={{display: "none", marginBottom: 25}}>
              <h4 style={{marginBottom: 15, color: "#667eea"}}>Set Individual Prices</h4>
              <div id="individualPricesList"
                   style={{maxHeight: 300, overflowY: "auto", background: "#f8f9fa", padding: 15, borderRadius: 8}}></div>
            </div>

            <div style={{textAlign: "center", marginBottom: 20}}>
              <button className="btn btn-success" onClick={() => listSelectedNFTs()}
                      style={{fontSize: 18, padding: "18px 40px"}}>
                <span id="listingButtonText">List All NFTs Individually</span>
              </button>
              <button className="btn" onClick={() => closeListModal()} style={{marginLeft: 15, padding: "18px 25px"}}>Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Make Offer Modal */}
      <div id="makeOfferModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => closeMakeOfferModal()}>&times;</span>
          <h3>Make NFT Offer (WETH)</h3>
          <div id="offerMessage"></div>

          <div
            style={{background: "#e7f3ff", padding: 15, borderRadius: 8, marginBottom: 20, borderLeft: "4px solid #007bff"}}>
            <h5 style={{color: "#004085", marginBottom: 8}}>How WETH Offers Work:</h5>
            <ul style={{color: "#666", fontSize: 14, margin: 0, paddingLeft: 20, lineHeight: 1.6}}>
              <li><strong>EIP-712 Signatures:</strong> Offers are created using cryptographic signatures</li>
              <li>WETH is only transferred when seller accepts your offer</li>
              <li>You can cancel your offer anytime (gas required)</li>
              <li>If accepted, NFT transfers to you and WETH goes to seller automatically</li>
              <li><strong>Real transactions:</strong> All actions interact with blockchain</li>
            </ul>
          </div>

          <div className="form-group">
            <label>NFT Contract:</label>
            <input type="text" id="offerContract" className="form-input" style={{background: "#f8f9fa", color: "#666"}}/>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15}}>
            <div className="form-group">
              <label>Token ID:</label>
              <input type="number" id="offerTokenId" className="form-input"
                     style={{background: "#f8f9fa", color: "#666"}}/>
            </div>
            <div className="form-group">
              <label>Token Type:</label>
              <select id="offerTokenType" className="form-input" disabled style={{background: "#f8f9fa", color: "#666"}}>
                <option value="0">ERC721</option>
                <option value="1">ERC1155</option>
              </select>
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: 15}}>
            <div className="form-group">
              <label>Your Offer Price (WETH): *</label>
              <input type="number" id="offerPrice" className="form-input" placeholder="0.1" step="0.001" min="0.001"
                     style={{border: "2px solid #667eea"}}/>
            </div>
            <div className="form-group">
              <label>Amount (ERC1155):</label>
              <input type="number" id="offerAmount" className="form-input" defaultValue="1" min="1"
                     style={{background: "#f8f9fa"}}/>
            </div>
          </div>
          <div className="form-group">
            <label>Offer Duration:</label>
            <select id="offerDuration" className="form-input">
              <option value="86400">1 Day</option>
              <option value="604800" selected>7 Days</option>
              <option value="2592000">30 Days</option>
              <option value="0">Forever (1 year)</option>
            </select>
          </div>

          <div
            style={{background: "#fff3cd", padding: 12, borderRadius: 6, borderLeft: "3px solid #ffc107", marginBottom: 20}}>
            <small><strong>Note:</strong> Make sure you have enough WETH. Your WETH will only be transferred if the
              offer is accepted.</small>
          </div>

          <div style={{textAlign: "center", marginTop: 20}}>
            <button className="btn btn-success" onClick={() => submitOffer()} style={{fontSize: 16, padding: "15px 30px"}}>
              Submit
              Offer
            </button>
            <button className="btn" onClick={() => closeMakeOfferModal()}
                    style={{marginLeft: 15, padding: "15px 20px"}}>Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Collection Offer Modal */}
      <div id="collectionOfferModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => closeCollectionOfferModal()}>&times;</span>
          <h3>Make Collection Offer (WETH)</h3>
          <div id="collectionOfferMessage"></div>

          <div
            style={{background: "#e7f3ff", padding: 15, borderRadius: 8, marginBottom: 20, borderLeft: "4px solid #007bff"}}>
            <h5 style={{color: "#004085", marginBottom: 8}}>💡 How Collection Offers Work:</h5>
            <ul style={{color: "#666", fontSize: 14, margin: 0, paddingLeft: 20, lineHeight: 1.6}}>
              <li><strong>EIP-712 Signatures:</strong> Collection offers are created using cryptographic signatures</li>
              <li>Any NFT holder in this collection can accept your offer</li>
              <li>WETH is only transferred when someone accepts your offer</li>
              <li>You can cancel your offer anytime (gas required)</li>
              <li>Multiple NFTs can be sold against one collection offer</li>
              <li><strong>Real transactions:</strong> All actions interact with blockchain</li>
            </ul>
          </div>

          <div className="form-group">
            <label>Collection Contract:</label>
            <input type="text" id="collectionOfferContract" className="form-input"
                   style={{background: "#f8f9fa", color: "#666"}}/>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15}}>
            <div className="form-group">
              <label>Price per NFT (WETH): *</label>
              <input type="number" id="collectionOfferPrice" className="form-input" placeholder="0.1" step="0.001"
                     min="0.001"
                     style={{border: "2px solid #667eea"}}/>
            </div>
            <div className="form-group">
              <label>Quantity (NFTs): *</label>
              <input type="number" id="collectionOfferQuantity" className="form-input" placeholder="1" min="1" max="100"
                     defaultValue="1" style={{border: "2px solid #667eea"}}/>
            </div>
          </div>

          <div className="form-group">
            <label>Offer Duration:</label>
            <select id="collectionOfferDuration" className="form-input">
              <option defaultValue="86400">1 Day</option>
              <option defaultValue="604800">7 Days</option>
              <option defaultValue="2592000" selected>30 Days</option>
              <option defaultValue="7776000">90 Days</option>
              <option defaultValue="0">Forever (1 year)</option>
            </select>
          </div>

          <div style={{background: "#f8f9fa", padding: 15, borderRadius: 8, marginBottom: 20}}>
            <h5 style={{marginBottom: 10}}>Total WETH Required:</h5>
            <div id="collectionOfferTotal" style={{fontSize: 18, fontWeight: "bold", color: "#667eea"}}>0.0000 WETH</div>
          </div>

          <div
            style={{background: "#fff3cd", padding: 12, borderRadius: 6, borderLeft: "3px solid #ffc107", marginBottom: 20}}>
            <small><strong>Note:</strong> Make sure you have enough WETH. Your WETH will only be transferred when NFT
              holders accept your offer.</small>
          </div>

          <div style={{textAlign: "center", marginTop: 20}}>
            <button className="btn btn-success" onClick={() => submitCollectionOffer()}
                    style={{fontSize: 16, padding: "15px 30px"}}>Submit Collection Offer
            </button>
            <button className="btn" onClick={() => closeCollectionOfferModal()}
                    style={{marginLeft: 15, padding: "15px 20px"}}>Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Change Price Modal */}
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

export default NftMarketPlace;
