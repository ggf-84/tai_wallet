import React, { useEffect, useState } from "react";
import {useMainContext} from "../../context/Context";
import Toast from "../Toast";
import Button from "../Button";

const AdminControls = () => {
  const {contract, isAdmin} = useMainContext()

  const [toast, setToast] = useState(null);
  const [mintFee, setMintFee] = useState(""); // în %
  const [newFee, setNewFee] = useState("");   // în %

  useEffect(() => {
    const init = async () => {
      if (!contract && !isAdmin) return;

      const fee = await contract.platformFee(); // e.g. 250
      setMintFee((Number(fee) / 100).toFixed(2)); // afișăm ca 2.5%
    };

    init();
  }, []);

  const updateFee = async () => {
    try {
      const parsed = Math.round(parseFloat(newFee) * 100); // ex: 2.5 → 250
      const tx = await contract.setPlatformFee(parsed);
      await tx.wait();
      setToast({message: "Tax was updated.", type: "success"});
      setMintFee(newFee);
      setNewFee("");
      console.error("Success to update tax:", parsed);
    } catch (err) {
      console.error("Error to update tax:", err);
      setToast({message: "Error to update tax", type: "error"});
    }
  };

  const withdrawETH = async () => {
    try {
      const tx = await contract.claimETHFees();
      await tx.wait();
      setToast({message: "Success withdraw ETH", type: "success"});
    } catch (err) {
      console.error("Error to withdraw ETH:", err);
      setToast({message: "Error to withdraw ETH", type: "error"});
    }
  };

  const withdrawWETH = async () => {
    try {
      const tx = await contract.claimWETHFees();
      await tx.wait();
      setToast({message: "WETH retras cu succes", type: "success"});
    } catch (err) {
      console.error("Eroare la withdraw WETH:", err);
      setToast({message: "Eroare la retragere WETH", type: "error"});
    }
  };

  return (
    <div className="admin-card">
      <h4>Admin Tools</h4>

      <div className="form-group" style={{gap:3}}>
        <h3 className="activities-label">Tax (%):</h3>
        <p>Current tax: <b>{mintFee}%</b></p>
        <input
          type="text"
          placeholder="Ex: 2.5"
          value={newFee}
          onChange={(e) => setNewFee(e.target.value)}
        />
        <Button onClick={() => updateFee()} style={{marginLeft:5}}>Update tax</Button>
      </div>

      <div className="form-group last-activities">
        <h3 className="activities-label">Withdraw founds:</h3>
        <Button onClick={() => withdrawETH()}>Withdraw ETH</Button>
        <Button variant="secondary" style={{marginLeft:5}} onClick={() => withdrawWETH()}>Withdraw WETH</Button>
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

export default AdminControls;
