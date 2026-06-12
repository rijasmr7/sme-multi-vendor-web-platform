import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Package, ChevronLeft, Clock, CheckCircle, XCircle, Filter, ShoppingBag, Loader2, AlertCircle, Menu, X } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const STATUS_CONFIG = {
  pending:   { color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={14} />,       label: 'Pending' },
  confirmed: { color: '#3b82f6', bg: '#dbeafe', icon: <CheckCircle size={14} />, label: 'Confirmed' },
  completed: { color: '#22c55e', bg: '#dcfce7', icon: <CheckCircle size={14} />, label: 'Completed' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={14} />,     label: 'Cancelled' },
};

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [payingOrderId, setPayingOrderId] = useState(null);

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
    // Fetch shops to map vendor_id to shop names
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
    fetchShops();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('customer');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user, filterStatus]);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    setLoading(true);
    try {
      let url = `${GATEWAY_URL}/orders/customer/${user.id}`;
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setPayingOrderId(orderId);
    try {
      const response = await axios.put(`${GATEWAY_URL}/orders/${orderId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error paying for order:', err);
      alert('Failed to process payment. Please try again.');
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    window.location.href = '/';
  };

  // Not logged in state
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <ShoppingBag size={48} style={{ color: '#f97316', marginBottom: '1rem' }} />
          <h2 style={{ color: '#451a03', marginBottom: '0.5rem' }}>Sign in to view orders</h2>
          <p style={{ color: '#92400e', marginBottom: '1.5rem' }}>You need to be logged in to see your order history.</p>
          <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page" style={{ minHeight: '100vh', background: '#fffbeb', width: '100%' }}>
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
            <Package size={isMobile ? 18 : 22} /> My Orders
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

      {/* CONTENT */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* HEADER + FILTER */}
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>
            Order History
          </h1>
          <p style={{ color: '#92400e', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Track and manage all your orders in one place.
          </p>

          {/* Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: filterStatus === status ? '2px solid #f97316' : '1px solid #fbbf2444',
                  background: filterStatus === status ? '#f97316' : 'rgba(255,255,255,0.7)',
                  color: filterStatus === status ? 'white' : '#92400e',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                {status === 'all' ? <Filter size={14} /> : STATUS_CONFIG[status]?.icon}
                {status === 'all' ? 'All Orders' : STATUS_CONFIG[status]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={32} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#92400e', marginTop: '1rem', fontWeight: '600' }}>Loading your orders...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && (
          <>
            {orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order, idx) => {
                  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={order.id}
                      className="glass-card animate-fade-in"
                      style={{
                        padding: '1.5rem',
                        animationDelay: `${idx * 0.05}s`,
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--glass-border)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px rgba(249,115,22,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    >
                      {/* Top Row: Order ID + Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: `${sc.bg}`, padding: '10px', borderRadius: '12px' }}>
                            <Package size={20} style={{ color: sc.color }} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#451a03' }}>Order #{order.id}</p>
                                <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '100px', fontWeight: '700' }}>
                                    {shops.find(s => s.vendor_id == order.vendor_id)?.shopName || `Shop #${order.vendor_id}`}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', opacity: 0.7 }}>
                              {new Date(order.created_at).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: sc.bg,
                          color: sc.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        padding: '1rem',
                        background: '#fef9ee',
                        borderRadius: '12px'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#92400e', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Product ID</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#451a03' }}>{order.product_id}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#92400e', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Quantity</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#451a03' }}>{order.quantity}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#92400e', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Unit Price</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#451a03' }}>LKR {parseFloat(order.unit_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#92400e', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Total</p>
                          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#f97316' }}>LKR {parseFloat(order.total_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button
                            onClick={() => handlePayNow(order.id)}
                            disabled={payingOrderId === order.id}
                            style={{
                              background: '#f97316',
                              color: 'white',
                              border: 'none',
                              padding: '8px 20px',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: payingOrderId === order.id ? 'default' : 'pointer',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              opacity: payingOrderId === order.id ? 0.7 : 1,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
                              fontFamily: 'Outfit, sans-serif'
                            }}
                            onMouseEnter={e => { if (payingOrderId !== order.id) e.currentTarget.style.background = '#ea580c'; }}
                            onMouseLeave={e => { if (payingOrderId !== order.id) e.currentTarget.style.background = '#f97316'; }}
                          >
                            {payingOrderId === order.id ? (
                              <>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Processing...
                              </>
                            ) : (
                              'Pay Now'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                <ShoppingBag size={64} style={{ color: '#fbbf24', opacity: 0.5, marginBottom: '1rem' }} />
                <h3 style={{ color: '#451a03', marginBottom: '0.5rem' }}>
                  {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
                </h3>
                <p style={{ color: '#92400e', marginBottom: '1.5rem' }}>
                  {filterStatus === 'all'
                    ? 'Start shopping to see your orders here!'
                    : 'Try a different filter to see other orders.'}
                </p>
                <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  Browse Shops
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CustomerOrders;
