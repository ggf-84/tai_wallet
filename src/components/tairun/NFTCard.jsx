import React, {useState} from "react";
import Button from "../Button";
import {useNavigate} from "react-router-dom";
import {useCart} from "../../context/CartContext";
import {formatEther} from "ethers";
import {useMainContext} from "../../context/Context";
import {weiToUSD} from "../../services/apiService";
import noImage from  "../../assets/img/noimage.png"

const NFTCard = ({nft, loadingAction, buyNFT, makeOffer}) => {
  const navigate = useNavigate();
  const {addToCart} = useCart();
  const {ethPriceUSD} = useMainContext();
  const [offerPrice, setOfferPrice] = useState(0);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSrc = () => {
    if (imageError || !nft.image) {
      return noImage;
    }
    return nft.image;
  };

  const handleNFTClick = (nft) => {
    navigate(`/details/${nft.listing.nftContract}/${nft.listing.tokenId}`, {state: {nft}});
  };

  return (
    nft.address ? <div className="nft-card">
      <div>
        <div className="nft-image">
          <img src={getImageSrc()} alt={nft.name} onError={handleImageError}/>
          {/*<div className={`nft-status listed`} style={{background: '#818181'}}>Not Listed</div>*/}
          <div className="nft-tairun">xp</div>
        </div>
        <div className="nft-info">
          <h3>{nft.name}</h3>
          <div className="nft-price">
            {/*<span className="price-eth">{formatEther(nft.listing.price)} ETH</span>*/}
            {/*<span className="price-separator">/ </span>*/}
            {/*<span className="price-usd">${weiToUSD(nft.listing.price, ethPriceUSD)}</span>*/}
            <span className="price-eth">ETH</span>
            <span className="price-separator">/ </span>
            <span className="price-usd"> USD</span>
          </div>
        </div>
      </div>

      <div className="nft-actions">
        <div>
          <Button onClick={() => addToCart({
            id: nft.tokenId,
            name: nft.name,
            price: formatEther(0),
            img: nft.image,
            type: 'tairun'
          })}>To card</Button>
          <Button onClick={() => makeOffer(nft.address, nft.tokenId, offerPrice)}
                  disabled={loadingAction}>Offer</Button>
        </div>
        <Button className="btn-not-listed">
          Not Listed
        </Button>
      </div>
    </div> :
      <div className="nft-card">
        <div onClick={() => handleNFTClick(nft)} style={{cursor: 'pointer'}}>
          <div className="nft-image">
            <img src={getImageSrc()} alt={nft.nftName} onError={handleImageError}/>
            <div className={`nft-status listed`}>Listed</div>
            <div className="nft-tairun">xp</div>
          </div>
          <div className="nft-info">
            <h3>{nft.nftName}</h3>
            <div className="nft-price">
              <span className="price-eth">{formatEther(nft.listing.price)} ETH</span>
              <span className="price-separator">/ </span>
              <span className="price-usd">${weiToUSD(nft.listing.price, ethPriceUSD)}</span>
            </div>
          </div>
        </div>

        <div className="nft-actions">
          <div>
            <Button onClick={() => addToCart({
              id: nft.listing.tokenId,
              name: nft.nftName,
              price: formatEther(nft.listing.price),
              img: nft.image,
              type: 'tairun'
            })}>To card</Button>
            <Button onClick={() => makeOffer(nft.listing.nftContract, nft.listing.tokenId, offerPrice)}
                    disabled={loadingAction}>Offer</Button>
            {/*<Button onClick={() => cancelOffer(nft.nftContract, nft.tokenId)} disabled={loadingAction}>Withdraw Offer</Button>*/}
          </div>
          <Button
            onClick={() => buyNFT(nft.id, nft.listing.nftContract, nft.listing.tokenId)}
            disabled={loadingAction}
          >
            Buy
          </Button>
        </div>
      </div>
  );
};
export default NFTCard;
