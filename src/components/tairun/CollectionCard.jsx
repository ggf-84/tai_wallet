import React from "react";
import {useNavigate} from "react-router-dom";
import moment from "moment";
import {weiToUSD} from "../../services/apiService";
import {formatEther} from "ethers";
import {useMainContext} from "../../context/Context";
import noImage from "../../assets/img/noimage.png"

const CollectionCard = ({ collection, type}) => {
  const navigate = useNavigate();
  const {ethPriceUSD} = useMainContext();

  const isNew = moment().diff(moment.unix(collection.createdAt), 'days') < 7;

  return (
    <div className="collection-card" onClick={() => navigate(`/collection/${collection.id}`, {state: {collection, type}})}>
      <div className="collection-image">
        <img src={collection.image || noImage} alt={collection.name} />
      </div>
      <div className="collection-info">
        <div>
          <h3>{collection.name}</h3>
          <div className="collection-items">({collection?.total} items)</div>
        </div>

        <div  className="collection-stats">
          <span>Owners: {collection.owners}</span>
           <span>Listed: {collection?.listed }</span>
        </div>

        <div className="collection-stats">
          {collection?.floorPrice && <span>Floor {formatEther(collection?.floorPrice)} ETH</span>}
          {collection?.floorPrice && <span>${weiToUSD(collection?.floorPrice?.toString(), ethPriceUSD)}</span>}
        </div>
      </div>

      {isNew && <div className="is-new">New</div>}
      <div className="is-tairun">xp</div>
    </div>
  );
};
export default CollectionCard
