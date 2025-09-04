import React, {useEffect, useState} from "react";
import Button from "./Button";
import {useLocation, useParams} from "react-router-dom";
import {fetchNftDetails} from "../services/apiService";
import moment from "moment";
// import {useMainContext} from "../context/Context";
import {useCart} from "../context/CartContext";
import PurchaseNft from "./PurchaseNft";

const NFTDetail = () => {
  // const { tokenId } = useParams();

  // const { chainId } = useMainContext();
  const {state} = useLocation();
  const nft = state.nft

  // const { addToCart } = useCart();

  // const [details, setDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  // const [purchasing, setPurchasing] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    console.log(345465,nft)
    // const fetchOrderDetails = async () => {
    //   try {
    //     const {data} = await fetchNftDetails(tokenId, nft.contractAddress, chainId);
    //     setOrders(data)
    //   } catch (error) {
    //     console.error('Error in FIXED NFT purchase:', error);
    //   }
    // }

    const fetchOrders = async () => {
      try {
        const {data} = await fetchNftDetails(nft.id, null, true);
        setOrders(data)
      } catch (error) {
        console.error('Error in FIXED NFT purchase:', error);
      }
    }

    // fetchOrderDetails();
    fetchOrders();
  }, []);


  // const handlePurchaseNFT = async (nft) => {
    // console.log(93749574574, wallet)
    // if (!wallet?.userAccount) {
    //   setToast({ message: "No address found", type: 'error' });
    //   return;
    // }
    //
    // setPurchaseModal({
    //   isOpen: true,
    //   nft,
    //   steps: []
    // });
    //
    // try {
    //   const {data} = await fetchNftDetails(nft.id, nft?.sale.price??null);
    //   if(!data.id) {
    //     setToast({ message: `No any orders found for NFT #${nft.tokenId}`, type: 'error' });
    //     return;
    //   }
    //
    //   const nftToBuy = await buyNft(chainId, wallet?.userAccount, data.id, nft.id);
    //   const item = nftToBuy.steps[0].items[0];
    //
    //   setPurchaseData({
    //     to: item.contractAddress,
    //     input: item.input,
    //     amount: item.value
    //   });
    //
    // } catch (error) {
    //   console.error('Error in FIXED NFT purchase:', error);
    //
    //   if (error.code === 4001) {
    //     setToast({ message: "Transaction was canceled by user", type: 'error' });
    //   } else if (error.code === -32603 || error.message.includes('insufficient funds')) {
    //     setToast({ message: "Not enough founds! Supply your balance and try again", type: 'error' });
    //   } else {
    //     setToast({ message: `Error: ${error.message}`, type: 'error' });
    //   }
    // }
  // };

  // const handleBuyNft = () => {
  //   console.log('Buy NFT');
  // };

  const handleMakeOffer = () => {
    console.log(nft)
    console.log('Make Offer');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError || !nft.thumbnailUrl) {
      return `https://via.placeholder.com/300x250/f1f3f4/7f8c8d?text=NFT+${nft.tokenId}` || 'https://dummyimage.com/300x300/cccccc/ffffff&text=No+Image';
    }
    return nft.thumbnailUrl;
  };

  const labelFromTimestamp = (timestamp) => {
    const now = moment();
    const past = moment(timestamp);
    const daysDiff = now.diff(past, 'days');

    if (daysDiff >= 1) {
      return `${daysDiff} day${daysDiff !== 1 ? 's' : ''} ago`;
    } else {
      const hoursDiff = now.diff(past, 'hours');

      if(hoursDiff === 0) {
        const minDiff = now.diff(past, 'minutes');
        return `${minDiff} minute${minDiff !== 1 ? 's' : ''} ago`;
      }
      return `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ago`;
    }
  };

  const isVideo = (url) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  return (
    <div className="nft-detail">
      <div className="container">
        <div className="nft-detail-content">
          <div className="nft-image-large">
            {isVideo(nft?.resourceUrl) ? (
              <video
                width="350"
                height="350"
                controls={false}
                muted
                autoPlay
                loop
                style={{ borderRadius: '8px', objectFit: 'cover' }}
              >
                <source src={nft.resourceUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={getImageSrc()}  alt={nft.name} onError={handleImageError}
                   width="350"
                   height="350"/>
            )}
          </div>
          <div className="nft-info-large">
            <h1>{nft.name}</h1>
            <h2>Collection: {nft.projectName}</h2>
            <p>Collection: {nft.info}</p>
            {/*<div className="nft-actions-large">*/}
            {/*  <Button onClick={() => addToCart({ id: tokenId, name: nft.name })}>Add To Card</Button>*/}
            {/*</div>*/}
          </div>
        </div>

        <div className="active-listings">
          <h2>Active Listings</h2>
          <div className="listings-table">
            <div className="listing-header">
              <span>Price ETH</span>
              <span>Price USD</span>
              <span>Seller</span>
              <span>Listed</span>
              <span>Action</span>
            </div>
            {orders.map((order, i) => {
              return (
                <div className="listing-row" key={i}>
                  <div data-label="Price ETH:">{order.price} ETH</div>
                  <div data-label="Price USD:">${order.usdPrice?.toFixed(2)}</div>
                  <div data-label="Seller:">{order.contractAddress.slice(0, 6)}...{order.contractAddress.slice(-6)}</div>
                  <div data-label="Listed:">{labelFromTimestamp(order.listTime)}</div>
                  <div className="actions">
                    {(parseFloat(order.price) > 0) &&
                      <PurchaseNft nft={nft} price={order.price}/>
                    }
                    <Button onClick={handleMakeOffer} variant="secondary">Offer</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default NFTDetail;
