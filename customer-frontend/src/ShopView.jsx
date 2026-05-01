import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ShoppingCart, Package, Info, Mail, Star, Phone, Menu, X } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const ShopView = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);

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
        const response = await axios.get(`${GATEWAY_URL}/public/shops/${id}`);
        if (response.data.success) {
          setShop(response.data.data);
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

  const handleOrder = (productName) => {
    setOrderStatus(`Order placed for ${productName}!`);
    setTimeout(() => setOrderStatus(null), 3000);
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

          {/* Cart Icon */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <ShoppingCart size={24} style={{ color: textColor }} />
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: primaryColor, color: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>0</div>
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
            background: primaryColor, 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '12px', 
            boxShadow: `0 10px 15px -3px ${primaryColor}66`,
            zIndex: 2000,
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShoppingCart size={20} /> {orderStatus}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: primaryColor }}>${product.price || '9.99'}</span>
                  <span style={{ fontSize: '0.75rem', background: `${primaryColor}22`, color: primaryColor, padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>In Stock</span>
                </div>
                
                {product.description && (
                  <p style={{ fontSize: '0.85rem', color: textColor, marginBottom: '1.25rem', lineHeight: '1.5', opacity: 0.7 }}>
                    {product.description}
                  </p>
                )}
                
                <button 
                  onClick={() => handleOrder(product.name)}
                  className="btn-primary" 
                  style={{ width: '100%', background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, border: 'none' }}
                >
                  <ShoppingCart size={18} /> Order Now
                </button>
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
    </div>
  );
};

export default ShopView;
