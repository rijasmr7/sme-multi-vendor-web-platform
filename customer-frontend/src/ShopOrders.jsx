import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Package, ChevronLeft, Clock, CheckCircle, XCircle, Filter, ShoppingBag, Loader2, AlertCircle, Store } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const STATUS_CONFIG = {
  pending:   { color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={14} />,       label: 'Pending' },
  confirmed: { color: '#3b82f6', bg: '#dbeafe', icon: <CheckCircle size={14} />, label: 'Confirmed' },
  completed: { color: '#22c55e', bg: '#dcfce7', icon: <CheckCircle size={14} />, label: 'Completed' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={14} />,     label: 'Cancelled' },
};

function ShopOrders() {
  const { id } = useParams(); // shop id
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('customer');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch shop details for theme
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await axios.get(`${GATEWAY_URL}/public/shops/${id}`);
        if (response.data.success) {
          setShop(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching shop:", err);
      } finally {
        setShopLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  // Fetch & filter orders
  useEffect(() => {
    if (!user || !shop) return;
    fetchOrders();
  }, [user, shop, filterStatus]);

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
        // Filter to only this shop's vendor
        const filtered = response.data.data.filter(o => o.vendor_id == shop.vendor_id);
        setOrders(filtered);
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

  // Loading shop data
  if (shopLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        <p style={{ color: '#f97316', fontWeight: '600' }}>Loading store...</p>
      </div>
    );
  }

  // Theme colors from shop
  const primaryColor = shop?.theme?.primary || '#f97316';
  const secondaryColor = shop?.theme?.secondary || '#eab308';
  const textColor = shop?.theme?.text || '#451a03';
  const backgroundColor = shop?.theme?.background || '#ffffff';
  const accentColor = shop?.theme?.accent || '#c2410c';

  // Not logged in state
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: backgroundColor }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <ShoppingBag size={48} style={{ color: primaryColor, marginBottom: '1rem' }} />
          <h2 style={{ color: textColor, marginBottom: '0.5rem' }}>Sign in to view orders</h2>
          <p style={{ color: textColor, opacity: 0.7, marginBottom: '1.5rem' }}>You need to be logged in to see your order history.</p>
          <Link to="/auth" style={{ textDecoration: 'none', background: primaryColor, color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem' }}>Sign In</Link>
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
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', minWidth: 0 }}>
          <Link to={`/shop/${id}`} style={{ color: primaryColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
            <ChevronLeft size={20} /> {!isMobile && "Back to Shop"}
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              flexShrink: 0
            }}>
              <Store size={16} />
            </div>
            <h2 style={{ 
              fontSize: isMobile ? '0.95rem' : '1.1rem', 
              fontWeight: '800', 
              color: textColor, 
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? '100px' : 'none'
            }} title={`${shop?.shopName || 'Shop'} — Orders`}>
              {shop?.shopName || 'Shop'} — Orders
            </h2>
          </div>
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

      {/* CONTENT */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* HEADER + FILTER */}
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: textColor, marginBottom: '0.5rem' }}>
            Order History
          </h1>
          <p style={{ color: textColor, opacity: 0.7, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Your orders at <span style={{ fontWeight: '700', color: primaryColor }}>{shop?.shopName}</span>.
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
                  border: filterStatus === status ? `2px solid ${primaryColor}` : `1px solid ${primaryColor}33`,
                  background: filterStatus === status ? primaryColor : 'rgba(255,255,255,0.7)',
                  color: filterStatus === status ? 'white' : textColor,
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
            <Loader2 size={32} style={{ color: primaryColor, animation: 'spin 1s linear infinite' }} />
            <p style={{ color: textColor, opacity: 0.7, marginTop: '1rem', fontWeight: '600' }}>Loading your orders...</p>
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
                        border: `1px solid ${primaryColor}22`
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 10px 25px ${primaryColor}22`}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    >
                      {/* Top Row: Order ID + Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: `${sc.bg}`, padding: '10px', borderRadius: '12px' }}>
                            <Package size={20} style={{ color: sc.color }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: textColor }}>Order #{order.id}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: textColor, opacity: 0.7 }}>
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
                        background: `${primaryColor}08`,
                        borderRadius: '12px'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: textColor, opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Product</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: textColor }}>{order.product_id}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: textColor, opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Quantity</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: textColor }}>{order.quantity}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: textColor, opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Unit Price</p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: textColor }}>LKR {parseFloat(order.unit_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: textColor, opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Total</p>
                          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: primaryColor }}>LKR {parseFloat(order.total_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                          <button
                            onClick={() => handlePayNow(order.id)}
                            disabled={payingOrderId === order.id}
                            style={{
                              background: primaryColor,
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
                              boxShadow: `0 4px 12px ${primaryColor}33`,
                              fontFamily: 'Outfit, sans-serif'
                            }}
                            onMouseEnter={e => { if (payingOrderId !== order.id) e.currentTarget.style.filter = 'brightness(90%)'; }}
                            onMouseLeave={e => { if (payingOrderId !== order.id) e.currentTarget.style.filter = 'none'; }}
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
                <ShoppingBag size={64} style={{ color: primaryColor, opacity: 0.4, marginBottom: '1rem' }} />
                <h3 style={{ color: textColor, marginBottom: '0.5rem' }}>
                  {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
                </h3>
                <p style={{ color: textColor, opacity: 0.6, marginBottom: '1.5rem' }}>
                  {filterStatus === 'all'
                    ? `You haven't ordered anything from ${shop?.shopName} yet!`
                    : 'Try a different filter to see other orders.'}
                </p>
                <Link to={`/shop/${id}`} style={{ textDecoration: 'none', background: primaryColor, color: 'white', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem' }}>
                  Browse Products
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ShopOrders;
