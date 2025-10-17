import { useEffect, useState } from 'react';
import './App.css';
import Cart from './Cart';
import Checkout from './Checkout';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    // Auto-detect API URL based on current location
    const getApiUrl = () => {
      if (window.location.hostname === 'localhost') {
        return 'http://localhost:3001';
      }
      // For Codespaces or other environments, use the same hostname with port 3001
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    };
    
    fetch(`${getApiUrl()}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    setCheckout(true);
    setShowCart(false);
  };

  const handleBackToShop = () => {
    setCheckout(false);
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

  if (checkout) {
    return <Checkout cartItems={cart} onBack={handleBackToShop} />;
  }

  return (
    <div className="product-list">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Fujifilm Cameras</h1>
        <button onClick={() => setShowCart((v) => !v)}>
          Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </button>
      </header>
      {showCart && (
        <Cart cartItems={cart} onRemove={removeFromCart} onCheckout={handleCheckout} />
      )}
      <div className="products">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p><strong>${product.price.toFixed(2)}</strong></p>
            <button onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
