import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ChevronLeft, Trash2, Minus, Plus, ShoppingBag, Store, Package, X, Menu } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

function CustomerCart() {
  const [cart, setCart] = useState([]);
  const [shops, setShops] = useState([]);
  const [user, setUser] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ shopId: null, items: [] });
  const [deliveryType, setDeliveryType] = useState('shop_pickup');
  const [deliveryDetails, setDeliveryDetails] = useState({
    customer_name: '',
    customer_phone: '',
    address_line: '',
    city: '',
    zip_code: ''
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('customer');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchCartItems = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${GATEWAY_URL}/cart/customer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/public/shops`);
        if (response.data.success) setShops(response.data.data);
      } catch (err) {
        console.error("Error fetching shops:", err);
      }
    };
    fetchShops();
  }, []);

  const updateQuantity = async (index, delta) => {
    const token = localStorage.getItem('token');
    const item = cart[index];
    const newQuantity = Math.max(1, item.quantity + delta);

    try {
      await axios.put(`${GATEWAY_URL}/cart/item/${item.id}`, { quantity: newQuantity }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCartItems();
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeItem = async (index) => {
    const token = localStorage.getItem('token');
    const item = cart[index];

    try {
      await axios.delete(`${GATEWAY_URL}/cart/item/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCartItems();
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${GATEWAY_URL}/cart/customer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart([]);
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const handleCheckout = async (shopId, itemsToCheckout) => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Fetch last delivery address to pre-fill
    try {
        const response = await axios.get(`${GATEWAY_URL}/orders/customer/${user.id}/address`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success && response.data.data && Object.keys(response.data.data).length > 0) {
            const addr = response.data.data;
            setDeliveryDetails({
                customer_name: addr.customer_name || user.name,
                customer_phone: addr.customer_phone || '',
                address_line: addr.address_line || '',
                city: addr.city || '',
                zip_code: addr.zip_code || ''
            });
        } else {
            setDeliveryDetails(prev => ({ ...prev, customer_name: user.name }));
        }
    } catch (err) {
        setDeliveryDetails(prev => ({ ...prev, customer_name: user.name }));
    }

    setCheckoutData({ shopId, items: itemsToCheckout });
    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    const token = localStorage.getItem('token');
    setOrderLoading(true);
    
    try {
      // Create orders for each item in this shop's cart
      for (const item of checkoutData.items) {
        await axios.post(`${GATEWAY_URL}/orders`, {
          vendor_id: item.vendor_id,
          shop_id: item.shop_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          delivery_type: deliveryType,
          customer_name: deliveryDetails.customer_name,
          customer_phone: deliveryDetails.customer_phone,
          address_line: deliveryType === 'home_delivery' ? deliveryDetails.address_line : '',
          city: deliveryType === 'home_delivery' ? deliveryDetails.city : '',
          zip_code: deliveryType === 'home_delivery' ? deliveryDetails.zip_code : ''
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Remove item from cart
        await axios.delete(`${GATEWAY_URL}/cart/item/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchCartItems();
      setShowCheckoutModal(false);
      setOrderStatus({ type: 'success', text: `Orders placed successfully for ${checkoutData.items.length} items!` });
    } catch (err) {
      console.error("Checkout failed:", err);
      const msg = err.response?.data?.message || 'Checkout failed. Please try again.';
      setOrderStatus({ type: 'error', text: msg });
    } finally {
      setOrderLoading(false);
      setTimeout(() => setOrderStatus(null), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    window.location.href = '/';
  };

  // Group cart items by shop
  const groupedByShop = cart.reduce((acc, item) => {
    const key = item.shop_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const grandTotal = cart.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * item.quantity), 0);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <ShoppingCart size={48} style={{ color: '#f97316', marginBottom: '1rem' }} />
          <h2 style={{ color: '#451a03', marginBottom: '0.5rem' }}>Sign in to view your cart</h2>
          <p style={{ color: '#92400e', marginBottom: '1.5rem' }}>You need to be logged in to access your cart.</p>
          <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" style={{ minHeight: '100vh', background: '#fffbeb', width: '100%' }}>
      {/* NAVIGATION */}
      <nav className="glass-nav" style={{
        padding: isMobile ? '1rem 1.5rem' : '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1.5rem' }}>
          <Link to="/" style={{ color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.9rem' }}>
            <ChevronLeft size={20} /> {!isMobile && "Marketplace"}
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', color: '#451a03', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingCart size={isMobile ? 18 : 22} /> My Cart
          </h2>
        </div>

        {isMobile ? (
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#451a03', padding: '5px' }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', opacity: 0.7, fontWeight: '600' }}>Logged in as</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#451a03', fontWeight: '800' }}>{user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #f97316', color: '#f97316', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* MOBILE MENU DROPDOWN */}
      {isMobile && isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
          zIndex: 999,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #fef3c7' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>Logged in as</p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#451a03', fontWeight: '800' }}>{user.name}</p>
          </div>
          <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
            <ChevronLeft size={18} /> Marketplace
          </Link>
          <button 
            onClick={() => { handleLogout(); setIsMenuOpen(false); }}
            style={{ 
              background: '#fee2e2', 
              border: '1px solid #fca5a5', 
              color: '#b91c1c', 
              padding: '12px', 
              borderRadius: '10px', 
              fontWeight: '700', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginTop: '0.5rem'
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Order Status Notification */}
      {orderStatus && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
          padding: '1rem 2rem', borderRadius: '12px', color: 'white',
          fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          background: orderStatus.type === 'success' ? '#10b981' : '#ef4444',
          animation: 'slide-in 0.3s ease-out'
        }}>
          {orderStatus.text}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>
            Shopping Cart
          </h1>
          <p style={{ color: '#92400e', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {cart.length > 0
              ? `You have ${cart.length} item${cart.length > 1 ? 's' : ''} in your cart.`
              : 'Your cart is empty.'}
          </p>
        </div>

        {cart.length > 0 ? (
          <>
            {/* Group by shop */}
            {Object.entries(groupedByShop).map(([shopId, items]) => {
              const shopInfo = shops.find(s => s.id == shopId);
              const shopName = shopInfo?.shopName || `Shop #${shopId}`;
              const shopPrimary = shopInfo?.theme?.primary || '#f97316';
              const shopTotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * item.quantity), 0);

              return (
                <div key={shopId} className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Shop Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #fbbf2433' }}>
                    <Link to={`/shop/${shopId}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `linear-gradient(135deg, ${shopPrimary}, ${shopPrimary}88)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        <Store size={18} />
                      </div>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#451a03' }}>{shopName}</span>
                    </Link>
                    <span style={{ fontWeight: '700', color: shopPrimary, fontSize: '0.9rem' }}>
                      Subtotal: LKR {shopTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item) => {
                      const cartIndex = cart.findIndex(c => c.shop_id === item.shop_id && c.product_id === item.product_id);
                      return (
                        <div key={cartIndex} style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '1rem', background: '#fef9ee', borderRadius: '12px',
                          flexWrap: 'wrap'
                        }}>
                          {/* Product icon */}
                          <div style={{
                            width: '56px', height: '56px', borderRadius: '12px',
                            background: `linear-gradient(135deg, ${shopPrimary}22, ${shopPrimary}11)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: shopPrimary, flexShrink: 0
                          }}>
                            <Package size={24} />
                          </div>

                          {/* Product info */}
                          <div style={{ flex: 1, minWidth: '100px' }}>
                            <p style={{ margin: 0, fontWeight: '700', color: '#451a03', fontSize: '0.95rem' }}>{item.product_id}</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', opacity: 0.7 }}>
                              LKR {parseFloat(item.unit_price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })} each
                            </p>
                          </div>

                          {/* Quantity controls */}
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #fbbf2444', borderRadius: '10px', overflow: 'hidden' }}>
                            <button onClick={() => updateQuantity(cartIndex, -1)} style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: '#f97316', fontWeight: '800' }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ padding: '6px 12px', fontWeight: '800', color: '#451a03', fontSize: '0.9rem', minWidth: '28px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button onClick={() => updateQuantity(cartIndex, 1)} style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: '#f97316', fontWeight: '800' }}>
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Item total */}
                          <p style={{ margin: 0, fontWeight: '800', color: '#f97316', fontSize: '1rem', minWidth: '100px', textAlign: 'right' }}>
                            LKR {(parseFloat(item.unit_price || 0) * item.quantity).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </p>

                          {/* Remove */}
                          <button onClick={() => removeItem(cartIndex)} style={{
                            background: '#fee2e2', border: 'none', color: '#ef4444',
                            padding: '8px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0
                          }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Shop Checkout */}
                  <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleCheckout(shopId, items)}
                      style={{
                        background: `linear-gradient(135deg, ${shopPrimary}, ${shopPrimary}dd)`, border: 'none', color: 'white',
                        padding: '10px 20px', borderRadius: '10px', fontWeight: '700',
                        cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Grand Total + Actions */}
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Grand Total</p>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#f97316' }}>
                  LKR {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={clearCart}
                  style={{
                    background: '#fee2e2', border: 'none', color: '#ef4444',
                    padding: '10px 20px', borderRadius: '10px', fontWeight: '700',
                    cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Trash2 size={16} /> Clear Cart
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <ShoppingBag size={64} style={{ color: '#fbbf24', opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ color: '#451a03', marginBottom: '0.5rem' }}>Your cart is empty</h3>
            <p style={{ color: '#92400e', marginBottom: '1.5rem' }}>Browse our shops and add products to your cart!</p>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Browse Shops
            </Link>
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: 'white', width: '90%', maxWidth: '500px', 
            maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
            position: 'relative', borderRadius: '16px'
          }}>
            <button onClick={() => setShowCheckoutModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#451a03'
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: '#f97316', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={24} /> Complete Your Order
            </h2>
            
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#451a03', opacity: 0.8 }}>Items in this order: {checkoutData.items.length}</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#f97316' }}>
                    Total: LKR {checkoutData.items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setDeliveryType('shop_pickup')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                        background: deliveryType === 'shop_pickup' ? '#f97316' : 'transparent',
                        color: deliveryType === 'shop_pickup' ? 'white' : '#f97316',
                        border: '2px solid #f97316'
                    }}
                >
                    Shop Pickup
                </button>
                <button
                    onClick={() => setDeliveryType('home_delivery')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                        background: deliveryType === 'home_delivery' ? '#f97316' : 'transparent',
                        color: deliveryType === 'home_delivery' ? 'white' : '#f97316',
                        border: '2px solid #f97316'
                    }}
                >
                    Home Delivery
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#451a03', fontSize: '0.85rem', fontWeight: '700' }}>Customer Name</label>
                    <input 
                        type="text" 
                        value={deliveryDetails.customer_name} 
                        onChange={e => setDeliveryDetails({...deliveryDetails, customer_name: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                        placeholder="Enter your name"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#451a03', fontSize: '0.85rem', fontWeight: '700' }}>Contact Number</label>
                    <input 
                        type="text" 
                        value={deliveryDetails.customer_phone} 
                        onChange={e => setDeliveryDetails({...deliveryDetails, customer_phone: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                        placeholder="Enter your phone number"
                    />
                </div>
                
                {deliveryType === 'home_delivery' && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', color: '#451a03', fontSize: '0.85rem', fontWeight: '700' }}>Street Address</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.address_line} 
                                onChange={e => setDeliveryDetails({...deliveryDetails, address_line: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                                placeholder="123 Main St"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#451a03', fontSize: '0.85rem', fontWeight: '700' }}>City</label>
                                <input 
                                    type="text" 
                                    value={deliveryDetails.city} 
                                    onChange={e => setDeliveryDetails({...deliveryDetails, city: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                                    placeholder="Colombo"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: '#451a03', fontSize: '0.85rem', fontWeight: '700' }}>Zip Code</label>
                                <input 
                                    type="text" 
                                    value={deliveryDetails.zip_code} 
                                    onChange={e => setDeliveryDetails({...deliveryDetails, zip_code: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }} 
                                    placeholder="00100"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={submitCheckout}
                disabled={orderLoading}
                style={{ 
                    width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer',
                    background: orderLoading ? '#cbd5e1' : '#f97316', 
                    color: 'white', border: 'none', fontSize: '1rem'
                }}
            >
                {orderLoading ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerCart;
