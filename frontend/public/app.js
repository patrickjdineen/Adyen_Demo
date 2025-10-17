// Auto-detect API URL based on current location
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  // For Codespaces or other environments, use the same hostname with port 3001
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};

// Application state
const appState = {
  products: [],
  cart: [],
  loading: true,
  error: null,
  showCart: false,
  checkout: false
};

// DOM elements
const app = document.getElementById('app');

// Initialize the application
async function init() {
  try {
    appState.loading = true;
    render();
    
    const response = await fetch(`${getApiUrl()}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    
    const products = await response.json();
    appState.products = products;
    appState.loading = false;
    appState.error = null;
    
    render();
  } catch (error) {
    appState.error = error.message;
    appState.loading = false;
    render();
  }
}

// Render the application
function render() {
  if (appState.loading) {
    app.innerHTML = '<div class="loading">Loading products...</div>';
    return;
  }
  
  if (appState.error) {
    app.innerHTML = `<div class="error">Error: ${appState.error}</div>`;
    return;
  }
  
  if (appState.checkout) {
    renderCheckout();
    return;
  }
  
  renderProductList();
}

// Render product list
function renderProductList() {
  const cartCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
  
  app.innerHTML = `
    <div class="product-list">
      <header>
        <h1>Fujifilm Cameras</h1>
        <button onclick="toggleCart()">
          Cart (${cartCount})
        </button>
      </header>
      ${appState.showCart ? renderCart() : ''}
      <div class="products">
        ${appState.products.map(product => renderProductCard(product)).join('')}
      </div>
    </div>
  `;
}

// Render individual product card
function renderProductCard(product) {
  return `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" />
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <p><strong>$${product.price.toFixed(2)}</strong></p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    </div>
  `;
}

// Render cart
function renderCart() {
  const total = appState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return `
    <div class="cart">
      <h2>Shopping Cart</h2>
      ${appState.cart.length === 0 ? 
        '<p>Your cart is empty.</p>' : 
        `<ul>
          ${appState.cart.map(item => renderCartItem(item)).join('')}
        </ul>`
      }
      <div class="cart-total">
        <strong>Total: $${total.toFixed(2)}</strong>
      </div>
      <button onclick="handleCheckout()" ${appState.cart.length === 0 ? 'disabled' : ''} class="checkout-btn">
        Go to Checkout
      </button>
    </div>
  `;
}

// Render cart item
function renderCartItem(item) {
  return `
    <li class="cart-item">
      <img src="${item.image}" alt="${item.name}" width="50" height="50" />
      <span>${item.name}</span>
      <span>Qty: ${item.quantity}</span>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
      <button onclick="removeFromCart(${item.id})">Remove</button>
    </li>
  `;
}

// Render checkout page
function renderCheckout() {
  const total = appState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  app.innerHTML = `
    <div class="checkout-page">
      <h1>Checkout</h1>
      <ul>
        ${appState.cart.map(item => `
          <li>
            <strong>${item.name}</strong> x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}
          </li>
        `).join('')}
      </ul>
      <div class="cart-total">
        <strong>Total: $${total.toFixed(2)}</strong>
      </div>
      <div style="margin: 2rem 0;">
        <div id="dropin-container"></div>
      </div>
      <button onclick="handleBackToShop()">Back to Shop</button>
    </div>
  `;
  
  // Initialize Adyen checkout after DOM is updated
  setTimeout(initAdyenCheckout, 100);
}

// Cart functions
function addToCart(productId) {
  const product = appState.products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = appState.cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    appState.cart.push({ ...product, quantity: 1 });
  }
  
  render();
}

function removeFromCart(productId) {
  appState.cart = appState.cart.filter(item => item.id !== productId);
  render();
}

function toggleCart() {
  appState.showCart = !appState.showCart;
  render();
}

function handleCheckout() {
  appState.checkout = true;
  appState.showCart = false;
  render();
}

function handleBackToShop() {
  appState.checkout = false;
  render();
}

// Adyen Checkout Integration
async function initAdyenCheckout() {
  const total = appState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const adyenTotal = total * 100;
  
  try {
    // Get session data
    const sessionRequestData = {
      amount: {
        value: adyenTotal,
        currency: 'USD'
      },
      returnUrl: window.location.origin
    };
    
    const sessionResponse = await fetch(`${getApiUrl()}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionRequestData)
    });
    
    if (!sessionResponse.ok) {
      throw new Error(`Session response status: ${sessionResponse.status}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('Session ID:', sessionData.id);
    console.log('Session Data:', sessionData.sessionData);
    
    // Get payment methods
    const paymentMethodsResponse = await fetch(`${getApiUrl()}/api/paymentmethods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!paymentMethodsResponse.ok) {
      throw new Error(`Payment methods response status: ${paymentMethodsResponse.status}`);
    }
    
    const paymentMethodsData = await paymentMethodsResponse.json();
    console.log('Payment methods data:', paymentMethodsData);
    
    // Configure Adyen Checkout
    const dropinConfiguration = {
      paymentMethodComponents: [adyenCheckout.Card, adyenCheckout.GooglePay, adyenCheckout.PayPal, adyenCheckout.ApplePay, adyenCheckout.Klarna, adyenCheckout.Ach],
      openFirstPaymentMethod: true,
      showPaymentMethods: true,
      instantPaymentTypes: ['applepay', 'googlepay']
    };
    
    const adyenGlobalConfig = {
      session: {
        id: sessionData.id,
        sessionData: sessionData.sessionData
      },
      amount: sessionRequestData.amount,
      environment: 'TEST',
      countryCode: 'US',
      locale: 'en-US',
      clientKey: sessionData.clientKey,
      onPaymentCompleted: (result, component) => {
        console.info('Payment completed:', result, component);
        alert(`Payment completed successfully with code ${result.resultCode}`);
      },
      onPaymentFailed: (result, component) => {
        console.info('Payment failed:', result, component);
        alert(`Payment failed with code ${result.resultCode}`);
      },
      onError: (error, component) => {
        console.error('Payment error:', error.name, error.message, error.stack, component);
        alert(`Payment error: ${error.message}`);
      }
    };
    
    // Create and mount Adyen Checkout
    const checkout = await adyenCheckout.AdyenCheckout(adyenGlobalConfig);
    const dropin = new adyenCheckout.Dropin(checkout, dropinConfiguration);
    dropin.mount('#dropin-container');
    
  } catch (error) {
    console.error('Error initializing Adyen checkout:', error);
    alert(`Error initializing checkout: ${error.message}`);
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);
