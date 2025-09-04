import React, {useEffect, useState} from "react";
import NFTCard from "./NFTCard";
import Button from "./Button";
import {useLocation, useParams} from "react-router-dom";
import {getMyNftData, getNftCollection, getCollection} from "../services/apiService";
import BackToTop from "./BackToTop";
import MyCollectionNft from "./MyCollectionNft";
import {useMainContext} from "../context/Context";
import {TAIKOSCAN_API_KEY} from "../lib/config";
import Toast from "./Toast";
import {getNFTTransactionsUrl} from "../services/services";

const SORT_OPTIONS = [
  {value: 'makeOrderUsd', label: 'Preț Crescător'},
  {value: 'makeOrderUsdDesc', label: 'Preț Descrescător'},
  {value: 'favCountDesc', label: 'Favorite'},
  {value: 'makeOrderTimeDesc', label: 'Recent Listate'},
  {value: 'makeOfferTimeDesc', label: 'Oferte Recente'},
  {value: 'takeOrderTimeDesc', label: 'Vândute Recente'},
  {value: 'createTimeDesc', label: 'Create Recente'},
];

const Collection = () => {

  const {state} = useLocation();
  const { id } = useParams();

  const {userAccount, currentCollectionAddress, setCurrentCollectionAddress, chainId} = useMainContext();

  const [toast, setToast] = useState(null);

  // const {
  //   makeCollectionOffer
  // } = useMarketplaceActions(contract, userSigner, setToast);

  const [activeTab, setActiveTab] = useState('marketplace');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectId, setProjectId] = useState(id);
  const [sortBy, setSortBy] = useState('makeOrderUsd');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [nfts, setNfts] = useState([]);
  const [myNfts, setMyNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedItems, setLoadedItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(null);

  const perPage = 50;
  const collection = state.collection

  const fetchNFTs = async (reset = true) => {
    setLoading(true);
    try {
      const data = await getNftCollection({
        sortBy,
        priceRangeMin: priceMin,
        priceRangeMax: priceMax,
        pageNum: currentPage,
        pageSize: perPage,
        projectIn: [projectId],
      });

      const items = data.data?.list || [];

      if(items.length > 0 && !currentCollectionAddress) {
        setCurrentCollectionAddress(items[0].contractAddress);
      }

      setNfts(reset ? items : (prevNfts) => [...prevNfts, ...items]);
      setTotalItems(data.data?.total);
      setHasMore((prev) => data.data?.total > (reset ? items.length : loadedItems + items.length));
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
    if(parseInt(id) !== parseInt(projectId)){
      setProjectId(id);
    }

    setSortBy('makeOrderUsd');
    setPriceMin('');
    setPriceMax('');
  }

  const handleRefresh = async () => {
    await clearFilters();
  }

  useEffect(() => {
    fetchNFTs();
    console.log(333, collection, userAccount)
  }, [projectId, sortBy, statusFilter, priceMax, priceMin]);

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchNFTs(false);
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

  // const loadCollectionMyNFTs= async () => {
  //   console.log('00000000000')
  //
  //   if(!userAccount) {
  //     setMyNfts([]);
  //     return false;
  //   }
  //
  //   try {
  //     console.log('🔍 Loading NFTs for user:', userAccount, 'collection:', currentCollectionAddress);
  //
  //     // Load NFTs from TaikoScan for this specific collection
  //     const userNFTs = await getUserNFTsFromCollection(currentCollectionAddress);
  //
  //     console.log('📦 Found', userNFTs.length, 'NFTs for user');
  //
  //     // Check which ones are listed (both signature and traditional)
  //     const signatureListings = getSignatureListingsForCollection(currentCollectionAddress);
  //
  //     // Mark NFTs as listed and add listing info
  //     const nftsWithStatus = userNFTs.map(nft => {
  //       // Check signature listings
  //       const sigListing = signatureListings.find(listing =>
  //         listing.listing.tokenId === nft.tokenId
  //       );
  //
  //       if (sigListing) {
  //         return {
  //           ...nft,
  //           isListed: true,
  //           listingPrice: sigListing.listing.price,
  //           listingPriceETH: sigListing.priceETH,
  //           listingType: 'signature',
  //           listingHash: sigListing.hash,
  //           itemId: `sig_${sigListing.hash}`
  //         };
  //       }
  //
  //       return nft;
  //     });
  //
  //     // Sort to show listed items first
  //     nftsWithStatus.sort((a, b) => {
  //       if (a.isListed && !b.isListed) return -1;
  //       if (!a.isListed && b.isListed) return 1;
  //       return 0;
  //     });
  //
  //     console.log('✅ Processed', nftsWithStatus.length, 'NFTs with listing status');
  //
  //     setMyNfts(nftsWithStatus);
  //
  //   } catch (error) {
  //     console.error('Error loading collection my NFTs:', error);
  //   }
  // }

  const loadCollectionMyNFTs = async () => {
    if (!userAccount) {
      setMyNfts([]);
      return false;
    }

    try {
      const userNFTs = await getUserNFTsFromCollection(currentCollectionAddress);

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
    console.log('Tranzactions', transactions);

    for (const tx of transactions) {
      // console.log('tx',tx, tx.to, userAccount)
      const key = `${tx.contractAddress}_${tx.tokenID || ''}`;
      const direction = tx.to?.toLowerCase() === userAccount?.toLowerCase() ? 1 : -1;
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

  // async function getUserNFTsFromCollection(collectionAddress) {
  //   try {
  //     console.log('🔍 Fetching NFTs from TaikoScan for:', collectionAddress, 'user:', userAccount);
  //
  //     // Fetch NFTs for this specific collection
  //     const erc721URL = `https://api.taikoscan.io/api?module=account&action=tokennfttx&contractaddress=${collectionAddress}&address=${userAccount}&page=1&offset=1000&sort=asc&apikey=${TAIKOSCAN_API_KEY}`;
  {/*    const erc1155URL = `https://api.taikoscan.io/api?module=account&action=token1155tx&contractaddress=${collectionAddress}&address=${userAccount}&page=1&offset=1000&sort=asc&apikey=${TAIKOSCAN_API_KEY}`;*/}

  {/*    const [erc721Raw, erc1155Raw] = await Promise.all([*/}
  {/*      fetchTaikoScanData(erc721URL),*/}
  {/*      fetchTaikoScanData(erc1155URL),*/}
  {/*    ]);*/}

  //     const type = erc721Raw.length === 0 ? '1' : '0';
  //
  //     console.log('📦 TaikoScan data:', {
  //       erc721: erc721Raw.length,
  //       erc1155: erc1155Raw.length
  //     });
  //
  //     const nftData = await getMyNftData({collectionAddress, userAccount, tokenType: type, chainId: chainId.toString()});
  //
  //     // Calculate holdings
  //     const allTokens = calculateNFTHoldings(erc721Raw.concat(erc1155Raw));
  //
  //     console.log('📊 Calculated holdings:', allTokens.length);
  //
  //     // Add metadata and listing status
  //     const nftsWithData = allTokens.map((token) => {
  //       const tokenType = erc1155Raw.find(e => e.tokenID === token.tokenID) ? 1 : 0;
  //
  //       return {
  //         contract: token.contractAddress,
  //         tokenId: parseInt(token.tokenID),
  //         name: `Token #${token.tokenID}`,
  //         collection: collection?.name || 'Unknown Collection',
  //         tokenType: tokenType,
  //         owner: userAccount,
  //         amount: token.balance,
  //         image: nftData[token.tokenID]??'',
  //         isListed: false,
  //         listingPrice: null,
  //         itemId: null
  //       };
  //     });
  //
  //     console.log('✅ Final NFTs with data:', nftsWithData.length);
  //     return nftsWithData;
  //
  //   } catch (error) {
  //     console.error('Error getting collection NFTs:', error);
  //     return [];
  //   }
  // }

  const handleMakeCollectionOffer = () => {
    console.log('Make Collection Offer');
  };

  if (!collection) {
    return <div>Collection not found</div>;
  }

  return (
    <div className="collection-page">
      <div className="container">
        <div className="collection-header">
          <img src={collection.image || 'https://dummyimage.com/300x300/cccccc/ffffff&text=No+Image'} alt={collection.name} />
          <div className="collection-details">
            <h1>{collection.name}</h1>
            <div className="collection-stats">
              <span>{collection.totalItems} items</span>
              <span>Floor ETH: {collection.floorPrice}</span>
              <span>Floor USD: {collection.priceUsd} ETH</span>
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

              <div className="filter-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All NFTs</option>
                  <option value="listed">Listed NFTs</option>
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
              {nfts.map((nft, i) => (
                <div key={i}>
                  <NFTCard nft={nft}/>
                </div>
              ))}
            </div>

            <div className="nfts-view-more-section">
              <div className="nfts-page-items">{loadedItems} nfts from {totalItems} were loaded</div>

              {totalItems > loadedItems && <>
                <div >
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
                      : `Load next ${perPage} NFTs`
                    }
                  </Button>
                </div>
              </>}
            </div>

          </div>
        )}

        {activeTab === 'offers' && (
          <div className="offers-content">
            <Button onClick={handleMakeCollectionOffer}>Make Collection Offer</Button>
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
            {/*<Button*/}
            {/*  disabled={loading}*/}
            {/*  onClick={() => makeCollectionOffer(currentCollectionAddress, 0.01, 0, 1)}*/}
            {/*>*/}
            {/*  Offer 0.01 ETH for any NFT in Collection*/}
            {/*</Button>*/}
          </div>
        )}
      </div>
      <BackToTop />

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
