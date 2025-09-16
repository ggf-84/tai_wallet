import React, {useState} from "react";
import Button from "./Button";
import {useNavigate} from "react-router-dom";
import {useCart} from "../context/CartContext";
import PurchaseNft from "./PurchaseNft";
import noImage from  "../assets/img/noimage.png"

// const NFTCard = ({ nft, onPurchase, onMakeOffer }) => {
const NFTCard = ({ nft }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [imageError, setImageError] = useState(false);

  const makeOffer = () => {
    // onMakeOffer && onMakeOffer(nft);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError || !nft.thumbnailUrl) {
      return noImage;
    }
    return nft.thumbnailUrl;
  };

  const handleNFTClick = (nft) => {
    navigate(`/nft-details/${nft.project}/${nft.tokenId}`,  {state: {nft}});
  };

  return (
    <div className="nft-card">
      <div onClick={() => handleNFTClick(nft)} style={{cursor: 'pointer'}}>
        <div className="nft-image">
          <img src={getImageSrc()} alt={nft.name} onError={handleImageError}/>
          <div className={`nft-status ${(nft.sale && typeof nft.sale?.price === 'number' && nft.sale?.price > 0) ? 'listed' : 'not-listed'}`}>
            {(nft.sale && typeof nft.sale?.price === 'number' && nft.sale?.price > 0) ? 'Listed' : 'Not Listed'}
          </div>
        </div>
        <div className="nft-info">
          <h3>{nft.name}</h3>
          {(nft.sale && typeof nft.sale?.price === 'number' && nft.sale?.price > 0) ? (
            <div className="nft-price">
              <span className="price-eth">{nft.sale?.price} ETH</span>
              <span className="price-separator">/ </span>
              <span className="price-usd">${nft.sale?.usdPrice.toFixed(2)}</span>
            </div>
          ) : <div className="nft-price">
            <span className="price-eth">ETH</span>
            <span className="price-separator">/ </span>
            <span className="price-usd"> USD</span>
          </div>}
        </div>
      </div>

      <div className="nft-actions">
        <div>
          <Button onClick={() => addToCart({
            id: nft.tokenId,
            name: nft.name,
            price: (nft.sale && typeof nft.sale?.price === 'number' && nft.sale?.price > 0) ? nft.sale?.price : 'Not Listed',
            img: getImageSrc(),
            type: 'okx'
          })}>To card</Button>
          <Button onClick={makeOffer} variant="secondary">Offer</Button>
        </div>
        <PurchaseNft nft={nft} />
      </div>
    </div>
  );
};
export default NFTCard;
