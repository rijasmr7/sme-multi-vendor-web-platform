import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Settings, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Bell, 
  Search,
  User,
  Store,
  ChevronRight,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Rocket,
  Edit3,
  Eye,
  ArrowLeft,
  Map as MapIcon,
  Activity,
  X
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import GeoHeatmap from './components/geo/GeoHeatmap';
import RegionalTrends from './components/geo/RegionalTrends';
import LiveGeoActivity from './components/geo/LiveGeoActivity';
import VendorTrafficPanel from './components/geo/VendorTrafficPanel';
import ShopProductsList from './components/ShopProductsList';
import LiveDashboard from './components/LiveDashboard';

const API_GATEWAY = 'http://localhost:5000';

function Dashboard() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentProducts, setRecentProducts] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { shopId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);

  // Data Fetching
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('vendorToken');
      if (!token || token === 'null') {
        navigate('/auth');
        return;
      }
      const vendorId = JSON.parse(atob(token.split('.')[1])).id;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [shopsRes, productsRes, ordersRes] = await Promise.all([
          axios.get(`${API_GATEWAY}/shops/${vendorId}`, config),
          axios.get(`${API_GATEWAY}/products/vendor/${vendorId}`, config),
          axios.get(`${API_GATEWAY}/orders/vendor/${vendorId}`, config)
        ]);

        if (shopsRes.data.success) {
          const fetchedShops = shopsRes.data.data || [];
          setShops(fetchedShops);
          
          if (shopId) {
            const found = fetchedShops.find(s => s.id.toString() === shopId);
            if (found) setSelectedShop(found);
          }
        }
        if (productsRes.data.success) setRecentProducts(productsRes.data.data || []);
        if (ordersRes.data.success) setVendorOrders(ordersRes.data.data || []);
      } catch (err) {
        console.error("Dashboard Init Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [shopId]);

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    navigate(`/${shop.id}/dashboard`);
  };

  const handleBackToSelection = () => {
    setSelectedShop(null);
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={40} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // VIEW 1: SELECTION PAGE
  if (!selectedShop) {
    return <SelectionPage shops={shops} onSelect={handleShopClick} />;
  }

  // VIEW 2 & 3: SHOP DASHBOARDS
  return (
    <>
      {selectedShop.is_published ? (
        <LiveShopDashboard 
          shop={selectedShop} 
          products={recentProducts} 
          orders={vendorOrders} 
          onBack={handleBackToSelection}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEditStore={() => setShowEditModal(true)}
          onShopUpdated={setSelectedShop}
          onProductsUpdated={setRecentProducts}
        />
      ) : (
        <DraftShopDashboard 
          shop={selectedShop} 
          products={recentProducts}
          onBack={handleBackToSelection}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEditStore={() => setShowEditModal(true)}
          onShopUpdated={setSelectedShop}
          onProductsUpdated={setRecentProducts}
        />
      )}

      {showEditModal && (
        <EditStoreModal 
          shop={selectedShop} 
          onClose={() => setShowEditModal(false)} 
          onSave={(updatedShop) => {
            setSelectedShop(updatedShop);
            setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
          }}
        />
      )}
    </>
  );
}

// ==========================================
// VIEW 1: SELECTION PAGE (Full Screen)
// ==========================================
function SelectionPage({ shops, onSelect }) {
  const liveAndApproved = shops.filter(s => s.is_published && s.is_approved);
  const pendingApproval = shops.filter(s => s.is_published && !s.is_approved);
  const drafts = shops.filter(s => !s.is_published);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1e293b', marginBottom: '1rem' }}>Vendor Hub</h1>
          <p style={{ color: '#64748b', fontSize: '1.25rem' }}>Welcome back! Which dashboard would you like to access today?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          {/* LIVE & ACTIVE SHOPS */}
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Rocket size={18} style={{ color: '#10b981' }} /> Published & Live
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {liveAndApproved.length > 0 ? liveAndApproved.map(shop => (
                <SelectionCard key={shop.id} shop={shop} onClick={() => onSelect(shop)} type="live" />
              )) : (
                <EmptyCard message="No shops live yet. Complete approval to go live!" />
              )}
            </div>
          </section>

          {/* PENDING APPROVAL SHOPS */}
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: '#3b82f6' }} /> Pending Admin Approval
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {pendingApproval.length > 0 ? pendingApproval.map(shop => (
                <SelectionCard key={shop.id} shop={shop} onClick={() => onSelect(shop)} type="pending" />
              )) : (
                <EmptyCard message="No shops currently pending approval." />
              )}
            </div>
          </section>

          {/* DRAFT SHOPS */}
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} style={{ color: '#f59e0b' }} /> In Progress Drafts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {drafts.length > 0 ? drafts.map(shop => (
                <SelectionCard key={shop.id} shop={shop} onClick={() => onSelect(shop)} type="draft" />
              )) : (
                <EmptyCard message="No drafts found. Use the AI generator to start!" />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW 2: LIVE SHOP DASHBOARD
// ==========================================
function LiveShopDashboard({ shop, products, orders, onBack, activeTab, setActiveTab, onEditStore, onShopUpdated, onProductsUpdated }) {
  const navigate = useNavigate();
  const primary = shop.config?.theme?.primary || '#6366f1';
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const shopProducts = products.filter(p => shop.config?.products?.some(sp => sp.name === p.name));
  const shopOrders = orders.filter(o => o.shop_id === shop.id);

  // Geo Analytics State
  const [vendorTraffic, setVendorTraffic] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    // Fetch initial geo data
    const fetchGeoData = async () => {
      try {
        let lat = 40.7128;
        let lon = -74.0060;
        
        try {
          if (shop.location) {
            const locObj = typeof shop.location === 'string' ? JSON.parse(shop.location) : shop.location;
            if (locObj && locObj.lat !== undefined && (locObj.lon !== undefined || locObj.lng !== undefined)) {
              lat = parseFloat(locObj.lat);
              lon = parseFloat(locObj.lon || locObj.lng);
            }
          }
        } catch (e) {
          console.error("Error parsing shop location coordinates:", e);
        }

        const [trafficRes, hotspotsRes] = await Promise.all([
          axios.get(`http://localhost:5003/geo/vendor-traffic/${shop.id}?lat=${lat}&lon=${lon}`),
          axios.get(`http://localhost:5003/geo/hotspots`)
        ]);
        if (trafficRes.data.success) setVendorTraffic(trafficRes.data.data);
        if (hotspotsRes.data.success) setHotspots(hotspotsRes.data.data);
      } catch (err) {
        console.error("Geo Data Fetch Error:", err);
      }
    };
    fetchGeoData();

    // Socket.io Connection
    const socket = io('http://localhost:5003');
    socket.emit('join_vendor', shop.id);
    
    socket.on('live_event', (event) => {
      setLiveEvents(prev => [event, ...prev].slice(0, 50));
    });

    socket.on('vendor_event', (event) => {
      // Refresh traffic data when a relevant event happens
      fetchGeoData();
    });

    return () => socket.disconnect();
  }, [shop.id, shop.location]);

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{ width: isMobile ? '100%' : '280px', background: 'white', borderRight: isMobile ? 'none' : '1px solid #e2e8f0', borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: isMobile ? '1rem 1.25rem 0.5rem 1.25rem' : '2rem', 
          borderBottom: isMobile ? 'none' : '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
           <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: isMobile ? '0.5rem' : '1rem' }}>
             <ArrowLeft size={14} /> Switch Shop
           </button>
           <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{shop.shop_name}</h2>
           {shop.is_approved ? (
             <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>● LIVE STORE</span>
           ) : (
             <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '700' }}>● PENDING APPROVAL</span>
           )}
        </div>
        <nav style={{ 
          flex: isMobile ? 'none' : 1, 
          padding: isMobile ? '0.5rem 1.25rem' : '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '8px' : '0',
          scrollbarWidth: 'none'
        }}>
          <SidebarLink icon={<TrendingUp size={18} />} label="Performance" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<MapIcon size={18} />} label="Geo Analytics" active={activeTab === 'geo'} onClick={() => setActiveTab('geo')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<Package size={18} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<ClipboardList size={18} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<User size={18} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<Settings size={18} />} label="Store Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} color={primary} isMobile={isMobile} />
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1.5rem' : '3rem' }}>
        {activeTab === 'overview' ? (
          <>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              marginBottom: isMobile ? '2rem' : '3rem',
              gap: '1.5rem'
            }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Business Overview</h1>
                <p style={{ color: '#64748b', fontSize: isMobile ? '0.9rem' : '1rem' }}>Track your sales and operational growth.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                <button onClick={onEditStore} style={{ flex: 1, background: 'white', color: primary, border: `2px solid ${primary}`, padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Edit Store Feature <Edit3 size={18} />
                </button>
                <button onClick={() => window.open(`http://localhost:5174/shop/${shop.id}`, '_blank')} style={{ flex: 1, background: primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Go to Store <Eye size={18} />
                </button>
              </div>
            </div>

            {/* Live Operations Analytics */}
            <LiveDashboard vendorId={shop.vendor_id} />
          </>
        ) : activeTab === 'products' ? (
          <ShopProductsList 
            shop={shop} 
            products={products} 
            onShopUpdated={onShopUpdated} 
            onProductsUpdated={onProductsUpdated} 
          />
        ) : activeTab === 'geo' ? (
          <div>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              justifyContent: 'space-between', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Real-Time Geo Analytics</h1>
                <p style={{ color: '#64748b', fontSize: isMobile ? '0.9rem' : '1rem' }}>Monitor live customer traffic and regional hotspots.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold' }}>
                 <Activity className="animate-pulse" /> LIVE STREAM
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
              gap: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0', 
                padding: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
              }}>
                 <GeoHeatmap hotspots={hotspots} shopLocation={shop.location} />
              </div>
              <div style={{ height: '416px' }}>
                <VendorTrafficPanel vendorTraffic={vendorTraffic} />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: '1.5rem', 
              height: isMobile ? 'auto' : '400px' 
            }}>
              <RegionalTrends hotspots={hotspots} />
              <LiveGeoActivity liveEvents={liveEvents} />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', color: '#94a3b8' }}>
            <Settings size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p>This section is currently being optimized for your experience.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// VIEW 3: DRAFT SHOP DASHBOARD
// ==========================================
function DraftShopDashboard({ shop, products, onBack, activeTab, setActiveTab, onEditStore, onShopUpdated, onProductsUpdated }) {
  const navigate = useNavigate();
  const primary = '#f59e0b'; // Amber for draft
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#fffbeb' }}>
      {/* Sidebar */}
      <aside style={{ width: isMobile ? '100%' : '280px', background: 'white', borderRight: isMobile ? 'none' : '1px solid #fef3c7', borderBottom: isMobile ? '1px solid #fef3c7' : 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: isMobile ? '1rem 1.25rem 0.5rem 1.25rem' : '2rem', 
          borderBottom: isMobile ? 'none' : '1px solid #fff7ed',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
           <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: isMobile ? '0.5rem' : '1rem' }}>
             <ArrowLeft size={14} /> Switch Shop
           </button>
           <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{shop.shop_name}</h2>
           <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700' }}>● DRAFT MODE</span>
        </div>
        <nav style={{ 
          flex: isMobile ? 'none' : 1, 
          padding: isMobile ? '0.5rem 1.25rem' : '1.5rem',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: isMobile ? '8px' : '0',
          scrollbarWidth: 'none'
        }}>
          <SidebarLink icon={<Rocket size={18} />} label="Launch Checklist" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<Edit3 size={18} />} label="AI Customization" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<Package size={18} />} label="Product Setup" active={activeTab === 'products'} onClick={() => setActiveTab('products')} color={primary} isMobile={isMobile} />
          <SidebarLink icon={<Eye size={18} />} label="Preview Store" active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} color={primary} isMobile={isMobile} />
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1.5rem' : '3rem' }}>
        {activeTab === 'products' ? (
          <ShopProductsList 
            shop={shop} 
            products={products} 
            onShopUpdated={onShopUpdated} 
            onProductsUpdated={onProductsUpdated} 
          />
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center', 
              marginBottom: '2rem',
              gap: '1rem'
            }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#451a03', margin: 0 }}>Launch Your Business</h1>
                <p style={{ color: '#92400e' }}>Complete the steps below to go live on our marketplace.</p>
              </div>
              <button onClick={onEditStore} style={{ background: 'white', color: primary, border: `2px solid ${primary}`, padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Edit Store Feature <Edit3 size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ChecklistItem title="Generate Brand Identity" completed={true} />
              <ChecklistItem title="Add at least 3 products" completed={shop.config?.products?.length >= 3} />
              <ChecklistItem title="Configure delivery options" completed={false} />
              <ChecklistItem title="Final store review" completed={false} />
            </div>

            <div style={{ marginTop: '3rem', padding: '2.5rem', background: 'white', borderRadius: '24px', border: '2px dashed #f59e0b', textAlign: 'center' }}>
               <Rocket size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
               <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: '800' }}>Ready to go?</h3>
               <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Once you finish the checklist, you can publish your shop to the global marketplace.</p>
               <button disabled style={{ background: '#cbd5e1', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: '700', cursor: 'not-allowed' }}>
                 Publish Now
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// SHARED UI COMPONENTS
// ==========================================

function SelectionCard({ shop, onClick, type }) {
  const color = type === 'live' ? '#10b981' : type === 'pending' ? '#3b82f6' : '#f59e0b';
  const description = type === 'live' 
    ? 'View live performance' 
    : type === 'pending' 
      ? 'Awaiting admin approval' 
      : 'Complete configuration';
      
  return (
    <div 
      onClick={onClick}
      style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = color; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Store size={30} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{shop.shop_name}</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{description}</p>
      </div>
      <ChevronRight size={20} style={{ color: '#cbd5e1' }} />
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, color, isMobile }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: isMobile ? '8px 16px' : '1rem', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        color: active ? 'white' : '#64748b', 
        background: active ? color : 'transparent', 
        fontWeight: active ? '700' : '500', 
        marginBottom: isMobile ? '0' : '8px', 
        whiteSpace: isMobile ? 'nowrap' : 'normal',
        transition: 'all 0.2s' 
      }}>
      {icon}
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{label}</p>
      <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>{value}</h4>
      <div style={{ height: '4px', width: '40px', background: color, borderRadius: '2px', marginTop: '12px' }}></div>
    </div>
  );
}

function ChecklistItem({ title, completed }) {
  return (
    <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0', opacity: completed ? 0.6 : 1 }}>
      {completed ? <CheckCircle style={{ color: '#10b981' }} size={20} /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>}
      <span style={{ fontWeight: '600', color: '#1e293b' }}>{title}</span>
    </div>
  );
}

function EmptyCard({ message }) {
  return (
    <div style={{ padding: '2rem', border: '1px dashed #cbd5e1', borderRadius: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
      {message}
    </div>
  );
}

function EditStoreModal({ shop, onClose, onSave }) {
  const [activeLink, setActiveLink] = useState(shop.config?.navigation?.[0] || '');
  const [navigationContent, setNavigationContent] = useState(shop.config?.navigationContent || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageUpload = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size exceeds 2MB. Please select a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNavigationContent(prev => ({ ...prev, "Home_heroImageUrl": reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNavigationContent(prev => {
      const updated = { ...prev };
      delete updated["Home_heroImageUrl"];
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('vendorToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    const newConfig = {
      ...shop.config,
      navigationContent: navigationContent
    };

    try {
      const res = await axios.put(`${API_GATEWAY}/shops/${shop.id}/config`, { config: newConfig }, config);
      if (res.data.success) {
        setSuccess('Store features saved successfully!');
        onSave(res.data.data);
        setTimeout(() => onClose(), 800);
      } else {
        throw new Error(res.data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save configuration. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isProductLink = (link) => {
    const lower = link.toLowerCase();
    return ['shop', 'fresh fruits', 'men', 'women', 'collections', 'products'].includes(lower);
  };

  const isOffersLink = (link) => {
    const lower = link.toLowerCase();
    return ['offers', 'offres'].includes(lower);
  };

  const getDefaultContent = (link) => {
    if (!link) return '';
    const lower = link.toLowerCase();
    if (lower === 'home') {
      return `Welcome to our storefront! We are thrilled to show you our curated selections. Explore the navigation menu to view our catalog and ongoing offers.`;
    }
    if (lower === 'contact') {
      return `Please reach out to us with any questions or custom inquiries!

📍 Address: ${shop.location?.address || 'Available at local pickup'}
📧 Email: support@${shop.shop_name?.toLowerCase().replace(/\s+/g, '') || 'shop'}.com
📞 Phone: +1 (555) 000-0000`;
    }
    if (lower === 'offers' || lower === 'offres') {
      return `Special offers are on the way! Check back soon.`;
    }
    return `This page is currently being configured by the shop owner. Please check back soon!`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0.5rem' : '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px',
        height: isMobile ? '90vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem 2rem', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: '800', color: '#0f172a' }}>Edit Navigation</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Configure content for storefront links.</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
            borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }} onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <X size={20} />
          </button>
        </div>

        {/* Body Split Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
          {/* Left Navigation Links List */}
          <div style={{
            width: isMobile ? '100%' : '240px', 
            borderRight: isMobile ? 'none' : '1px solid #e2e8f0', 
            borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', 
            background: '#f8fafc',
            padding: isMobile ? '0.75rem' : '1.5rem 1rem', 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            gap: '8px', 
            overflowX: isMobile ? 'auto' : 'visible', 
            overflowY: isMobile ? 'visible' : 'auto', 
            scrollbarWidth: 'none'
          }}>
            {!isMobile && <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '8px' }}>Store Links</span>}
            {shop.config?.navigation?.map(link => {
              const active = activeLink === link;
              return (
                <div
                  key={link}
                  onClick={() => setActiveLink(link)}
                  style={{
                    padding: isMobile ? '8px 12px' : '10px 14px', borderRadius: '12px', cursor: 'pointer',
                    fontWeight: active ? '700' : '500', fontSize: '0.85rem',
                    color: active ? '#4f46e5' : '#475569',
                    background: active ? '#eeebff' : 'transparent',
                    transition: 'all 0.2s',
                    whiteSpace: isMobile ? 'nowrap' : 'normal'
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {link}
                </div>
              );
            })}
          </div>

          {/* Right Editor Area */}
          <div style={{ flex: 1, padding: isMobile ? '1.25rem' : '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#0f172a' }}>
            {activeLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>
                  Editing Link: <span style={{ color: '#4f46e5' }}>"{activeLink}"</span>
                </h3>
                
                {isProductLink(activeLink) ? (
                  <div style={{
                    background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '16px',
                    padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '1rem', marginTop: '1rem'
                  }}>
                    <Package size={48} style={{ color: '#94a3b8' }} />
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#334155' }}>Product Catalog Page</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '340px', lineHeight: '1.5' }}>
                      This navigation link automatically displays your product inventory to the customer. Use the main products tab on your dashboard to add or modify items.
                    </p>
                  </div>
                ) : isOffersLink(activeLink) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Offers & Banners Content</label>
                    <textarea
                      placeholder="E.g., Special Weekend Sale! Use code WEEKEND10 for 10% off on all organic products. Free delivery on orders over LKR 1500!"
                      value={navigationContent[activeLink] !== undefined ? navigationContent[activeLink] : getDefaultContent(activeLink)}
                      onChange={e => setNavigationContent(prev => ({ ...prev, [activeLink]: e.target.value }))}
                      style={{
                        flex: 1, minHeight: '150px', padding: '12px 16px', borderRadius: '12px',
                        outline: 'none', fontFamily: 'inherit', border: '1px solid #cbd5e1',
                        fontSize: '0.9rem', resize: 'none', lineHeight: '1.6', transition: 'border 0.2s',
                        color: '#0f172a', backgroundColor: '#ffffff'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                      onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Provide promotional text or instructions for your offers page.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                    {activeLink.toLowerCase() === 'home' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Add a Hero Image (Optional)
                        </label>
                        
                        {navigationContent["Home_heroImageUrl"] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                              <img 
                                src={navigationContent["Home_heroImageUrl"]} 
                                alt="Hero preview" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                style={{
                                  position: 'absolute', top: '8px', right: '8px',
                                  background: 'rgba(15, 23, 42, 0.8)', color: 'white',
                                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'}
                                title="Remove image"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Hero image uploaded successfully. This image will replace the default hero gradient banner.</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label 
                              htmlFor="hero-image-file-upload"
                              style={{
                                width: '100%', height: '100px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s', gap: '6px'
                              }}
                              onMouseOver={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = '#f5f3ff'; }}
                              onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; }}
                            >
                              <Plus size={20} style={{ color: '#64748b' }} />
                              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Click to upload local image</span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>JPEG, PNG (Max 2MB)</span>
                            </label>
                            <input
                              type="file"
                              id="hero-image-file-upload"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Custom Page Text / HTML</label>
                      <textarea
                        placeholder={`Enter text description or details for your "${activeLink}" page...`}
                        value={navigationContent[activeLink] !== undefined ? navigationContent[activeLink] : getDefaultContent(activeLink)}
                        onChange={e => setNavigationContent(prev => ({ ...prev, [activeLink]: e.target.value }))}
                        style={{
                          flex: 1, minHeight: '150px', padding: '12px 16px', borderRadius: '12px',
                          outline: 'none', fontFamily: 'inherit', border: '1px solid #cbd5e1',
                          fontSize: '0.9rem', resize: 'none', lineHeight: '1.6', transition: 'border 0.2s',
                          color: '#0f172a', backgroundColor: '#ffffff'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                        onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>This custom text will be shown directly on the customer storefront.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b', fontSize: '0.9rem' }}>
                Select a navigation link from the left sidebar to edit its content.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem 2rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '1rem'
        }}>
          <div style={{ fontSize: '0.85rem', textAlign: isMobile ? 'center' : 'left' }}>
            {error && <span style={{ color: '#ef4444', fontWeight: '600' }}>{error}</span>}
            {success && <span style={{ color: '#10b981', fontWeight: '600' }}>{success}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '12px' }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1',
                background: 'white', color: '#334155', fontWeight: '600', fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '10px 24px', borderRadius: '12px', border: 'none',
                background: '#4f46e5', color: 'white', fontWeight: '700', fontSize: '0.9rem',
                cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
