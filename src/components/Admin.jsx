import React, {useEffect, useState} from "react";
import {useMainContext} from "../context/Context";
import {MARKETPLACE_ADDRESS} from "../lib/config";
import {formatUnits} from "ethers";
import Toast from "./Toast";
import Button from "./Button";
// import ActivityPanel from "./admin/ActivityPanel";
import CollectionManager from "./admin/CollectionManager";
import MarketplaceStats from "./admin/MarketplaceStats";
import ActivityPanel from "./admin/ActivityPanel";
import AdminControls from "./admin/AdminControls";
// import MarketplaceStats from "./admin/MarketplaceStats";
// import AdminControls from "./admin/AdminControls";

const Admin = () => {
  const {
    isAdmin,
  } = useMainContext();

  const [activeSection, setActiveSection] = useState('collections');

  const handleDeleteCollection = () => {
    console.log('Delete collection');
  };

  const handleExportCSV = () => {
    console.log('Export CSV');
  };

  const handleExportJSON = () => {
    console.log('Export JSON');
  };


  useEffect(() => {

  }, []);


  // const [password, setPassword] = useState('');
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const handleLogin = () => {
  //   // Mock admin password check
  //   if (password === 'admin123') {
  //     setIsAuthenticated(true);
  //   } else {
  //     alert('Invalid password');
  //   }
  // };
  //
  // if (!isAuthenticated) {
  //   return (
  //     <div className="admin-login">
  //       <div className="container">
  //         <div className="login-form">
  //           <h1>Admin Login</h1>
  //           <input
  //             type="password"
  //             placeholder="Admin Password"
  //             value={password}
  //             onChange={(e) => setPassword(e.target.value)}
  //           />
  //           <Button onClick={handleLogin}>Login</Button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  //

  if(!isAdmin) {
    return <div className="admin-panel">
        <div className="container">
          <h1>Admin Panel</h1>
          <p>No access to admin panel, Connect  please via owner wallet!</p>
        </div>
      </div>
  }


  return (
      <div className="admin-panel">
        <div className="container">
          <h1>Admin Panel</h1>

          <div className="admin-tabs">
            <button
              className={activeSection === 'collections' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('collections')}
            >
              Collections
            </button>
            <button
              className={activeSection === 'marketplace-stats' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('marketplace-stats')}
            >
              Marketplace Stats
            </button>
            <button
              className={activeSection === 'activities' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('activities')}
            >
              Activities
            </button>
            <button
              className={activeSection === 'fees' ? 'tab active' : 'tab'}
              onClick={() => setActiveSection('fees')}
            >
              Fees
            </button>
          </div>

          {activeSection === 'collections' && (
            <div className="admin-collections">
                <CollectionManager />
            </div>
          )}

          {activeSection === 'marketplace-stats' && (
            <div className="admin-marketplace-stats">
              <MarketplaceStats />
            </div>
          )}

          {activeSection === 'activities' && (
            <div className="admin-activities">
              <div className="admin-actions">
                <input type="date" />
                <Button onClick={handleExportCSV}>Export CSV</Button>
                <Button variant="secondary" onClick={handleExportJSON}>Export JSON</Button>
              </div>
              <ActivityPanel />
            </div>
          )}

          {activeSection === 'fees' && (
            <div className="admin-fees">
              {/*<div className="fee-balance">*/}
              {/*  <h2>Commission Balance</h2>*/}
              {/*  <div className="balance-amount">*/}
              {/*    <span>5.2 ETH</span>*/}
              {/*    <span>$10,400</span>*/}
              {/*  </div>*/}
              {/*</div>*/}
              {/*<Button onClick={handleWithdrawFees}>Withdraw Fees</Button>*/}
              <AdminControls />
            </div>
          )}
        </div>
      </div>
  );
};
export default Admin;
