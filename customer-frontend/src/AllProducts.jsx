import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, ArrowRight, ShoppingBag, ClipboardList, ShoppingCart, Compass, Menu, X, User } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState(null);
  const [deliveryType, setDeliveryType] = useState('shop_pickup');
  const [deliveryDetails, setDeliveryDetails] = useState({
    customer_name: '', customer_phone: '', address_line: '', city: '', zip_code: ''
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

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
    const fetchShops = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/public/shops`);
        if (response.data.success) {
          setShops(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching shops:", err);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/products`);
        if (response.data.success) {
          setProducts(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      setOrderStatus({ type: 'error', text: 'Please sign in to add to cart.' });
      setTimeout(() => setOrderStatus(null), 3000);
      return;
    }
    
    const shop = shops.find(s => s.vendor_id == product.vendor_id);
    const shop_id = shop ? shop.id : product.vendor_id;

    try {
      const response = await axios.post(`${GATEWAY_URL}/cart`, {
        vendor_id: product.vendor_id,
        shop_id: shop_id,
        product_id: product.name,
        quantity: 1,
        unit_price: product.price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrderStatus({ type: 'success', text: `Added ${product.name} to cart!` });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart.';
      setOrderStatus({ type: 'error', text: msg });
    } finally {
      setTimeout(() => setOrderStatus(null), 3000);
    }
  };

  const handleOrder = async (product) => {
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
    setShowCheckoutModal(true);
  };

  const submitOrder = async () => {
    const token = localStorage.getItem('token');
    setOrderLoading(true);

    const shop = shops.find(s => s.vendor_id == selectedProductForCheckout.vendor_id);
    const shop_id = shop ? shop.id : selectedProductForCheckout.vendor_id;

    try {
      const response = await axios.post(`${GATEWAY_URL}/orders`, {
        vendor_id: selectedProductForCheckout.vendor_id,
        shop_id: shop_id,
        product_id: selectedProductForCheckout.name,
        quantity: 1,
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
        setOrderStatus({ type: 'success', text: `Order placed for ${selectedProductForCheckout.name} — LKR ${total}` });
        setShowCheckoutModal(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order.';
      setOrderStatus({ type: 'error', text: msg });
    } finally {
      setOrderLoading(false);
      setTimeout(() => setOrderStatus(null), 4000);
    }
  };

  const filteredProducts = products.filter(product => {
    const query = searchTerm.toLowerCase();
    const matchesName = product.name?.toLowerCase().includes(query);
    const matchesCategory = product.category?.toLowerCase().includes(query);
    return matchesName || matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Loading all products...</p>
      </div>
    );
  }

  return (
    <div className="listing-page" style={{ minHeight: '100vh', width: '100%' }}>
      {/* GLOBAL NAVBAR */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <ShoppingBag size={28} style={{ color: '#f97316' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#451a03', margin: 0 }}>SME Marketplace</h2>
          </Link>
        </div>

        {isMobile ? (
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#451a03', padding: '5px' }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/shops" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#fef3c7';
                e.currentTarget.style.color = '#f97316';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#451a03';
              }}
            >
              Shops
            </Link>
            <Link to="/products" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#fef3c7';
                e.currentTarget.style.color = '#f97316';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#451a03';
              }}
            >
              Products
            </Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/cart" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#451a03';
                  }}
                >
                  <ShoppingCart size={18} /> Cart
                </Link>

                <Link to="/orders" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#451a03';
                  }}
                >
                  <ClipboardList size={18} /> My Orders
                </Link>
                <Link to="/discover" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#451a03';
                  }}
                >
                  <Compass size={18} /> Discover
                </Link>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>Welcome back,</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#451a03', fontWeight: '800' }}>{user.name}</p>
                </div>

                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: '#fef3c7', 
                    border: '1px solid #fbbf24', 
                    color: '#92400e', 
                    padding: '8px 16px', 
                    borderRadius: '10px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>
                Sign In
              </Link>
            )}
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
          <Link to="/shops" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
            <Compass size={18} /> Shops
          </Link>
          <Link to="/products" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
            <Compass size={18} /> Products
          </Link>
          {user ? (
            <>
              <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #fef3c7' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', fontWeight: '600' }}>Welcome back,</p>
                <p style={{ margin: 0, fontSize: '1rem', color: '#451a03', fontWeight: '800' }}>{user.name}</p>
              </div>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
                <ShoppingCart size={18} /> Cart
              </Link>
              <Link to="/orders" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
                <ClipboardList size={18} /> My Orders
              </Link>
              <Link to="/discover" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
                <Compass size={18} /> Discover
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
            </>
          ) : (
            <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="btn-primary" style={{ textDecoration: 'none', padding: '12px', fontSize: '0.95rem', textAlign: 'center' }}>
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* GLOBAL TOAST NOTIFICATION */}
      {orderStatus && (
        <div className="animate-fade-in" style={{ 
          position: 'fixed', bottom: isMobile ? '1rem' : '2rem', right: isMobile ? '1rem' : '2rem', left: isMobile ? '1rem' : 'auto',
          background: orderStatus.type === 'error' ? '#ef4444' : '#f97316', 
          color: 'white', padding: '1rem 2rem', borderRadius: '12px', 
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 2000,
          fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '500px'
        }}>
          <ShoppingCart size={20} /> {orderStatus.text}
        </div>
      )}

      {/* CONTENT CONTAINER */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* HEADER & SEARCH BAR */}
        <header style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem', marginTop: isMobile ? '1rem' : '2rem' }}>
          <h1 style={{ fontSize: isMobile ? '2.25rem' : '3.5rem', fontWeight: '800', color: '#451a03', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
            All Products
          </h1>
          <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#92400e', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem', padding: '0 10px' }}>
            Discover and search unique items from our global SME catalog.
          </p>
          
          {/* Live Search Input */}
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', padding: '0 10px', boxSizing: 'border-box' }}>
            <input
              type="text"
              placeholder="Search by product name or category (e.g. fashion, food)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 48px',
                borderRadius: '30px',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                background: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'Outfit, sans-serif',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f97316';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(249, 115, 22, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
              }}
            />
            <Compass size={20} style={{ position: 'absolute', left: '26px', top: '16px', color: '#f97316' }} />
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
            <ShoppingBag size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* PRODUCT GRID */}
        {!error && (
          <section>
            <div className="product-grid" style={{ padding: '0' }}>
              {filteredProducts.length > 0 ? filteredProducts.map((product, idx) => (
                <div key={idx} className="glass-card" style={{ 
                    padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                    transition: 'all 0.3s ease' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ height: '220px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', overflow: 'hidden' }}>
                    {(product.image || product.extra_data?.image) ? (
                      <img 
                        src={product.image || product.extra_data?.image} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <Package size={64} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>{product.name}</h4>
                    <span style={{ fontSize: '0.85rem', background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: '8px', fontWeight: '700' }}>{product.category}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f97316' }}>LKR {parseFloat(product.price || 0).toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleAddToCart(product)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '2px solid #f97316', color: '#f97316', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f9731611'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Add to Cart</button>
                      <button onClick={() => handleOrder(product)} style={{ flex: 1, padding: '10px', background: '#f97316', border: 'none', color: 'white', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>Buy Now</button>
                    </div>
                    <Link to={`/shop/${shops.find(s => s.vendor_id == product.vendor_id)?.id || product.vendor_id}`} style={{ textAlign: 'center', background: '#451a03', color: 'white', textDecoration: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>View Shop</Link>
                  </div>
                </div>
              )) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem' }}>
                  <ShoppingBag size={80} style={{ color: '#fbbf24', opacity: 0.3, marginBottom: '2rem' }} />
                  <h2 style={{ color: '#92400e', fontWeight: '800' }}>No matching products found.</h2>
                  <p style={{ color: '#92400e', opacity: 0.7 }}>Try adjusting your search keywords</p>
                </div>
              )}
            </div>
          </section>
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
            background: 'white', width: '95%', maxWidth: '500px', 
            maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem',
            position: 'relative', borderRadius: '24px', boxSizing: 'border-box'
          }}>
            <button onClick={() => setShowCheckoutModal(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#451a03'
            }}>
              <X size={24} />
            </button>
            <h2 style={{ color: '#f97316', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem', fontWeight: '900' }}>
              <Package size={28} /> Complete Order
            </h2>
            
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '16px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '800', color: '#451a03', fontSize: '1.2rem' }}>{selectedProductForCheckout?.name}</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#f97316' }}>Total: LKR {(selectedProductForCheckout?.price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => setDeliveryType('shop_pickup')} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', background: deliveryType === 'shop_pickup' ? '#f97316' : 'transparent', color: deliveryType === 'shop_pickup' ? 'white' : '#f97316', border: `2px solid #f97316`, transition: 'all 0.2s' }}>Shop Pickup</button>
                <button onClick={() => setDeliveryType('home_delivery')} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', background: deliveryType === 'home_delivery' ? '#f97316' : 'transparent', color: deliveryType === 'home_delivery' ? 'white' : '#f97316', border: `2px solid #f97316`, transition: 'all 0.2s' }}>Home Delivery</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Full Name</label>
                    <input type="text" value={deliveryDetails.customer_name} onChange={e => setDeliveryDetails({...deliveryDetails, customer_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', boxSizing: 'border-box' }} placeholder="Enter your name" />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Phone Number</label>
                    <input type="tel" value={deliveryDetails.customer_phone} onChange={e => setDeliveryDetails({...deliveryDetails, customer_phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', boxSizing: 'border-box' }} placeholder="e.g. 0771234567" />
                </div>
                {deliveryType === 'home_delivery' && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Address</label>
                            <input type="text" value={deliveryDetails.address_line} onChange={e => setDeliveryDetails({...deliveryDetails, address_line: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', boxSizing: 'border-box' }} placeholder="Street address" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>City</label>
                                <input type="text" value={deliveryDetails.city} onChange={e => setDeliveryDetails({...deliveryDetails, city: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', boxSizing: 'border-box' }} placeholder="City" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Zip Code</label>
                                <input type="text" value={deliveryDetails.zip_code} onChange={e => setDeliveryDetails({...deliveryDetails, zip_code: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', boxSizing: 'border-box' }} placeholder="Zip" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={submitOrder} 
                disabled={orderLoading || !deliveryDetails.customer_name || !deliveryDetails.customer_phone || (deliveryType === 'home_delivery' && (!deliveryDetails.address_line || !deliveryDetails.city))}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #eab308)', color: 'white', border: 'none', fontWeight: '800', fontSize: '1.1rem', cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: (orderLoading || !deliveryDetails.customer_name) ? 0.7 : 1, boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)', transition: 'all 0.2s', boxSizing: 'border-box' }}
            >
                {orderLoading ? 'Processing Order...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProducts;
