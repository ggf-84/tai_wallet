import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/styles.css';
// import './assets/css/marketplace_1.css';
// import './assets/css/marketplace_2.css';
import App from './App';
import {MainProvider} from "./context/Context";
import {CartProvider} from "./context/CartContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MainProvider>
    <CartProvider>
      <App/>
    </CartProvider>
  </MainProvider>
);
