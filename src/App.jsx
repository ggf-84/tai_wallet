import Header from "./components/Header";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";

import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import NFTDetailPage from "./pages/NFTDetailPage";
import AdminPage from "./pages/AdminPage";
import CartDrawer from "./components/CartDrawer";
import NftMarketPlace from "./components/NftMarketPlace";
import TaiRunNFTDetailPage from "./pages/TaiRunNFTDetailPage";

function App() {
  return (
    <div className="app">
      <Router>
        <Header/>
        <CartDrawer />
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/collection/:id" element={<CollectionPage/>}/>
            <Route path="/nft-details/:collectionId/:tokenId" element={<NFTDetailPage/>}/>
            <Route path="/details/:contract/:tokenId" element={<TaiRunNFTDetailPage/>}/>
            <Route path="/admin" element={<AdminPage/>}/>
            <Route path="/market" element={<NftMarketPlace/>}/>
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
