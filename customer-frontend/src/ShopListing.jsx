import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Store, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const ShopListing = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Fetching the best shops for you...</p>
      </div>
    );
  }

  return (
    <div className="listing-page" style={{ minHeight: '100vh' }}>
      {/* GLOBAL NAVBAR */}
      <nav className="glass-nav" style={{ 
        padding: '1rem 2rem', 
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
      </nav>

      <div style={{ padding: '2rem 1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }} className="animate-fade-in">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(251, 191, 36, 0.2)', padding: '8px 20px', borderRadius: '100px', color: '#92400e', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          <Sparkles size={18} />
          <span>Curated for You</span>
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', color: '#451a03', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
          Explore Local <span style={{ color: '#f97316' }}>SME</span> Shops
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#92400e', maxWidth: '600px', margin: '0 auto' }}>
          Discover unique products from verified local vendors, all powered by our intelligent AI platform.
        </p>
      </header>

      {error ? (
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
        </div>
      ) : (
        <div className="shop-grid">
          {shops.length > 0 ? shops.map((shop, idx) => (
            <Link to={`/shop/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
              <div className="glass-card animate-fade-in" style={{ 
                padding: '2rem', 
                height: '100%', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animationDelay: `${idx * 0.1}s`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(249, 115, 22, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              >
                {/* Decorative Element */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  right: '-20px', 
                  width: '100px', 
                  height: '100px', 
                  background: `linear-gradient(135deg, ${shop.theme?.primary || '#f97316'}22, ${shop.theme?.secondary || '#eab308'}22)`,
                  borderRadius: '50%',
                  zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: `linear-gradient(135deg, ${shop.theme?.primary || '#f97316'}, ${shop.theme?.secondary || '#eab308'})`, 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 16px rgba(249, 115, 22, 0.2)'
                  }}>
                    <Store size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>{shop.shopName}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                    {shop.navigation?.slice(0, 3).map((nav, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '100px', fontWeight: '600' }}>
                        {nav}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#92400e', fontWeight: '600' }}>
                    {shop.products?.length || 0} Products
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: shop.theme?.primary || '#f97316', fontWeight: '700', fontSize: '0.9rem' }}>
                    Visit Store <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
              <ShoppingBag size={64} style={{ color: '#fbbf24', opacity: 0.5, marginBottom: '1rem' }} />
              <h2 style={{ color: '#92400e' }}>No published shops found.</h2>
              <p style={{ color: '#92400e', opacity: 0.7 }}>Check back later for new local businesses!</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default ShopListing;
