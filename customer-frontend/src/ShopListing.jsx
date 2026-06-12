import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, ArrowRight, Sparkles, ShoppingBag, ClipboardList, ShoppingCart, Package, X, Compass, MapPin, TrendingUp, Brain, Users, Menu, User } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const ShopListing = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [hasFetchedRecs, setHasFetchedRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState(null);
  const [deliveryType, setDeliveryType] = useState('shop_pickup');
  const [deliveryDetails, setDeliveryDetails] = useState({
    customer_name: '', customer_phone: '', address_line: '', city: '', zip_code: ''
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
    // Check if user is logged in
    const storedUser = localStorage.getItem('customer');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    setUser(null);
    window.location.reload(); // Refresh to clear state
  };

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/public/shops`);
        if (response.data.success) {
          let loadedShops = response.data.data;
          try {
            const statsRes = await axios.get(`${GATEWAY_URL}/public/orders/stats/shops`);
            if (statsRes.data.success) {
              const statsMap = {};
              statsRes.data.data.forEach(stat => {
                statsMap[stat.shop_id] = parseInt(stat.order_count) || 0;
              });
              loadedShops = loadedShops.sort((a, b) => {
                const countA = statsMap[a.id] || 0;
                const countB = statsMap[b.id] || 0;
                return countB - countA;
              });
            }
          } catch (statsErr) {
            console.warn("Could not fetch shop order stats, fallback to default order:", statsErr);
          }
          setShops(loadedShops);
        }
      } catch (err) {
        console.error("Error fetching shops:", err);
        setError("Unable to load shops. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/products`);
        if (response.data.success) {
          let loadedProducts = response.data.data;
          try {
            const statsRes = await axios.get(`${GATEWAY_URL}/public/orders/stats/products`);
            if (statsRes.data.success) {
              const statsMap = {};
              statsRes.data.data.forEach(stat => {
                statsMap[stat.product_id] = parseInt(stat.order_count) || 0;
              });
              loadedProducts = loadedProducts.sort((a, b) => {
                const countA = statsMap[a.name] || 0;
                const countB = statsMap[b.name] || 0;
                return countB - countA;
              });
            }
          } catch (statsErr) {
            console.warn("Could not fetch product order stats, fallback to default order:", statsErr);
          }
          setProducts(loadedProducts);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchShops();
    fetchProducts();
  }, []);

  // Resolve user location and track homepage view on load
  useEffect(() => {
    const resolveAndTrackLocation = async () => {
      let lat = 6.9271;
      let lng = 79.8612;
      
      try {
        if (navigator.geolocation) {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 300000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch (locErr) {
        console.warn("Location permission denied or unavailable, using Colombo fallback:", locErr.message);
      }
      
      const loc = { latitude: lat, longitude: lng };
      localStorage.setItem('customerLocation', JSON.stringify(loc));
      
      // Track homepage view event in Analytics Service
      axios.post(`http://localhost:5003/events/test`, {
        event_type: 'homepage_view',
        user_id: localStorage.getItem('customer') ? String(JSON.parse(localStorage.getItem('customer')).id) : null,
        latitude: lat,
        longitude: lng
      }).catch(err => console.error("Failed to track homepage view event:", err));
    };
    
    resolveAndTrackLocation();
  }, []);

  // Fetch hybrid recommendations using browser geolocation + AI
  const fetchHybridRecommendations = useCallback(async () => {
    if (!user || products.length === 0) return;
    
    setRecsLoading(true);
    setRecsError(null);
    try {
      let lat = 6.9271;
      let lng = 79.8612;
      
      const cached = localStorage.getItem('customerLocation');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          lat = parsed.latitude;
          lng = parsed.longitude;
        } catch (e) {}
      } else {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 300000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (locErr) {
          console.warn("Location unavailable, using content-only recommendations:", locErr.message);
        }
      }

      const response = await axios.get(`${GATEWAY_URL}/recommend/location-aware`, {
        params: {
          user_id: user.id,
          latitude: lat,
          longitude: lng
        }
      });
      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || []);
      }
    } catch (err) {
      console.error("Error fetching hybrid recommendations:", err);
      setRecsError("Failed to connect to recommendation service. The model might still be loading.");
    } finally {
      setRecsLoading(false);
      setHasFetchedRecs(true);
    }
  }, [user, products]);
  
  useEffect(() => {
    if (user && products.length > 0) {
      fetchHybridRecommendations();
    }
  }, [user, products, fetchHybridRecommendations]);

  const trackRecommendationClick = (rec) => {
    let lat = null, lon = null;
    try {
      const cached = localStorage.getItem('customerLocation');
      if (cached) {
        const parsed = JSON.parse(cached);
        lat = parsed.latitude;
        lon = parsed.longitude;
      }
    } catch (e) {}

    axios.post(`http://localhost:5003/events/test`, {
      event_type: 'recommendation_clicked',
      vendor_id: String(rec.vendor_id),
      product_id: String(rec.name),
      user_id: user ? String(user.id) : null,
      latitude: lat,
      longitude: lon
    }).catch(err => console.error("Failed to track recommendation click:", err));
  };

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Fetching the best shops for you...</p>
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
          <ShoppingBag size={28} style={{ color: '#f97316' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#451a03', margin: 0 }}>SME Marketplace</h2>
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
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>Welcome back,</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#451a03', fontWeight: '800' }}>{user.name}</p>
                </div>
                
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
                <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#451a03', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s', padding: '8px 12px', borderRadius: '10px' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.color = '#f97316';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#451a03';
                  }}
                >
                  <User size={18} /> Profile
                </Link>
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
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: '#451a03', fontWeight: '700', padding: '10px 12px', borderRadius: '10px', background: '#fef3c7' }}>
                <User size={18} /> Profile
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem', marginTop: isMobile ? '1rem' : '2rem' }} className="animate-fade-in">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(251, 191, 36, 0.2)', padding: '8px 20px', borderRadius: '100px', color: '#92400e', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <Sparkles size={18} />
          <span>Curated for You</span>
        </div>
        <h1 style={{ fontSize: isMobile ? '2.25rem' : '3.5rem', fontWeight: '800', color: '#451a03', marginBottom: '1rem', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
          Explore Local <span style={{ color: '#f97316' }}>SME</span> Shops
        </h1>
        <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#92400e', maxWidth: '600px', margin: '0 auto', padding: '0 10px' }}>
          Discover unique products from verified local vendors, all powered by our intelligent AI platform.
        </p>
      </header>

      {error ? (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* SHOPS SECTION */}
          <section style={{ marginBottom: isMobile ? '4rem' : '8rem' }}>
            <div style={{ marginBottom: isMobile ? '1.5rem' : '3rem', textAlign: isMobile ? 'center' : 'left' }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '900', color: '#451a03', margin: 0, letterSpacing: '-0.03em' }}>
                Verified <span style={{ color: '#f97316' }}>SME</span> Shops
              </h2>
              <p style={{ color: '#92400e', opacity: 0.7, fontWeight: '600', marginTop: '0.5rem' }}>Browse curated local businesses near you</p>
            </div>
            
            <div className="shop-grid" style={{ padding: '0' }}>
              {shops.length > 0 ? shops.slice(0, 6).map((shop, idx) => (
                <Link to={`/shop/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                  <div className="glass-card animate-fade-in" style={{ 
                    padding: '2.5rem', 
                    height: '100%', 
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animationDelay: `${idx * 0.1}s`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(251, 191, 36, 0.1)',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(249, 115, 22, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.1)';
                  }}
                  >
                    <div style={{ 
                      position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', 
                      background: `linear-gradient(135deg, ${shop.theme?.primary || '#f97316'}15, ${shop.theme?.secondary || '#eab308'}15)`,
                      borderRadius: '50%', zIndex: 0
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '72px', height: '72px', background: `linear-gradient(135deg, ${shop.theme?.primary || '#f97316'}, ${shop.theme?.secondary || '#eab308'})`, 
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '2rem',
                        boxShadow: '0 12px 24px -6px rgba(249, 115, 22, 0.3)'
                      }}>
                        <Store size={36} />
                      </div>
                      <h3 style={{ fontSize: '1.75rem', fontWeight: '850', color: '#451a03', marginBottom: '0.75rem' }}>{shop.shopName}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {shop.navigation?.slice(0, 3).map((nav, i) => (
                          <span key={i} style={{ fontSize: '0.8rem', background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '100px', fontWeight: '700' }}>{nav}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                      <span style={{ fontSize: '0.95rem', color: '#92400e', fontWeight: '700' }}>{shop.products?.length || 0} Products</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: shop.theme?.primary || '#f97316', fontWeight: '800' }}>
                        Visit <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              )) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem' }}>
                  <ShoppingBag size={80} style={{ color: '#fbbf24', opacity: 0.3, marginBottom: '2rem' }} />
                  <h2 style={{ color: '#92400e', fontWeight: '800' }}>No published shops found.</h2>
                </div>
              )}
            </div>

            {shops.length > 6 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <Link 
                  to="/shops" 
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #f97316, #eab308)',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '30px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(249, 115, 22, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(249, 115, 22, 0.2)';
                  }}
                >
                  View More Storefronts <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </section>

          {/* HYBRID AI + LOCATION RECOMMENDATIONS SECTION */}
          {user && (
            <section style={{ 
              marginBottom: isMobile ? '4rem' : '8rem', padding: isMobile ? '2rem 1.25rem' : '4rem', 
              background: 'linear-gradient(165deg, #fffcf0 0%, #fff 100%)', 
              borderRadius: isMobile ? '24px' : '48px', border: '1px solid #fef3c7',
              boxShadow: '0 20px 40px -20px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: isMobile ? '2rem' : '4rem' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '20px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #f97316, #eab308)', padding: '14px', borderRadius: '20px', color: 'white', boxShadow: '0 15px 30px rgba(249, 115, 22, 0.3)' }}>
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '900', color: '#451a03', margin: 0, letterSpacing: '-0.03em' }}>AI Recommended for You</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#92400e', fontWeight: '600' }}>Hybrid intelligence: Content + Collaborative + Location + Trending</p>
                  </div>
                </div>
              </div>

              {recsLoading ? (
                 <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#f97316', fontWeight: '700' }}>Running hybrid recommendation engine...</p>
                 </div>
              ) : !hasFetchedRecs ? (
                 <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#f97316', fontWeight: '700' }}>Loading your recommendations...</p>
                 </div>
              ) : recsError ? (
                 <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px dashed #f87171' }}>
                    <p style={{ color: '#ef4444', fontWeight: '700', marginBottom: '1.25rem' }}>{recsError}</p>
                    <button 
                      onClick={fetchHybridRecommendations} 
                      style={{ 
                        background: '#f97316', border: 'none', color: 'white', padding: '10px 20px', 
                        borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                      onMouseOut={e => e.currentTarget.style.opacity = 1}
                    >
                      Retry Loading
                    </button>
                 </div>
              ) : recommendations.length > 0 ? (
                 <div className="shop-grid" style={{ padding: '0' }}>
                   {recommendations.slice(0, 3).map((rec, idx) => (
                     <div key={idx} className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(251, 191, 36, 0.3)', position: 'relative', background: 'white' }}>
                       <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 16px', background: 'linear-gradient(135deg, #f97316, #eab308)', color: 'white', fontSize: '0.75rem', fontWeight: '900', borderRadius: '0 0 0 16px' }}>HYBRID AI</div>
                       <h4 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#451a03', marginBottom: '1.25rem' }}>{rec.name}</h4>
                       
                       <div style={{ background: '#f9731608', borderLeft: '4px solid #f97316', padding: '16px', borderRadius: '0 12px 12px 0', marginBottom: '1.25rem', fontSize: '1rem', color: '#451a03', fontStyle: 'italic', lineHeight: '1.6' }}>
                         "{rec.ai_explanation}"
                       </div>

                       {/* Score Breakdown Badges */}
                       {rec.score_breakdown && (
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: '#dbeafe', color: '#1e40af' }}>
                             <Brain size={12} /> Content {(rec.score_breakdown.content * 100).toFixed(0)}%
                           </span>
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: '#f3e8ff', color: '#7c3aed' }}>
                             <Users size={12} /> Collab {(rec.score_breakdown.collaborative * 100).toFixed(0)}%
                           </span>
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: '#dcfce7', color: '#15803d' }}>
                             <MapPin size={12} /> Nearby {(rec.score_breakdown.location * 100).toFixed(0)}%
                           </span>
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: '#fef3c7', color: '#92400e' }}>
                             <TrendingUp size={12} /> Trend {(rec.score_breakdown.realtime * 100).toFixed(0)}%
                           </span>
                         </div>
                       )}

                       <div style={{ marginBottom: '1rem', borderBottom: '1px solid #fef3c7', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#f97316' }}>LKR {parseFloat(rec.price || 0).toLocaleString()}</span>
                         {rec.score_breakdown && (
                           <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#92400e', background: '#fef3c7', padding: '4px 12px', borderRadius: '100px' }}>
                             Score: {(rec.score_breakdown.final * 100).toFixed(1)}%
                           </span>
                         )}
                       </div>

                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <div style={{ display: 'flex', gap: '8px' }}>
                           <button onClick={() => { trackRecommendationClick(rec); handleAddToCart(rec); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: '2px solid #f97316', color: '#f97316', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f9731611'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Add to Cart</button>
                           <button onClick={() => { trackRecommendationClick(rec); handleOrder(rec); }} style={{ flex: 1, padding: '10px', background: '#f97316', border: 'none', color: 'white', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>Buy Now</button>
                         </div>
                         <Link to={`/shop/${shops.find(s => s.vendor_id == rec.vendor_id)?.id || rec.vendor_id}`} onClick={() => trackRecommendationClick(rec)} style={{ textAlign: 'center', background: '#451a03', color: 'white', textDecoration: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>View Shop</Link>
                       </div>
                     </div>
                   ))}
                 </div>
              ) : (
                 <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(0,0,0,0.02)', borderRadius: '24px' }}>
                     <p style={{ color: '#92400e', fontWeight: '600' }}>Keep exploring products to unlock personalized recommendations!</p>
                 </div>
              )}
            </section>
          )}

          {/* ALL PRODUCTS SECTION */}
          <section style={{ marginBottom: isMobile ? '2.5rem' : '4rem' }}>
            <div style={{ marginBottom: isMobile ? '1.5rem' : '3rem', textAlign: isMobile ? 'center' : 'left' }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '900', color: '#451a03', margin: 0, letterSpacing: '-0.03em' }}>Explore All Products</h2>
              <p style={{ color: '#92400e', opacity: 0.7, fontWeight: '600', marginTop: '0.5rem' }}>Discovery unique items from our global SME catalog</p>
            </div>

            <div className="product-grid" style={{ padding: '0' }}>
              {products.length > 0 ? products.slice(0, 6).map((product, idx) => (
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
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '4rem' }}>No products available yet.</p>
              )}
            </div>

            {products.length > 6 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <Link 
                  to="/products" 
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #f97316, #eab308)',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '30px',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    boxShadow: '0 10px 20px rgba(249, 115, 22, 0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(249, 115, 22, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(249, 115, 22, 0.2)';
                  }}
                >
                  View More Products <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </section>
        </>
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
            maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem',
            position: 'relative', borderRadius: '24px'
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
                    <input type="text" value={deliveryDetails.customer_name} onChange={e => setDeliveryDetails({...deliveryDetails, customer_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03' }} placeholder="Enter your name" />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Phone Number</label>
                    <input type="tel" value={deliveryDetails.customer_phone} onChange={e => setDeliveryDetails({...deliveryDetails, customer_phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03' }} placeholder="e.g. 0771234567" />
                </div>
                {deliveryType === 'home_delivery' && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Address</label>
                            <input type="text" value={deliveryDetails.address_line} onChange={e => setDeliveryDetails({...deliveryDetails, address_line: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03' }} placeholder="Street address" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>City</label>
                                <input type="text" value={deliveryDetails.city} onChange={e => setDeliveryDetails({...deliveryDetails, city: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03' }} placeholder="City" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#92400e', fontSize: '0.9rem', fontWeight: '700' }}>Zip Code</label>
                                <input type="text" value={deliveryDetails.zip_code} onChange={e => setDeliveryDetails({...deliveryDetails, zip_code: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid #fcd34d`, background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03' }} placeholder="Zip" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={submitOrder} 
                disabled={orderLoading || !deliveryDetails.customer_name || !deliveryDetails.customer_phone || (deliveryType === 'home_delivery' && (!deliveryDetails.address_line || !deliveryDetails.city))}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #eab308)', color: 'white', border: 'none', fontWeight: '800', fontSize: '1.1rem', cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: (orderLoading || !deliveryDetails.customer_name) ? 0.7 : 1, boxShadow: '0 10px 20px rgba(249, 115, 22, 0.3)', transition: 'all 0.2s' }}
            >
                {orderLoading ? 'Processing Order...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopListing;
