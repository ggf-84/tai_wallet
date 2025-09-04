import React, { useState, useEffect } from "react";
import {getCollectionApi, removeCollectionApi, saveCollectionApi} from "../../services/admin/apiService";
import Toast from "../Toast";
import Button from "../Button";

const CollectionManager = () => {
  const [toast, setToast] = useState(null);

  const [collections, setCollections] = useState([]);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tokenType, setTokenType] = useState("");
  const [floorPrice, setFloorPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const {data} = await getCollectionApi();
        console.log("extraction:", data);
        if (!data) {
          throw new Error("Error on get nft collection");
        }
        setCollections(data);
      } catch (err) {
        console.error("Error on get nft collection:", err.message);
      }
    };
    fetchCollections();
  }, []);

  const saveToServer = async (updated) => {
    try {
      const res = await saveCollectionApi(updated);

      if (!res.success) {
        console.log(4444666, res)
        throw new Error(res);
      }

      setToast({message: `Collection ${address} was saved`, type: 'success'});
      setCollections(res.list);
    } catch (err) {
      console.log(4444, err)
      setToast({message: err, type: 'error'});
    }
  };

  const addCollection = async () => {
    const addr = address.trim().toLowerCase();
    if (!addr || !addr.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert("❌ Adresă invalidă");
      return;
    }
    if (!name) {
      alert("❌ Numele este obligatoriu");
      return;
    }
    if (collections.some((col) => col.address.toLowerCase() === addr)) {
      alert("⚠️ Colecția deja există");
      return;
    }

    const newEntry = {
      name : name,
      address: addr,
      symbol: name.slice(0, 4).toUpperCase(),
      img: image,
      description: description,
      project_id: projectId,
      token_type: tokenType,
      floor_price: floorPrice,
      max_price: maxPrice,
      type: 'tairun'
    };

    try {
      const {data} = await saveToServer(newEntry);
      console.log("extraction:", data);
      if (!data) {
        throw new Error("Error on add collection");
      }

      setAddress("");
      setName("");
      setDescription("");
      setImage("");
      setProjectId("");
      setTokenType("")
      setFloorPrice("")
      setMaxPrice("")

      setToast({message: `Collection ${address} was saved`, type: 'success'});
      setCollections(data);
    } catch (err) {
      console.log(4444, err)
      setToast({message: err, type: 'error'});
    }
  };

  const removeCollection = async (id) => {
    try {
      const {data} = await removeCollectionApi(id);

      if (!data) {
        throw new Error("Error on delete collection");
      }

      setToast({message: `Collection ${address} was removed`, type: 'success'});
      setCollections(data);
    } catch (err) {
      setToast({message: err, type: 'error'});
    }
  };

  return (
    <div className="admin-card">
      <h4>Gestionare Colecții</h4>

      <div className="manage-collection">
        <div className="form-group">
          <label>Adresa Contract*</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            maxLength={42}
          />
        </div>

        <div className="form-group">
          <label>Name*</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: My NFTs"
          />
        </div>

        <div className="form-group">
          <label>Image*</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://ipfs.io/ipfs/..."
          />
          <small>If empty, will be automatically completed from tokenURI(1)</small>
        </div>

        <div className="form-group">
          <label>OKX Project ID (optional):</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="okx collection projectId"
          />
        </div>

        <div className="form-group">
          <label>Token Type (optional, ERC1155 = 0 or ERC721 = 1):</label>
          <input
            type="text"
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Floor Price (optional, weiValue 123000000000000000 = 0.123 ETH):</label>
          <input
            type="text"
            value={floorPrice}
            onChange={(e) => setFloorPrice(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Max Price (optional, weiValue 123000000000000000 = 0.123 ETH):</label>
          <input
            type="text"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description (optional):</label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Some description..."
          />
        </div>

        <Button onClick={addCollection} variant="secondary">Add Collection</Button>
      </div>

      <div className="current-collections">
        <h4>Existing collections:</h4>

        <div className="collection-list">
          {collections.length === 0 ? (
            <p style={{ color: "#888" }}>No collections at the moment. Add the first one.</p>
          ) : (
            collections.map((col) => (
              <div key={col.address} className="collection-card">
                <img src={col.image.length > 0 ? col.image : 'https://dummyimage.com/300x300/cccccc/ffffff&text=No+Image'} alt={col.name} style={{ width: 175, height: 175, borderRadius: 8, objectFit: "cover" }} />
                <div className="collection-card-body">
                  <h5>{col.name} ({col.symbol})</h5>
                  <div>{col.description}</div>
                  <code>{col.address}</code>
                  <div>Listed: {col.listed}</div>
                  <div>Owners: {col.owners}</div>
                  <Button onClick={() => removeCollection(col.id)} >Delete </Button>
                </div>
              </div>
            ))
          )}
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

export default CollectionManager;
