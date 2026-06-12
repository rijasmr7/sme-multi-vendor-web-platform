import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, ArrowRight, ShoppingBag, ClipboardList, ShoppingCart, Compass, Menu, X, User } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const AllShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
        setError("Unable to load shops. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filteredShops = shops.filter(shop => {
    const query = searchTerm.toLowerCase();
    const matchesName = shop.shopName?.toLowerCase().includes(query);
    const matchesNav = shop.navigation?.some(nav => nav.toLowerCase().includes(query));
    return matchesName || matchesNav;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Loading all shops...</p>
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

      {/* CONTENT CONTAINER */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* HEADER & SEARCH BAR */}
        <header style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem', marginTop: isMobile ? '1rem' : '2rem' }}>
          <h1 style={{ fontSize: isMobile ? '2.25rem' : '3.5rem', fontWeight: '800', color: '#451a03', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
            All Storefronts
          </h1>
          <p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#92400e', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem', padding: '0 10px' }}>
            Discover and search unique local businesses on our platform.
          </p>
          
          {/* Live Search Input */}
          <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', padding: '0 10px', boxSizing: 'border-box' }}>
            <input
              type="text"
              placeholder="Search by store name or category (e.g. fashion, food)..."
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

        {/* SHOP GRID */}
        {!error && (
          <section>
            <div className="shop-grid" style={{ padding: '0' }}>
              {filteredShops.length > 0 ? filteredShops.map((shop, idx) => (
                <Link to={`/shop/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                  <div className="glass-card animate-fade-in" style={{ 
                    padding: '2.5rem', 
                    height: '100%', 
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animationDelay: `${idx * 0.05}s`,
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
                  <h2 style={{ color: '#92400e', fontWeight: '800' }}>No matching storefronts found.</h2>
                  <p style={{ color: '#92400e', opacity: 0.7 }}>Try adjusting your search keywords</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AllShops;
