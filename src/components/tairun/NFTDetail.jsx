import React, {useState} from "react";
import Button from "../Button";
import {useLocation} from "react-router-dom";
import moment from "moment";
import {useCart} from "../../context/CartContext";
import {formatEther} from "ethers";
import {useMainContext} from "../../context/Context";
import {useMarketplaceActions} from "../../hooks/useMarketplaceActions";
import Toast from "../Toast";
import {weiToUSD} from "../../services/apiService";

const NFTDetail = () => {
  // const { tokenId } = useParams();

  const { userAccount, ethPriceUSD } = useMainContext();
  const {state} = useLocation();
  const nft = state.nft

  const { addToCart } = useCart();
  const [toast, setToast] = useState([]);

  const {
    buyItem,
    makeOffer,
    cancelOffer,
    loadingAction,
  } = useMarketplaceActions(setToast);

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


  return (
    <div className="nft-detail">
      <div className="container">
        <div className="nft-detail-content">
          <div className="nft-image-large">
            <img src={nft.img}  alt={nft.name} height={350} width={350} style={{objectFit: "cover"}}/>
          </div>
          <div className="nft-info-large">
            <h1>{nft.name}</h1>
            <h2>Collection: {nft.collection?.name}</h2>
            <p>{nft.collection?.description}</p>

            {/* eslint-disable-next-line no-mixed-operators */}
            {!userAccount || (userAccount && nft.seller?.toLowerCase() !== userAccount.toLowerCase()) && (
              <>
                <div>
                  <Button onClick={() => addToCart({
                    id: nft.token_id,
                    name: nft.name,
                    price: formatEther(nft.price),
                    img: nft.img,
                    type: 'tairun'
                  })}>To card</Button>
                </div>
              </>
            )}
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
              <div className="listing-row" >
                <div data-label="Price ETH:">{formatEther(nft.price)} ETH</div>
                <div data-label="Price USD:">${weiToUSD(nft.price, ethPriceUSD)}</div>
                <div data-label="Seller:">{nft.contract.slice(0, 6)}...{nft.contract.slice(-6)}</div>
                <div data-label="Listed:">{labelFromTimestamp(nft.created_at)}</div>

                <div className="actions">
                  <Button
                    onClick={() => buyItem(nft.contract, nft.token_id)}
                    disabled={loadingAction}
                  >
                    Buy
                  </Button>

                  {nft?.offer && nft?.offer.buyer?.toLowerCase() === userAccount?.toLowerCase() ? (
                    <Button onClick={() => cancelOffer(nft.contract, nft.token_id)} disabled={loadingAction}>Withdraw Offer</Button>
                  ) : (
                    <Button onClick={() => makeOffer(nft.contract, nft.token_id, 0.01)} disabled={loadingAction}>Offer</Button>
                  )}
                </div>
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
    </div>
  );
};
export default NFTDetail;
