import React, {useEffect, useState} from "react";

import Button from "../Button";
import {useLocation} from "react-router-dom";
import BackToTop from "../BackToTop";
import MyCollectionNft from "../MyCollectionNft";
import {useMainContext} from "../../context/Context";
import {useMarketplaceActions} from "../../hooks/useMarketplaceActions";
import Toast from "../Toast";
import {getCollection, getListingNft, weiToUSD} from "../../services/apiService";
import NFTCard from "./NFTCard";
import {formatEther} from "ethers";
import {getNFTTransactionsUrl} from "../../services/services";

const SORT_OPTIONS = [
  {value: 'price-asc', label: 'Price Asc'},
  {value: 'price-desc', label: 'Price Desc'},
  {value: 'recent-listed', label: 'Recent Listed'},
  // {value: 'recent-offers', label: 'Recent Offers'},
  // {value: 'recent-sold', label: 'Recent Sold'},
  {value: 'recent-created', label: 'Recent Created'},
];

const Collection = () => {

  const {state} = useLocation();
  const collection = state.collection

  const {userAccount, ethPriceUSD, chainId, setCurrentCollectionAddress} = useMainContext();
  const [toast, setToast] = useState(null);

  const {
    buyItem,
    makeOffer,
    cancelListing,
    acceptOffer,
    cancelOffer,
    loadingAction,
    makeCollectionOffer,
    cancelCollectionOffer
  } = useMarketplaceActions(setToast);


  const [activeTab, setActiveTab] = useState('marketplace');
  const [sortBy, setSortBy] = useState('recent-listed');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [myNfts, setMyNfts] = useState([]);
  const [loadedItems, setLoadedItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [nfts, setNfts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNFTs = async (reset = true, page = 1) => {
    setLoading(true);
    try {
      const res = await getListingNft({
        contract: collection.address,
        min_price: priceMin,
        max_price: priceMax,
        sort_by: sortBy,
        per_page: 50,
        page: page,
      });

      const items = res.data || [];

      setNfts(reset ? items : (prevNfts) => [...prevNfts, ...items]);
      setTotalItems(res?.pagination?.total);
      setHasMore((prev) => res?.pagination?.total > (reset ? items.length : loadedItems + items.length));
      setLoadedItems(reset ? items.length : (prev) => prev + items.length);

    } catch (err) {
      console.error('Error fetching NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab('marketplace')
  }, [userAccount]);

  const clearFilters = () => {
    setSortBy('makeOrderUsd');
    setPriceMin('');
    setPriceMax('');
  }

  const handleRefresh = async () => {
    await clearFilters();
  }

  useEffect(() => {
    setCurrentCollectionAddress(collection.address);
    fetchNFTs();
  }, [collection.address, sortBy, priceMax, priceMin]);

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchNFTs(false, nextPage);
  };

  // function getSignatureListingsForCollection(nftContract) {
  //   const listings = JSON.parse(localStorage.getItem('signature_listings') || '[]');
  //   const filteredListings = listings.filter(listing =>
  //     listing.listing.nftContract?.toLowerCase() === nftContract?.toLowerCase() &&
  //     listing.listing.deadline > Math.floor(Date.now() / 1000) &&
  //     listing.listing.seller.toLowerCase() === userAccount?.toLowerCase()
  //   );
  //
  //   console.log(`📋 Found ${filteredListings.length} signature listings for collection ${nftContract}`);
  //   return filteredListings;
  // }

  const loadCollectionMyNFTs = async () => {
    if (!userAccount) {
      setMyNfts([]);
      return false;
    }

    try {
      const userNFTs = await getUserNFTsFromCollection(collection.address);

      const nftsInit = userNFTs?.data.map(nft => {
        if (nft.listings.length > 0) {
          return {
            ...nft,
            contract: nft.listings[0].address,
            isListed: true,
            listingPrice: nft.listings[0].price,
            listingPriceETH: null,
            listingType: 'signature',
            listingHash: nft.listings[0].hash,
            itemId: `sig_${nft.listings[0].hash}`
          };
        }

        return {
          ...nft,
          contract: nft?.address,
          isListed: false,
          listingPrice: null,
          listingPriceETH: null,
          listingType: null,
          listingHash: null,
          itemId: null
        };

      });

      nftsInit.sort((a, b) => {
        if (a.isListed && !b.isListed) return -1;
        if (!a.isListed && b.isListed) return 1;
        return 0;
      });

      console.log('✅ Processed', nftsInit.length, 'NFTs with listing status');
      setMyNfts(nftsInit);
    } catch (error) {
      console.error('Error loading collection my NFTs:', error);
    }
  }

  const getUserNFTsFromCollection = async (collectionAddress) => {
    try {
      const {collection} = await getCollection(collectionAddress);

      const url = getNFTTransactionsUrl({
        chainId: chainId,
        collectionAddress: collectionAddress,
        userAddress: userAccount,
        tokenType: parseInt(collection.token_type)
      })

      const res = await fetch(`http://127.0.0.1:3000/api/marketplace/nft/metadata?taikoscanUrl=${encodeURIComponent(url)}&chainId=${chainId}&collectionAddress=${collectionAddress}&userAccount=${userAccount}&tokenType=${collection.token_type}`);
      const metadata = await res.json();

      return metadata?.list ?? [];
    } catch (error) {
      console.error('Error getting my NFTs:', error.message);
      return [];
    }
  }

  if (!collection) {
    return <div>Collection not found</div>;
  }

  return (
    <div className="collection-page">
      <div className="container">
        <div className="collection-header">
          <img src={collection.image || 'https://dummyimage.com/300x300/cccccc/ffffff&text=No+Image'}
               alt={collection.name}/>
          <div className="collection-details">
            <h1>{collection.name}</h1>
            <div className="collection-stats">
              <span>{collection.totalItems} items</span>
              <span>Floor ETH: {collection?.floorPrice ? formatEther(collection.floorPrice) : 0}</span>
              <span>Floor USD: {collection?.floorPrice ? weiToUSD(collection?.floorPrice?.toString(), ethPriceUSD) : 0} </span>
            </div>
          </div>
        </div>

        <div className="collection-tabs">
          <button
            className={activeTab === 'marketplace' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace
          </button>
          <button
            className={activeTab === 'mynfts' ? 'tab active' : 'tab'}
            onClick={() => {
              setActiveTab('mynfts');
              loadCollectionMyNFTs();
            }}
          >
            My NFTs
          </button>
          <button
            className={activeTab === 'offers' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('offers')}
          >
            Offers
          </button>
          <button
            className={activeTab === 'activity' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        {activeTab === 'marketplace' && (
          <div className="marketplace-content">
            <div className="filters">
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Sort By</label>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-reset">
                <Button onClick={clearFilters}>
                  Clear
                </Button>
                <Button variant="secondary" onClick={handleRefresh}>
                  Reset
                </Button>
              </div>

            </div>

            <div className="nfts-grid">
              {/* eslint-disable-next-line array-callback-return */}
              {nfts?.map((nft, i) => {
                  // if (nft.listing.seller.toLowerCase() !== userAccount?.toLowerCase()) {
                    return (
                      <div key={i}>
                        <NFTCard
                          nft={nft.listings[0] ?? nft}
                          buyNFT={buyItem}
                          makeOffer={makeOffer}
                          cancelListing={cancelListing}
                          acceptOffer={acceptOffer}
                          cancelOffer={cancelOffer}
                          loadingAction={loadingAction}
                        />
                      </div>
                    )
                  // }
                }
              )}
            </div>

            <div className="nfts-view-more-section">
              <div className="nfts-page-items">{loadedItems} nfts from {totalItems} were loaded</div>

              {totalItems > loadedItems && <>
                <div>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="secondary"
                  >
                    {loading
                      ? (
                        <>
                          <div className="btn-spinner"></div>
                          Loading...
                        </>
                      )
                      : `Load next ${20} NFTs`
                    }
                  </Button>
                </div>
              </>}
            </div>

          </div>
        )}

        {activeTab === 'offers' && (
          <div className="offers-content">
            <Button
              disabled={loading}
              onClick={() => makeCollectionOffer(collection.address, 0.01, 0, 1)}
            >
              Make Collection Offer
            </Button>

            <Button
              onClick={() => cancelCollectionOffer(collection.address)}
              disabled={loading}
            >
              Withdraw Collection Offer
            </Button>
            <div className="offers-list">
              <p>No offers yet</p>
            </div>
          </div>
        )}

        {activeTab === 'mynfts' && (
          <div className="mynfts-content">
            {!userAccount && <p>Your NFTs from this collection will appear here, connect your wallet first!</p>}
            {userAccount && <MyCollectionNft nfts={myNfts} loadMyCollections={() => loadCollectionMyNFTs()}/>}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-content">
            <p>Collection activity will appear here</p>
          </div>
        )}
      </div>
      <BackToTop/>

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
export default Collection;
