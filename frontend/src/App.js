import React, { useState, useEffect } from "react";
import "./App.css";

const categories = ["All", "Electronics", "Fashion", "Accessories", "Education"];

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <span key={s} className={s <= Math.floor(rating) ? "star filled" : s - 0.5 <= rating ? "star half" : "star"}>★</span>
      ))}
      <span className="rating-num">{rating}</span>
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("summary");
  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [storedAccount, setStoredAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: "", email: "", password: "" });
  const [addressForm, setAddressForm] = useState({ street: "", city: "", state: "", zip: "", country: "India" });
  const [shippingAddress, setShippingAddress] = useState({ street: "", city: "", state: "", zip: "", country: "India" });
  const [paymentDetails, setPaymentDetails] = useState({ cardNumber: "", expiry: "", cvv: "", billingName: "" });
  const [orders, setOrders] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products`)
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to empty array if API fails
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (!storedAccount) {
      showToast('No account found. Please register first.');
      return;
    }
    if (storedAccount.email !== accountForm.email || storedAccount.password !== accountForm.password) {
      showToast('Email or password is incorrect.');
      return;
    }
    setUser(storedAccount);
    setShippingAddress(storedAccount.address || shippingAddress);
    setAccountOpen(false);
    showToast(`Welcome back, ${storedAccount.name}!`);
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (!accountForm.name || !accountForm.email || !accountForm.password) {
      showToast('Please fill all registration fields.');
      return;
    }
    const profile = {
      ...accountForm,
      address: addressForm,
    };
    setStoredAccount(profile);
    setUser(profile);
    setShippingAddress(addressForm);
    setAccountOpen(false);
    showToast(`Welcome, ${accountForm.name}! Your account is ready.`);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthMode('login');
    setAccountForm({ name: '', email: '', password: '' });
    setAddressForm({ street: '', city: '', state: '', zip: '', country: 'India' });
    setAccountOpen(false);
    showToast('You have been logged out.');
  };

  const handleAddressUpdate = (event) => {
    event.preventDefault();
    if (!user) {
      showToast('Log in to update your address.');
      return;
    }
    const updatedUser = { ...user, address: addressForm };
    setUser(updatedUser);
    setStoredAccount(updatedUser);
    setShippingAddress(addressForm);
    showToast('Address updated successfully.');
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      showToast('Your cart is empty. Add items first.');
      return;
    }
    if (!user) {
      setCartOpen(false);
      setAccountOpen(true);
      showToast('Please log in before checkout.');
      return;
    }
    setCheckoutStep('payment');
    setCheckoutOpen(true);
    setCartOpen(false);
  };

  const handlePlaceOrder = (event) => {
    event.preventDefault();
    if (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv || !paymentDetails.billingName) {
      showToast('Enter payment details to place your order.');
      return;
    }
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      showToast('Please update your shipping address.');
      return;
    }
    const newOrder = {
      id: Date.now(),
      items: [...cart],
      total: cartTotal,
      date: new Date().toLocaleDateString(),
      address: shippingAddress,
      payment: {
        card: `**** **** **** ${paymentDetails.cardNumber.slice(-4)}`,
        name: paymentDetails.billingName,
      },
      status: 'Confirmed',
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setCheckoutOpen(false);
    setCheckoutStep('summary');
    setPaymentDetails({ cardNumber: '', expiry: '', cvv: '', billingName: '' });
    showToast('Your order has been placed successfully!');
  };

  const updateShippingAddress = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="app">
        <div className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Loading products...</h1>
          </div>
        </div>
      </div>
    );
  }

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...product, qty: 1}];
    });
    showToast(`${product.emoji} ${product.name} added to cart!`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? {...i, qty: Math.max(1, i.qty + delta)} : i));
  };

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  let filtered = products.filter(p =>
    (category === "All" || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === "low") filtered = [...filtered].sort((a,b) => a.price - b.price);
  if (sortBy === "high") filtered = [...filtered].sort((a,b) => b.price - a.price);
  if (sortBy === "rating") filtered = [...filtered].sort((a,b) => b.rating - a.rating);

  return (
    <div className="app" id="top">
      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🛍️</span>
          <span className="brand-name">ShopKart</span>
        </div>
        <div className="nav-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="nav-actions">
          <button className="nav-btn" onClick={() => setAccountOpen(true)}>
            {user ? `👤 ${user.name}` : '👤 Login'}
          </button>
          <button className="cart-btn" onClick={() => { setCheckoutStep('summary'); setCartOpen(true); }}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* HERO BANNER */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-tag">🔥 Summer Sale — Up to 50% Off</p>
          <h1 className="hero-title">Shop the Best.<br/>Live the Best.</h1>
          <p className="hero-sub">Thousands of products. Unbeatable prices. Fast delivery.</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => document.getElementById('products').scrollIntoView({behavior:'smooth'})}>Shop Now →</button>
            <button className="btn-outline">View Deals</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card floating">🛍️</div>
          <div className="hero-card floating2">⚡</div>
          <div className="hero-card floating3">🎁</div>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      <section className="categories-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-pill ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "All" ? "🌟" : cat === "Electronics" ? "⚡" : cat === "Fashion" ? "👗" : cat === "Accessories" ? "💎" : "📖"} {cat}
          </button>
        ))}
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Sort By</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat"><span className="stat-num">10K+</span><span className="stat-label">Products</span></div>
        <div className="stat"><span className="stat-num">50K+</span><span className="stat-label">Happy Customers</span></div>
        <div className="stat"><span className="stat-num">Free</span><span className="stat-label">Delivery on ₹500+</span></div>
        <div className="stat"><span className="stat-num">24/7</span><span className="stat-label">Customer Support</span></div>
      </div>

      {/* PRODUCTS GRID */}
      <section className="products-section" id="products">
        <h2 className="section-title">
          {category === "All" ? "Featured Products" : category}
          <span className="product-count"> ({filtered.length} items)</span>
        </h2>
        {filtered.length === 0 ? (
          <div className="no-results">😕 No products found for "{search}"</div>
        ) : (
          <div className="products-grid">
            {filtered.map(product => (
              <div className="product-card" key={product.id}>
                {product.badge && <span className="badge">{product.badge}</span>}
                <button
                  className={`wishlist-btn ${wishlist.includes(product.id) ? "wishlisted" : ""}`}
                  onClick={() => toggleWishlist(product.id)}
                >
                  {wishlist.includes(product.id) ? "❤️" : "🤍"}
                </button>
                <div className="product-img">
                  <span className="product-emoji">{product.emoji}</span>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.desc}</p>
                  <StarRating rating={product.rating} />
                  <span className="review-count">({product.reviews} reviews)</span>
                  <div className="product-footer">
                    <span className="product-price">₹{product.price.toLocaleString()}</span>
                    <button className="add-to-cart" onClick={() => addToCart(product)}>
                      + Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PROMO BANNER */}
      <section className="promo-banner">
        <div className="promo-item">
          <span className="promo-icon">🚚</span>
          <div><strong>Free Delivery</strong><p>On orders above ₹500</p></div>
        </div>
        <div className="promo-item">
          <span className="promo-icon">🔄</span>
          <div><strong>Easy Returns</strong><p>30-day return policy</p></div>
        </div>
        <div className="promo-item">
          <span className="promo-icon">🔒</span>
          <div><strong>Secure Payment</strong><p>100% safe transactions</p></div>
        </div>
        <div className="promo-item">
          <span className="promo-icon">🎁</span>
          <div><strong>Gift Wrapping</strong><p>Available on all orders</p></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-icon">🛍️</span> ShopKart
            <p>Your one-stop shop for everything you love.</p>
          </div>
          <div className="footer-links">
            <h4>Shop</h4>
            <a href="#top">Electronics</a>
            <a href="#top">Fashion</a>
            <a href="#top">Accessories</a>
          </div>
          <div className="footer-links">
            <h4>Help</h4>
            <a href="#top">Track Order</a>
            <a href="#top">Returns</a>
            <a href="#top">Contact Us</a>
          </div>
          <div className="footer-links">
            <h4>Follow Us</h4>
            <a href="#top">Instagram</a>
            <a href="#top">Twitter</a>
            <a href="#top">Facebook</a>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 ShopKart. All rights reserved. | Made with ❤️
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>🛒 Your Cart ({cartCount})</h2>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <p>🛍️ Your cart is empty!</p>
                <button className="btn-primary" onClick={() => setCartOpen(false)}>Start Shopping</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-emoji">{item.emoji}</span>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>₹{item.price.toLocaleString()}</span>
                      </div>
                      <div className="qty-controls">
                        <button onClick={() => updateQty(item.id, -1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <strong>₹{cartTotal.toLocaleString()}</strong>
                  </div>
                  <button className="checkout-btn" onClick={handleProceedToPayment}>
                    Proceed to Checkout →
                  </button>
                  <button className="continue-btn" onClick={() => setCartOpen(false)}>Continue Shopping</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {checkoutOpen && (
        <div className="cart-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>✅ Checkout</h2>
              <button className="close-btn" onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>
            {checkoutStep === 'summary' ? (
              <div className="cart-items">
                {cart.map(item => (
                  <div className="cart-item" key={item.id}>
                    <span className="cart-emoji">{item.emoji}</span>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span>₹{item.price.toLocaleString()} x {item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form className="checkout-form" onSubmit={handlePlaceOrder}>
                <div className="checkout-section">
                  <h3>Shipping Address</h3>
                  <label>
                    Street
                    <input type="text" value={shippingAddress.street} onChange={e => updateShippingAddress('street', e.target.value)} />
                  </label>
                  <label>
                    City
                    <input type="text" value={shippingAddress.city} onChange={e => updateShippingAddress('city', e.target.value)} />
                  </label>
                  <label>
                    State
                    <input type="text" value={shippingAddress.state} onChange={e => updateShippingAddress('state', e.target.value)} />
                  </label>
                  <label>
                    ZIP
                    <input type="text" value={shippingAddress.zip} onChange={e => updateShippingAddress('zip', e.target.value)} />
                  </label>
                </div>
                <div className="checkout-section">
                  <h3>Payment Details</h3>
                  <label>
                    Cardholder Name
                    <input type="text" value={paymentDetails.billingName} onChange={e => setPaymentDetails(prev => ({ ...prev, billingName: e.target.value }))} />
                  </label>
                  <label>
                    Card Number
                    <input type="text" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))} />
                  </label>
                  <label>
                    Expiry
                    <input type="text" value={paymentDetails.expiry} onChange={e => setPaymentDetails(prev => ({ ...prev, expiry: e.target.value }))} />
                  </label>
                  <label>
                    CVV
                    <input type="text" value={paymentDetails.cvv} onChange={e => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))} />
                  </label>
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Order Total:</span>
                    <strong>₹{cartTotal.toLocaleString()}</strong>
                  </div>
                  <button type="submit" className="checkout-btn">
                    Pay Now
                  </button>
                  <button className="continue-btn" type="button" onClick={() => setCheckoutStep('summary')}>
                    Back to Summary
                  </button>
                </div>
              </form>
            )}
            {checkoutStep === 'summary' && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Order Total:</span>
                  <strong>₹{cartTotal.toLocaleString()}</strong>
                </div>
                <button className="checkout-btn" onClick={handleProceedToPayment}>
                  Continue to Payment →
                </button>
                <button className="continue-btn" onClick={() => {
                  setCheckoutOpen(false);
                  setCartOpen(true);
                }}>
                  Back to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {accountOpen && (
        <div className="cart-overlay" onClick={() => setAccountOpen(false)}>
          <div className="cart-drawer account-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2>{user ? 'Account Settings' : authMode === 'login' ? 'Login' : 'Register'}</h2>
              <button className="close-btn" onClick={() => setAccountOpen(false)}>✕</button>
            </div>
            {!user ? (
              <form className="account-form" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                {authMode === 'register' && (
                  <label>
                    Name
                    <input type="text" value={accountForm.name} onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))} />
                  </label>
                )}
                <label>
                  Email
                  <input type="email" value={accountForm.email} onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))} />
                </label>
                <label>
                  Password
                  <input type="password" value={accountForm.password} onChange={e => setAccountForm(prev => ({ ...prev, password: e.target.value }))} />
                </label>
                {authMode === 'register' && (
                  <>
                    <h3>Address</h3>
                    <label>
                      Street
                      <input type="text" value={addressForm.street} onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))} />
                    </label>
                    <label>
                      City
                      <input type="text" value={addressForm.city} onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))} />
                    </label>
                    <label>
                      State
                      <input type="text" value={addressForm.state} onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))} />
                    </label>
                    <label>
                      ZIP
                      <input type="text" value={addressForm.zip} onChange={e => setAddressForm(prev => ({ ...prev, zip: e.target.value }))} />
                    </label>
                  </>
                )}
                <div className="cart-footer">
                  <button type="submit" className="checkout-btn">
                    {authMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                  <button type="button" className="continue-btn" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                    {authMode === 'login' ? 'Create an Account' : 'Have an Account? Log In'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="account-content">
                <div className="account-section">
                  <h3>Welcome, {user.name}</h3>
                  <p>Email: {user.email}</p>
                  <p>Orders: {orders.length}</p>
                </div>
                <div className="account-section">
                  <h3>Update Address</h3>
                  <form onSubmit={handleAddressUpdate}>
                    <label>
                      Street
                      <input type="text" value={addressForm.street} onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))} placeholder={user.address?.street || 'Street'} />
                    </label>
                    <label>
                      City
                      <input type="text" value={addressForm.city} onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))} placeholder={user.address?.city || 'City'} />
                    </label>
                    <label>
                      State
                      <input type="text" value={addressForm.state} onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))} placeholder={user.address?.state || 'State'} />
                    </label>
                    <label>
                      ZIP
                      <input type="text" value={addressForm.zip} onChange={e => setAddressForm(prev => ({ ...prev, zip: e.target.value }))} placeholder={user.address?.zip || 'ZIP'} />
                    </label>
                    <button className="checkout-btn" type="submit">Save Address</button>
                  </form>
                </div>
                <div className="account-section">
                  <h3>Order History</h3>
                  {orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => (
                    <div key={order.id} className="order-card">
                      <strong>Order #{order.id}</strong>
                      <p>{order.date}</p>
                      <p>{order.items.length} items - ₹{order.total.toLocaleString()}</p>
                      <p>Status: {order.status}</p>
                    </div>
                  ))}
                </div>
                <button className="continue-btn" onClick={handleLogout}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
