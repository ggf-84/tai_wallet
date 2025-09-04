import { useCart } from "../context/CartContext";
import Button from "./Button";

const CartDrawer = () => {
  const { cartItems, removeFromCart, isOpen, setIsOpen } = useCart();

  // return (
  //   <div className="cart-drawer" style={{right: isOpen ? 0 : "-100%"}}>
  //     <h3>NFT In Cart {cartItems.length > 0 ? `(${cartItems.length})` : ''}</h3>
  //     <div onClick={() => setIsOpen(false)} className="close-cart">×</div>
  //     {cartItems.length === 0 && <div>Cart is empty</div>}
  //     <ul className="cart-list">
  //       {cartItems.map((item) => (
  //         <li key={item.id}>
  //           <div className="cart-item">
  //             <img src={item.img} alt={item.name}/>
  //             <div>
  //               <span>{item.name}</span>
  //               <span>{item.price} ETH</span>
  //               <div className="cart-actions">
  //                 <Button onClick={() => {}} >Buy</Button>
  //                 <Button onClick={() => removeFromCart(item.id)} variant="secondary">Remove</Button>
  //               </div>
  //             </div>
  //
  //           </div>
  //         </li>
  //       ))}
  //     </ul>
  //   </div>
  // );

  return (
    <div className="cart-drawer" style={{ right: isOpen ? 0 : "-100%" }}>
      <h3>NFT In Cart {cartItems.length > 0 ? `(${cartItems.length})` : ''}</h3>
      <div onClick={() => setIsOpen(false)} className="close-cart">×</div>
      {cartItems.length === 0 && <div>Cart is empty</div>}

      {/* === TaiRun NFTs === */}
      <div className="main-cart-list">
        {cartItems.filter(item => item.type === 'tairun').length > 0 && (
          <>
            <h5 className="mt-3">TaiRun NFTs</h5>
            <ul className="cart-list" >
              {cartItems.filter(item => item.type === 'tairun').map(item => (
                <li key={`${item.type}-${item.id}`}>
                  <div className="cart-item">
                    <img src={item.img} alt={item.name} />
                    <div>
                      <span>{item.name}</span>
                      <span>{item.price} ETH</span>
                      <div className="cart-actions">
                        <Button onClick={() => {}}>Buy</Button>
                        <Button onClick={() => removeFromCart(item.id)} variant="secondary">Remove</Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* === Other NFTs === */}
        {cartItems.filter(item => item.type !== 'tairun').length > 0 && (
          <>
            <h5 className="mt-3">OKX NFTs</h5>
            <ul className="cart-list">
              {cartItems.filter(item => item.type !== 'tairun').map(item => (
                <li key={`${item.type}-${item.id}`}>
                  <div className="cart-item">
                    <img src={item.img} alt={item.name} />
                    <div>
                      <span>{item.name}</span>
                      <span>{item.price} ETH</span>
                      <div className="cart-actions">
                        <Button onClick={() => {}}>Buy</Button>
                        <Button onClick={() => removeFromCart(item.id)} variant="secondary">Remove</Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );

};

export default CartDrawer;
