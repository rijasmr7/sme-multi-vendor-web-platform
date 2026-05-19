import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ShoppingCart, Package, Info, Mail, Star, Phone, Menu, X, Minus, Plus, ClipboardList, Box } from 'lucide-react';
import ARViewer from './components/webar/ARViewer';

const GATEWAY_URL = 'http://localhost:5000';

const ShopView = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderLoading, setOrderLoading] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [shopOrders, setShopOrders] = useState([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState(null);
  const [checkoutProductIdx, setCheckoutProductIdx] = useState(null);
  const [deliveryType, setDeliveryType] = useState('shop_pickup');
  const [deliveryDetails, setDeliveryDetails] = useState({
    customer_name: '',
    customer_phone: '',
    address_line: '',
    city: '',
    zip_code: ''
  });

  // AR Modal State
  const [showArModal, setShowArModal] = useState(false);
  const [activeArModelUrl, setActiveArModelUrl] = useState(null);
  const [arLoading, setArLoading] = useState(false);

  const handleOpenAR = async (productId) => {
    setArLoading(productId);
    try {
      const response = await axios.get(`http://localhost:5006/models/product/${productId}`);
      if (response.data.success && response.data.data) {
        // Build the absolute URL to the GLB file
        setActiveArModelUrl(`http://localhost:5006${response.data.data.optimized_file_url}`);
        setShowArModal(true);
        // Track 3D View Analytics
        axios.post(`http://localhost:5006/models/product/${productId}/analytics`, { type: '3d' }).catch(console.error);
      }
    } catch (err) {
       if (err.response?.status === 404) {
         alert("No 3D model found for this product yet.");
       } else {
         alert("Failed to load 3D model. Please try again later.");
       }
    } finally {
      setArLoading(false);
    }
  };

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('customer');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    setUser(null);
    window.location.reload();
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        // 1. Fetch the AI-generated shop configuration
        const shopResponse = await axios.get(`${GATEWAY_URL}/public/shops/${id}`);
        if (shopResponse.data.success) {
          const shopData = shopResponse.data.data;
          
          // 2. Fetch the REAL products for this vendor to get their IDs
          try {
            const productsResponse = await axios.get(`${GATEWAY_URL}/public/products/vendor/${shopData.vendor_id}`);
            if (productsResponse.data.success) {
              const realProducts = productsResponse.data.data;
              
              // 3. Link the AI descriptions with the real Product IDs based on name matching
              const enrichedProducts = shopData.products.map(aiProd => {
                const match = realProducts.find(p => p.name.toLowerCase().includes(aiProd.name.toLowerCase()) || aiProd.name.toLowerCase().includes(p.name.toLowerCase()));
                return {
                  ...aiProd,
                  id: match ? match.id : null, // This is the ID we need for WebAR
                  price: match ? match.price : aiProd.price
                };
              });
              
              shopData.products = enrichedProducts;
            }
          } catch (pErr) {
            console.warn("Could not fetch real products for enrichment:", pErr);
          }

          setShop(shopData);
        }
      } catch (err) {
        console.error("Error fetching shop:", err);
        setError("Shop not found or currently unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  const getQuantity = (idx) => quantities[idx] || 1;

  const updateQuantity = (idx, delta) => {
    setQuantities(prev => ({
      ...prev,
      [idx]: Math.max(1, (prev[idx] || 1) + delta)
    }));
  };

  const fetchCartItems = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${GATEWAY_URL}/cart/customer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCartItems(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching cart items:", err);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const handleAddToCart = async (product, idx) => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setOrderStatus({ type: 'error', text: 'Please sign in to add to cart.' });
      setTimeout(() => setOrderStatus(null), 3000);
      return;
    }

    const qty = getQuantity(idx);
    
    try {
      const response = await axios.post(`${GATEWAY_URL}/cart`, {
        vendor_id: shop.vendor_id || 1,
        shop_id: id,
        product_id: product.name,
        quantity: qty,
        unit_price: product.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrderStatus({ type: 'success', text: `Added ${product.name} (x${qty}) to cart!` });
        fetchCartItems(); // Refresh cart items from server
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart. Try again.';
      setOrderStatus({ type: 'error', text: msg });
    } finally {
      setTimeout(() => setOrderStatus(null), 3000);
    }
  };

  const handleOrder = async (product, idx) => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setOrderStatus({ type: 'error', text: 'Please sign in to place an order.' });
      setTimeout(() => setOrderStatus(null), 3000);
      return;
    }

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

    setSelectedProductForCheckout(product);
    setCheckoutProductIdx(idx);
    setShowCheckoutModal(true);
  };

  const submitOrder = async () => {
    const token = localStorage.getItem('token');
    const qty = getQuantity(checkoutProductIdx);
    setOrderLoading(true);

    try {
      const response = await axios.post(`${GATEWAY_URL}/orders`, {
        vendor_id: shop.vendor_id || 1,
        shop_id: id,
        product_id: selectedProductForCheckout.name,
        quantity: qty,
        unit_price: selectedProductForCheckout.price,
        delivery_type: deliveryType,
        customer_name: deliveryDetails.customer_name,
        customer_phone: deliveryDetails.customer_phone,
        address_line: deliveryType === 'home_delivery' ? deliveryDetails.address_line : '',
        city: deliveryType === 'home_delivery' ? deliveryDetails.city : '',
        zip_code: deliveryType === 'home_delivery' ? deliveryDetails.zip_code : ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const total = parseFloat(response.data.data.total_price).toLocaleString('en-LK', { minimumFractionDigits: 2 });
        setOrderStatus({ type: 'success', text: `Order placed for ${selectedProductForCheckout.name} (x${qty}) — LKR ${total}` });
        setShowCheckoutModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Try again.';
      setOrderStatus({ type: 'error', text: msg });
    } finally {
      setOrderLoading(false);
      setTimeout(() => setOrderStatus(null), 4000);
    }
  };

  const fetchShopOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    
    setOrdersLoading(true);
    setShowOrdersModal(true);
    try {
      const response = await axios.get(`${GATEWAY_URL}/orders/customer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter orders only for this shop
        const filtered = response.data.data.filter(o => o.vendor_id == shop.vendor_id);
        setShopOrders(filtered);
      }
    } catch (err) {
      console.error("Error fetching shop orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Loading store experience...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <Info size={64} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#451a03', marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: '#92400e', marginBottom: '2rem' }}>{error || "We couldn't find the shop you're looking for."}</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            <ChevronLeft size={20} /> Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = shop.theme?.primary || '#f97316';
  const secondaryColor = shop.theme?.secondary || '#eab308';
  const textColor = shop.theme?.text || '#451a03';
  const backgroundColor = shop.theme?.background || '#ffffff';

  return (
    <div className="shop-view" style={{ minHeight: '100vh', paddingBottom: '4rem', background: backgroundColor }}>
      {/* SHOP NAVIGATION BAR */}
      <nav className="glass-nav" style={{ 
        padding: '1.25rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{ color: primaryColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.9rem' }}>
            <ChevronLeft size={20} /> Marketplace
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: textColor, margin: 0 }}>{shop.shopName}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Desktop Nav Items */}
          {!isMobile && shop.navigation?.map((item, idx) => (
            <span key={item + idx} style={{ 
              fontSize: '0.95rem', 
              fontWeight: '600', 
              color: textColor, 
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = primaryColor}
            onMouseOut={(e) => e.currentTarget.style.color = textColor}
            >
              {item}
            </span>
          ))}

          {/* Shop Specific Orders Link */}
          {!isMobile && user && (
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              color: textColor, fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' 
            }}
              onClick={fetchShopOrders}
              onMouseOver={(e) => e.currentTarget.style.color = primaryColor}
              onMouseOut={(e) => e.currentTarget.style.color = textColor}
            >
              <ClipboardList size={18} /> My Orders
            </span>
          )}

          {/* Cart Icon */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowCartModal(true)}>
            <ShoppingCart size={24} style={{ color: textColor }} />
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: primaryColor, color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>
              {cartItems.filter(item => item.shop_id == id).reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', display: isMobile ? 'none' : 'block' }}></div>

          {/* User Section */}
          {!isMobile && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: textColor, opacity: 0.7, fontWeight: '600' }}>Logged in as</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: textColor, fontWeight: '800' }}>{user.name}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{ background: 'none', border: `1px solid ${primaryColor}`, color: primaryColor, padding: '4px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" style={{ textDecoration: 'none', background: primaryColor, color: 'white', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', boxShadow: `0 4px 10px ${primaryColor}44` }}>
                Sign In
              </Link>
            )
          )}

          {/* Hamburger Menu Icon (Mobile Only) */}
          {isMobile && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: textColor, padding: '5px' }}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isMobile && isMenuOpen && (
        <div style={{ 
          position: 'fixed', 
          top: '72px', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(10px)',
          zIndex: 999,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {shop.navigation?.map((item, idx) => (
            <div key={idx} style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: textColor,
              padding: '1rem',
              borderBottom: `1px solid ${primaryColor}22`
            }}
            onClick={() => setIsMenuOpen(false)}
            >
              {item}
            </div>
          ))}

          {/* Mobile Orders Link */}
          {user && (
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700', 
              color: textColor,
              padding: '1rem',
              borderBottom: `1px solid ${primaryColor}22`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setIsMenuOpen(false);
              fetchShopOrders();
            }}
            >
              <ClipboardList size={24} style={{ color: primaryColor }} /> My Orders
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
              {user ? (
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: textColor, opacity: 0.7 }}>Account</p>
                    <p style={{ margin: 0, fontSize: '1rem', color: textColor, fontWeight: '800' }}>{user.name}</p>
                  </div>
                  <button onClick={handleLogout} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', fontWeight: '700' }}>Logout</button>
                </div>
              ) : (
                <Link to="/auth" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: primaryColor, color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: '800' }}>Sign In</Link>
              )}
           </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: `linear-gradient(135deg, ${primaryColor}11, ${secondaryColor}11)`, borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: textColor, fontWeight: '600', marginBottom: '0.5rem' }}>Special Offer!</p>
            <p style={{ color: primaryColor, fontSize: '0.8rem' }}>Get 10% off your first order</p>
          </div>
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          h1 { font-size: 2.5rem !important; }
          .shop-view nav h2 { font-size: 1.1rem !important; }
        }
      `}</style>

      {/* SHOP HERO */}
      <div style={{ 
        background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`, 
        padding: '5rem 2rem', 
        textAlign: 'center',
        marginBottom: '3rem',
        borderBottom: `1px solid ${primaryColor}11`
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', color: textColor, marginBottom: '1.5rem' }}>Welcome to <span style={{ color: primaryColor }}>{shop.shopName}</span></h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, opacity: 0.8, fontWeight: '600' }}><Star size={18} fill={secondaryColor} color={secondaryColor} /> 4.9 (120+ Reviews)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, opacity: 0.8, fontWeight: '600' }}><Package size={18} color={primaryColor} /> Fast Delivery</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, opacity: 0.8, fontWeight: '600' }}><Phone size={18} color={primaryColor} /> Verified Vendor</div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: textColor, marginBottom: '0.5rem' }}>Our Collection</h2>
            <div style={{ width: '80px', height: '6px', background: primaryColor, borderRadius: '10px' }}></div>
          </div>
          <div style={{ color: textColor, opacity: 0.6, fontWeight: '600', fontSize: '0.9rem' }}>Showing {shop.products?.length || 0} results</div>
        </div>

        {orderStatus && (
          <div className="animate-fade-in" style={{ 
            position: 'fixed', 
            bottom: '2rem', 
            right: '2rem', 
            left: isMobile ? '2rem' : 'auto',
            background: orderStatus.type === 'error' ? '#ef4444' : primaryColor, 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '12px', 
            boxShadow: orderStatus.type === 'error' ? '0 10px 15px -3px rgba(239,68,68,0.4)' : `0 10px 15px -3px ${primaryColor}66`,
            zIndex: 2000,
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '500px'
          }}>
            <ShoppingCart size={20} /> {orderStatus.text}
          </div>
        )}

        <div className="product-grid">
          {shop.products?.map((product, idx) => (
            <div key={idx} className="glass-card animate-fade-in" style={{ 
              padding: '1.5rem', 
              transition: 'all 0.3s ease',
              animationDelay: `${idx * 0.1}s`,
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{ 
                height: '200px', 
                background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`, 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryColor,
                overflow: 'hidden'
              }}>
                <Package size={64} style={{ opacity: 0.8 }} />
              </div>

              <div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: textColor, marginBottom: '0.25rem' }}>{product.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: primaryColor }}>LKR {parseFloat(product.price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                  
                  {/* AR View Button */}
                  <button 
                    onClick={() => handleOpenAR(product.id)}
                    disabled={arLoading === product.id}
                    style={{ background: `${secondaryColor}22`, border: `1px solid ${secondaryColor}`, color: secondaryColor, padding: '4px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Box size={16} /> {arLoading === product.id ? 'Loading...' : 'View in 3D / AR'}
                  </button>
                </div>
                
                {product.description && (
                  <p style={{ fontSize: '0.85rem', color: textColor, marginBottom: '1.25rem', lineHeight: '1.5', opacity: 0.7 }}>
                    {product.description}
                  </p>
                )}

                {/* Quantity Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: textColor, opacity: 0.7 }}>Qty:</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${primaryColor}44`, borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, -1)}
                      style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: primaryColor, fontWeight: '800', fontSize: '1rem' }}
                    >
                      <Minus size={16} />
                    </button>
                    <span style={{ padding: '6px 14px', fontWeight: '800', color: textColor, fontSize: '0.95rem', minWidth: '30px', textAlign: 'center' }}>
                      {getQuantity(idx)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(idx, 1)}
                      style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', color: primaryColor, fontWeight: '800', fontSize: '1rem' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleAddToCart(product, idx)}
                    className="btn-primary" 
                    style={{ flex: 1, background: `transparent`, border: `2px solid ${primaryColor}`, color: primaryColor }}
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => handleOrder(product, idx)}
                    disabled={orderLoading === idx}
                    className="btn-primary" 
                    style={{ flex: 1, background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, border: 'none', opacity: orderLoading === idx ? 0.7 : 1 }}
                  >
                    {orderLoading === idx ? 'Placing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ marginTop: '8rem', padding: '4rem 2rem', background: textColor, color: backgroundColor, borderRadius: '40px 40px 0 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>{shop.shopName}</h3>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>A locally verified business powered by our AI SME platform.</p>
          </div>
          <div>
            <h4 style={{ fontWeight: '700', marginBottom: '1.25rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.8, fontSize: '0.9rem' }}>
              <span>Home</span>
              <span>Our Story</span>
              <span>Shipping Policy</span>
              <span>Contact</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: '700', marginBottom: '1.25rem' }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: 0.8, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={16} /> support@{shop.shopName.toLowerCase().replace(/\s+/g, '')}.com</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={16} /> +1 (555) 000-0000</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${backgroundColor}22`, marginTop: '4rem', paddingTop: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.8rem' }}>
          © 2026 {shop.shopName}. All rights reserved. SME Multi-Vendor Platform.
        </div>
      </footer>
      {/* ORDERS MODAL */}
      {showOrdersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: backgroundColor, width: '90%', maxWidth: '600px', 
            maxHeight: '80vh', overflowY: 'auto', padding: '2rem',
            position: 'relative', borderRadius: '16px'
          }}>
            <button onClick={() => setShowOrdersModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer', color: textColor
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: primaryColor, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={24} /> My Orders at {shop.shopName}
            </h2>
            
            {ordersLoading ? (
              <p style={{ color: textColor }}>Loading your orders...</p>
            ) : shopOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {shopOrders.map(order => (
                  <div key={order.id} style={{ 
                    border: `1px solid ${primaryColor}44`, padding: '1rem', borderRadius: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', color: textColor }}>{order.product_id} (x{order.quantity})</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: textColor, opacity: 0.7 }}>
                        {new Date(order.created_at).toLocaleDateString()} - Status: <span style={{ fontWeight: 'bold' }}>{order.status}</span>
                      </p>
                    </div>
                    <div style={{ fontWeight: '800', color: primaryColor }}>
                      LKR {parseFloat(order.total_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: textColor }}>You haven't placed any orders at this shop yet.</p>
            )}

            {/* View All Orders link */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link 
                to={`/shop/${id}/orders`} 
                onClick={() => setShowOrdersModal(false)}
                style={{ 
                  textDecoration: 'none', background: primaryColor, color: 'white', 
                  padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem',
                  display: 'inline-block', transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                View Full Order History →
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* CART MODAL */}
      {showCartModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: backgroundColor, width: '90%', maxWidth: '600px', 
            maxHeight: '80vh', overflowY: 'auto', padding: '2rem',
            position: 'relative', borderRadius: '16px'
          }}>
            <button onClick={() => setShowCartModal(false)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer', color: textColor
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: primaryColor, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={24} /> Cart at {shop.shopName}
            </h2>
            
            {cartItems.filter(item => item.shop_id == id).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.filter(item => item.shop_id == id).map((item, idx) => (
                  <div key={idx} style={{ 
                    border: `1px solid ${primaryColor}44`, padding: '1rem', borderRadius: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', color: textColor }}>{item.product_id} (x{item.quantity})</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: textColor, opacity: 0.7 }}>
                        LKR {parseFloat(item.unit_price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })} each
                      </p>
                    </div>
                    <div style={{ fontWeight: '800', color: primaryColor }}>
                      LKR {(parseFloat(item.unit_price || 0) * item.quantity).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: textColor }}>Your cart for this shop is empty.</p>
            )}

            {/* Go to Shop Cart link */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link 
                to={`/shop/${id}/cart`} 
                onClick={() => setShowCartModal(false)}
                style={{ 
                  textDecoration: 'none', background: primaryColor, color: 'white', 
                  padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem',
                  display: 'inline-block', transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                View Shop Cart →
              </Link>
            </div>
          </div>
        </div>
      )}

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
              background: 'transparent', border: 'none', cursor: 'pointer', color: textColor
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: primaryColor, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={24} /> Complete Your Order
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontWeight: '700', color: textColor }}>{selectedProductForCheckout?.name}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: textColor, opacity: 0.8 }}>Quantity: {getQuantity(checkoutProductIdx)}</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: primaryColor }}>Total: LKR {(selectedProductForCheckout?.price * getQuantity(checkoutProductIdx)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setDeliveryType('shop_pickup')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                        background: deliveryType === 'shop_pickup' ? primaryColor : 'transparent',
                        color: deliveryType === 'shop_pickup' ? 'white' : primaryColor,
                        border: `2px solid ${primaryColor}`
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
                        border: `2px solid ${primaryColor}`
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
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'rgba(255,255,255,0.5)' }} 
                        placeholder="Enter your name"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Contact Number</label>
                    <input 
                        type="text" 
                        value={deliveryDetails.customer_phone} 
                        onChange={e => setDeliveryDetails({...deliveryDetails, customer_phone: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'rgba(255,255,255,0.5)' }} 
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
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'rgba(255,255,255,0.5)' }} 
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
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'rgba(255,255,255,0.5)' }} 
                                    placeholder="Colombo"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', color: textColor, fontSize: '0.85rem', fontWeight: '700' }}>Zip Code</label>
                                <input 
                                    type="text" 
                                    value={deliveryDetails.zip_code} 
                                    onChange={e => setDeliveryDetails({...deliveryDetails, zip_code: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${primaryColor}44`, background: 'rgba(255,255,255,0.5)' }} 
                                    placeholder="00100"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={submitOrder}
                disabled={orderLoading === true}
                style={{ 
                    width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer',
                    background: orderLoading === true ? '#ccc' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, 
                    color: 'white', border: 'none', fontSize: '1rem'
                }}
            >
                {orderLoading === true ? 'Processing...' : 'Confirm Order'}
            </button>
          </div>
        </div>
      )}

      {/* AR MODAL */}
      {showArModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: backgroundColor, width: '100%', maxWidth: '900px', 
            height: '85vh', padding: '1.5rem',
            position: 'relative', borderRadius: '20px',
            display: 'flex', flexDirection: 'column'
          }}>
            <button onClick={() => setShowArModal(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', color: textColor,
              borderRadius: '50%', padding: '8px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: primaryColor, marginBottom: '1rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={24} /> Interactive 3D Preview
            </h2>
            <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', background: '#f8fafc', position: 'relative', border: `1px solid ${primaryColor}33` }}>
               {activeArModelUrl && <ARViewer modelUrl={activeArModelUrl} />}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopView;
