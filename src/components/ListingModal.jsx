import Button from "./Button";
import React from "react";

const ListingModal = ({
                        selectedNFTs,
                        listingPrice,
                        setListingPrice,
                        strategy,
                        setStrategy,
                        onSubmit,
                        setToast,
                        setSelectedNFTs,
                        listingDuration,
                        setListingDuration,
}) => {

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(',', '.');
    if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) {
      setListingPrice(value);
    }
  };

  const updateNFTPrice = (index, rawValue) => {
    setSelectedNFTs(prev => {
      if (index < 0 || index >= prev.length) return prev; // protecție la out-of-bounds

      const parsed = rawValue === '' ? '' : rawValue;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        customPrice: parsed,
      };
      return updated;
    });
  };

  if (!selectedNFTs.length) {
    setToast({message: 'Please select at least one NFT to list', type: 'error'});
    return;
  }

  return (
    <div className="listing-modal" style={{display: 'block'}}>
      <label>Pricing Strategy:</label>
      <select value={strategy} onChange={(e) => setStrategy(e.target.value)} id="pricingStrategy">
        <option value="uniform">Uniform</option>
        <option value="individual">Individual</option>
      </select>

      {strategy === 'uniform' && (
        <>
          <label>Price per item (ETH):</label>
          <input
            type="text"
            min="0.00001"
            value={listingPrice}
            onChange={handlePriceChange}
            placeholder="0.001"
          />
        </>
      )}

      {strategy === 'individual' && (
        <div>
          {selectedNFTs.map((nft, index) => (
            <div
              key={`${nft.contract}-${nft.tokenId}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                margin: '8px 0',
                borderRadius: '6px',
                border: '1px solid #464646',
              }}
            >
              <div style={{flexDirection: 'column', display: 'flex', fontSize: '0.8rem'}}>
                <md style={{color: '#666'}}>{nft.collection}</md>
                <md>{nft.name}</md>
                <md style={{color: '#666'}}>ID: {nft.tokenId}</md>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <input
                  type="text"
                  min="0.00001"
                  value={nft.customPrice ?? ''}
                  onChange={(e) => updateNFTPrice(index, e.target.value)}
                  placeholder="0.001"
                />
                <span style={{color: '#666', fontSize: '14px'}}>ETH</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <label>Listing Duration (in seconds):</label>
      <select value={listingDuration} onChange={(e) => setListingDuration(e.target.value)}>
        <option value="604800">7 Days</option>
        <option value="864000">10 Days</option>
        <option value="1296000">15 Days</option>
        <option value="2592000">30 Days</option>
      </select>

      <Button onClick={() => onSubmit()} style={{marginTop:15}}>
        {strategy === 'uniform' ? 'List NFTs with one prices' : 'List NFTs individually'}
      </Button>
      <button className="btn btn-secondary" onClick={() => onclose(false)}>Cancel</button>
    </div>
  );
};
export default ListingModal
