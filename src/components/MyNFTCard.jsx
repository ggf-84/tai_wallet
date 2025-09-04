import React, {useEffect, useState} from "react";
import Button from "./Button";
import {ethers, formatEther} from "ethers";
import {updateMyNft, weiToUSD} from "../services/apiService";
import {useMainContext} from "../context/Context";
import noImage from "../assets/img/noimage.png";


const MyNFTCard = ({ nft, toggleNFTSelection, openChangePriceModal, cancelNFTListing, selectedNFTs, provider}) => {
  const {ethPriceUSD} = useMainContext();
  const [listed, setListed] = useState(null);
  const isSelected = selectedNFTs.find(n => n.contract === nft.contract && n.tokenId === nft.tokenId);

   useEffect(() => {
      if(nft.listings?.length > 0) {
        const activeListing = nft.listings.find(
          l => l?.active === true
        );
        setListed(activeListing);
      }
  }, [nft]);


  const getImageSrc = () => {
    if (!nft.image) {
      return noImage;
    }
    return nft.image;
  };

  return (
    <div key={`${nft.contract}-${nft.tokenId}`}
         className={`nft-card my-nft ${listed ? 'listed' : ''} ${isSelected ? 'selected' : ''}`}
         onClick={(e) => {
           if (!listed && e.target.tagName !== 'BUTTON') {
             toggleNFTSelection(nft);
           }
         }}
    >
      <div className="my-nft-body">
        <div className="nft-image">
          <img src={getImageSrc()} alt={nft.name} />
          <div className={`nft-status ${nft.isListed ? 'listed' : 'not-listed'}`}>
            {listed ? 'Listed33' : 'Not Listed33'}
          </div>
          <div className={`nft-status type`}>
            {nft.type === 0 ? 'ERC721' : 'ERC1155'}
          </div>
        </div>
        <div className="nft-info">
          <h3>{nft.name}</h3>
          {/*<div>Amount: {nft.amount}</div>*/}
          {nft.isListed && listed && (
            <div className="nft-price">
              <span className="price-eth">{formatEther(listed.listing.price)} ETH</span>
              <span className="price-separator">/ </span>
              <span className="price-usd">${weiToUSD(listed.listing.price, ethPriceUSD)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="nft-actions">
        {nft.isListed && listed && <div>
          <Button onClick={() => openChangePriceModal(listed.hash, formatEther(listed.listing.price), nft.tokenId)}>Price</Button>
          <Button onClick={() => cancelNFTListing(nft.itemId, nft.listingType, listed.hash ?? '', nft.address, nft.tokenId)} variant="secondary">Cancel</Button>
        </div>}
        {!nft.isListed && <Button onClick={() => toggleNFTSelection(nft)} variant={isSelected ? 'secondary' : 'primary'}>
          {isSelected ? 'Deselect' : 'Select'}
        </Button>}
      </div>
    </div>
  );
};
export default MyNFTCard;
