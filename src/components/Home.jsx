import React, {useEffect, useState} from "react";
import TaiRunCollectionCard from "./tairun/CollectionCard";
import CollectionCard from "./CollectionCard";
import {fetchCollections} from "../services/apiService";
import {useMainContext} from "../context/Context";
import {getCollectionApi} from "../services/admin/apiService";

const Home = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const {chainId, ethPriceUSD, userAccount} = useMainContext();

  useEffect(() => {
    const loadTaiRunCollections = async () => {
      setLoading(false);
      try {
        const {data} = await getCollectionApi();

        if (!data) {
          throw new Error("Error on get nft collection");
        }

        setCollections(data);
        setLoading(false);
      } catch (err) {
        console.error("Error on get nft collection:", err.message);
      }
    }

    const loadCollections = async () => {
      const data = await fetchCollections(1, chainId);
      console.log(3636363, data)
      setCollections(prev => [...prev, ...(data?.collections || [])]);
    }

    loadTaiRunCollections();
    loadCollections();
  }, [chainId])


  return (
    <div className="home">
      <div className="container">
        <h1>TaiRun Collections</h1>

        <div className="collections-grid" style={{marginBottom: 30}}>
          {loading ? <div>loading...</div> :
            collections.map((collection, i) => {

              if(collection.type === 'tairun') {
                // const showCollection = collection.ownerList?.includes(userAccount?.toLowerCase()) || collection.listed > 0;
                const showCollection = collection.ownerList?.length > 0;
                // const showCollection = true;
                console.log('ownerList', collection, parseInt(collection.listed) > 0, showCollection, userAccount, collection.ownerList)

                if(showCollection) {
                  return <TaiRunCollectionCard key={collection.id} collection={collection} ethPriceUSD={ethPriceUSD} type="tairun"/>
                }

              }
              else{
                return <CollectionCard key={collection.id} collection={collection} type="okx"/>
              }
        })}
        </div>
      </div>
    </div>
  );
};
export default Home
