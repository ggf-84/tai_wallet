import Button from "./Button";
import React from "react";

const ChangePriceModal = ({setNewListingPrice, confirmPriceChange, closeChangePriceModal}) => {

  return (
    <div className="change-price-modal">

      <label>New Price (ETH):</label>
      <input
        type="text"
        min="0.00001"
        onChange={(e) => {
          const input = e.target.value.replace(',', '.');

          if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) {
            setNewListingPrice(input);
          }
        }}
        placeholder="0.001"
      />
      <Button onClick={() => confirmPriceChange()}>Update Price</Button>
      <Button onClick={() => closeChangePriceModal()} variant="secondary">Cancel</Button>
    </div>
  )
}
export default ChangePriceModal
