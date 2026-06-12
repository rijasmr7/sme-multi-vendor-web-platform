import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ChevronLeft, Trash2, Minus, Plus, ShoppingBag, Package, X } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

function ShopCart() {
  const { id } = useParams();
  const [cart, setCart] = useState([]);
  const [shop, setShop] = useState(null);
  const [user, setUser] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState('shop_pickup');
  const [deliveryDetails, setDeliveryDetails] = useState({
    customer_name: '',
    customer_phone: '',
    address_line: '',
    city: '',
    zip_code: ''
  });

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
        // Filter only items for this shop
        const shopItems = response.data.data.filter(item => item.shop_id == id);
        setCart(shopItems);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user, id]);

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/public/shops/${id}`);
        if (response.data.success) {
          setShop(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching shop details:", err);
      }
    };
    fetchShopDetails();
  }, [id]);

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

  const handleCheckout = async () => {
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

    setShowCheckoutModal(true);
  };

  const submitCheckout = async () => {
    const token = localStorage.getItem('token');
    setOrderLoading(true);
    
    try {
      // Create orders for each item in the cart
      for (const item of cart) {
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
      setOrderStatus({ type: 'success', text: `Orders placed successfully for ${cart.length} items!` });
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

  if (!shop) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  const primaryColor = shop.theme?.primary || '#f97316';
  const secondaryColor = shop.theme?.secondary || '#eab308';
  const textColor = shop.theme?.text || '#451a03';
  const backgroundColor = shop.theme?.background || '#ffffff';

  const grandTotal = cart.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * item.quantity), 0);

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: backgroundColor }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <ShoppingCart size={48} style={{ color: primaryColor, marginBottom: '1rem' }} />
          <h2 style={{ color: textColor, marginBottom: '0.5rem' }}>Sign in to view your cart</h2>
          <p style={{ color: textColor, opacity: 0.8, marginBottom: '1.5rem' }}>You need to be logged in to access your cart at {shop.shopName}.</p>
          <Link to="/auth" style={{ textDecoration: 'none', background: primaryColor, color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: '700' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: backgroundColor }}>
      {/* NAVIGATION */}
      <nav className="glass-nav" style={{
        padding: isMobile ? '1rem 1.25rem' : '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', minWidth: 0 }}>
          <Link to={`/shop/${id}`} style={{ color: primaryColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
            <ChevronLeft size={20} /> {!isMobile && "Back to Shop"}
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }}></div>
          <h2 style={{ fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: '800', color: textColor, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <ShoppingCart size={isMobile ? 18 : 22} style={{ flexShrink: 0 }} />
            <span style={{ flexShrink: 0 }}>Cart at&nbsp;</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? '100px' : 'none'
            }} title={shop.shopName}>
              {shop.shopName}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: textColor, opacity: 0.7, fontWeight: '600' }}>Logged in as</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: textColor, fontWeight: '800' }}>{user.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: `1px solid ${primaryColor}`, color: primaryColor, padding: '4px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Logout
          </button>
        </div>
      </nav>

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
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: textColor, marginBottom: '0.5rem' }}>
            Your Cart
          </h1>
          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {cart.length > 0
              ? `You have ${cart.length} item${cart.length > 1 ? 's' : ''} from ${shop.shopName} in your cart.`
              : 'Your cart is empty.'}
          </p>
        </div>

        {cart.length > 0 ? (
          <>
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.6)' }}>
              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map((item, cartIndex) => (
                  <div key={cartIndex} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', border: `1px solid ${primaryColor}44`, borderRadius: '12px',
                    flexWrap: 'wrap', background: 'rgba(255,255,255,0.4)'
                  }}>
                    {/* Product icon */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '12px',
                      background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}11)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: primaryColor, flexShrink: 0
                    }}>
                      <Package size={24} />
                    </div>

                    {/* Product info */}
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <p style={{ margin: 0, fontWeight: '700', color: textColor, fontSize: '0.95rem' }}>{item.product_id}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: textColor, opacity: 0.7 }}>
                        LKR {parseFloat(item.unit_price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })} each
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${primaryColor}44`, borderRadius: '10px', overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(cartIndex, -1)} style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: primaryColor, fontWeight: '800' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '6px 12px', fontWeight: '800', color: textColor, fontSize: '0.9rem', minWidth: '28px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(cartIndex, 1)} style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: primaryColor, fontWeight: '800' }}>
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Item total */}
                    <p style={{ margin: 0, fontWeight: '800', color: primaryColor, fontSize: '1rem', minWidth: '100px', textAlign: 'right' }}>
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
                ))}
              </div>
            </div>

            {/* Grand Total */}
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.6)' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: textColor, opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Total for {shop.shopName}</p>
                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: primaryColor }}>
                  LKR {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <button
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, border: 'none', color: 'white',
                    padding: '10px 24px', borderRadius: '10px', fontWeight: '700',
                    cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.6)' }}>
            <ShoppingBag size={64} style={{ color: primaryColor, opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ color: textColor, marginBottom: '0.5rem' }}>Your cart is empty</h3>
            <p style={{ color: textColor, opacity: 0.8, marginBottom: '1.5rem' }}>Browse {shop.shopName} and add products to your cart!</p>
            <Link to={`/shop/${id}`} style={{ textDecoration: 'none', background: primaryColor, color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', display: 'inline-flex' }}>
              Browse Shop
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
            background: backgroundColor, width: '90%', maxWidth: '500px', 
            maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
            position: 'relative', borderRadius: '16px'
          }}>
            <button onClick={() => setShowCheckoutModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer', color: textColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={24} style={{ color: textColor }} />
            </button>
            <h2 style={{ color: primaryColor, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={24} /> Checkout from {shop.shopName}
            </h2>
            
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${primaryColor}22` }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: textColor, opacity: 0.8 }}>Items in this order: {cart.length}</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: primaryColor }}>Total Amount: LKR {grandTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setDeliveryType('shop_pickup')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                        background: deliveryType === 'shop_pickup' ? primaryColor : 'transparent',
                        color: deliveryType === 'shop_pickup' ? 'white' : primaryColor,
                        border: `2px solid ${primaryColor}`,
                        transition: 'all 0.2s'
                    }}
                >
                    Shop Pickup
                </button>
                <button
                    onClick={() => setDeliveryType('home_delivery')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                        background: deliveryType === 'home_delivery' ? primaryColor : 'transparent',
                        color: deliveryType === 'home_delivery' ? 'white' : primaryColor,
                        border: `2px solid ${primaryColor}`,
                        transition: 'all 0.2s'
                    }}
                >
                    Home Delivery
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Customer Name</label>
                    <input 
                        type="text" 
                        value={deliveryDetails.customer_name} 
                        onChange={e => setDeliveryDetails({...deliveryDetails, customer_name: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'white' }} 
                        placeholder="Enter your name"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Contact Number</label>
                    <input 
                        type="text" 
                        value={deliveryDetails.customer_phone} 
                        onChange={e => setDeliveryDetails({...deliveryDetails, customer_phone: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'white' }} 
                        placeholder="Enter your phone number"
                    />
                </div>
                
                {deliveryType === 'home_delivery' && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Street Address</label>
                            <input 
                                type="text" 
                                value={deliveryDetails.address_line} 
                                onChange={e => setDeliveryDetails({...deliveryDetails, address_line: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'white' }} 
                                placeholder="123 Main St"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>City</label>
                                <input 
                                    type="text" 
                                    value={deliveryDetails.city} 
                                    onChange={e => setDeliveryDetails({...deliveryDetails, city: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'white' }} 
                                    placeholder="Colombo"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Zip Code</label>
                                <input 
                                    type="text" 
                                    value={deliveryDetails.zip_code} 
                                    onChange={e => setDeliveryDetails({...deliveryDetails, zip_code: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'white' }} 
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
                    background: orderLoading ? '#ccc' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, 
                    color: 'white', border: 'none', fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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

export default ShopCart;
