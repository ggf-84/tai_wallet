import React from "react";
import {useNavigate} from "react-router-dom";
import noImage from "../assets/img/noimage.png"

const CollectionCard = ({ collection, type}) => {
  const navigate = useNavigate();

  //   collection.id
  //   collection.name
  //   collection.contractAddress
  //   collection.image
  //   collection.isNew
  //   collection.description
  //   collection.totalItems
  //   collection.floorPrice
  //   collection.priceUsd
  //   collection.currency
  //   collection.owners
  //   collection.listed

  return (
    <div className="collection-card" onClick={() => navigate(`/collection/${collection.id}`, {state: {collection, type}})}>
      <div className="collection-image">
        <img src={collection.image || noImage} alt={collection.name} />
      </div>
      <div className="collection-info">
        <div>
          <h3>{collection.name}</h3>
          <div className="collection-items">({collection.totalItems} items)</div>
          {collection.isNew > 0 && <span className="is-new">New</span>}
        </div>

        <div  className="collection-stats">
          <span>Owners: {collection.owners}</span>
           <span>Listed: {collection.listed }</span>
        </div>

        <div className="collection-stats">
          <span>Floor: {collection.floorPrice} ETH</span>
          <span>${collection.priceUsd?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
export default CollectionCard
