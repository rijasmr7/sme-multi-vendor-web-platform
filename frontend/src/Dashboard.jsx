import { useState, useEffect } from 'react';
import axios from 'axios';
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
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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
  return selectedShop.is_published ? (
    <LiveShopDashboard 
      shop={selectedShop} 
      products={recentProducts} 
      orders={vendorOrders} 
      onBack={handleBackToSelection}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  ) : (
    <DraftShopDashboard 
      shop={selectedShop} 
      onBack={handleBackToSelection}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

// ==========================================
// VIEW 1: SELECTION PAGE (Full Screen)
// ==========================================
function SelectionPage({ shops, onSelect }) {
  const published = shops.filter(s => s.is_published);
  const drafts = shops.filter(s => !s.is_published);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#1e293b', marginBottom: '1rem' }}>Vendor Hub</h1>
          <p style={{ color: '#64748b', fontSize: '1.25rem' }}>Welcome back! Which dashboard would you like to access today?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          {/* LIVE SHOPS */}
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Rocket size={18} style={{ color: '#10b981' }} /> Published & Live
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {published.length > 0 ? published.map(shop => (
                <SelectionCard key={shop.id} shop={shop} onClick={() => onSelect(shop)} type="live" />
              )) : (
                <EmptyCard message="No shops live yet. Complete a draft to publish!" />
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
function LiveShopDashboard({ shop, products, orders, onBack, activeTab, setActiveTab }) {
  const primary = shop.config?.theme?.primary || '#6366f1';
  const shopProducts = products.filter(p => shop.config?.products?.some(sp => sp.name === p.name));
  const shopOrders = orders.filter(o => o.shop_id === shop.id);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9' }}>
           <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem' }}>
             <ArrowLeft size={14} /> Switch Shop
           </button>
           <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{shop.shop_name}</h2>
           <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>● LIVE STORE</span>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem' }}>
          <SidebarLink icon={<TrendingUp size={18} />} label="Performance" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} color={primary} />
          <SidebarLink icon={<Package size={18} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} color={primary} />
          <SidebarLink icon={<ClipboardList size={18} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} color={primary} />
          <SidebarLink icon={<User size={18} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} color={primary} />
          <SidebarLink icon={<Settings size={18} />} label="Store Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} color={primary} />
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Business Overview</h1>
            <p style={{ color: '#64748b' }}>Track your sales and operational growth.</p>
          </div>
          <button onClick={() => window.open(`http://localhost:5174/shop/${shop.id}`, '_blank')} style={{ background: primary, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Go to Store <Eye size={18} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <MetricCard label="Revenue" value={`LKR ${(shopOrders.reduce((s, o) => s + parseFloat(o.total_price), 0)).toLocaleString()}`} color={primary} />
          <MetricCard label="Orders" value={shopOrders.length} color="#8b5cf6" />
          <MetricCard label="Total Products" value={shopProducts.length} color="#f59e0b" />
        </div>

        {/* Recent Orders */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '800' }}>Recent Transactions</h3>
          {shopOrders.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                   <th style={{ padding: '1rem' }}>Order ID</th>
                   <th style={{ padding: '1rem' }}>Product</th>
                   <th style={{ padding: '1rem' }}>Status</th>
                   <th style={{ padding: '1rem' }}>Total</th>
                 </tr>
               </thead>
               <tbody>
                 {shopOrders.slice(0, 5).map(order => (
                   <tr key={order.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '1rem', fontWeight: '700', color: primary }}>#{order.id}</td>
                     <td style={{ padding: '1rem' }}>{order.product_id}</td>
                     <td style={{ padding: '1rem' }}>
                       <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', background: '#dcfce7', color: '#166534' }}>{order.status}</span>
                     </td>
                     <td style={{ padding: '1rem', fontWeight: '700' }}>LKR {parseFloat(order.total_price).toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          ) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No orders found yet.</p>}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// VIEW 3: DRAFT SHOP DASHBOARD
// ==========================================
function DraftShopDashboard({ shop, onBack, activeTab, setActiveTab }) {
  const primary = '#f59e0b'; // Amber for draft

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fffbeb' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'white', borderRight: '1px solid #fef3c7', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid #fff7ed' }}>
           <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem' }}>
             <ArrowLeft size={14} /> Switch Shop
           </button>
           <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{shop.shop_name}</h2>
           <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700' }}>● DRAFT MODE</span>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem' }}>
          <SidebarLink icon={<Rocket size={18} />} label="Launch Checklist" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} color={primary} />
          <SidebarLink icon={<Edit3 size={18} />} label="AI Customization" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} color={primary} />
          <SidebarLink icon={<Package size={18} />} label="Product Setup" active={activeTab === 'products'} onClick={() => setActiveTab('products')} color={primary} />
          <SidebarLink icon={<Eye size={18} />} label="Preview Store" active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} color={primary} />
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#451a03', margin: 0 }}>Launch Your Business</h1>
            <p style={{ color: '#92400e' }}>Complete the steps below to go live on our marketplace.</p>
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
      </main>
    </div>
  );
}

// ==========================================
// SHARED UI COMPONENTS
// ==========================================

function SelectionCard({ shop, onClick, type }) {
  const color = type === 'live' ? '#10b981' : '#f59e0b';
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
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{type === 'live' ? 'View live performance' : 'Complete configuration'}</p>
      </div>
      <ChevronRight size={20} style={{ color: '#cbd5e1' }} />
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, color }) {
  return (
    <div 
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', borderRadius: '12px', cursor: 'pointer', color: active ? 'white' : '#64748b', background: active ? color : 'transparent', fontWeight: active ? '700' : '500', marginBottom: '8px', transition: 'all 0.2s' }}>
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

export default Dashboard;
