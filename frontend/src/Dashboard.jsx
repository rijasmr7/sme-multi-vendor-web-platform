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
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const API_GATEWAY = 'http://localhost:5000';

function Dashboard({ primaryColor = '#6366f1' }) {
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedShop, setSelectedShop] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const navigate = useNavigate();
  const location = useLocation();
  const { shopId } = useParams();

  const getShopCategory = (shop) => {
    if (!shop || !recentProducts || recentProducts.length === 0) return '';
    if (shop.config?.products?.length > 0) {
      const sampleProduct = recentProducts.find(rp => 
        shop.config.products.some(sp => sp.name === rp.name)
      );
      if (sampleProduct) {
        return sampleProduct.category;
      }
    }
    return '';
  };

  const shopLiveProducts = selectedShop ? (getShopCategory(selectedShop) ? recentProducts.filter(p => p.category === getShopCategory(selectedShop)) : []) : [];

  const parseJwtLocal = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } 
    catch (e) { return null; }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('vendorToken');
        if (!token || token === 'null') return;
        const vendorId = parseJwtLocal(token)?.id || 1;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch Global Stats
        const statsRes = await axios.get(`${API_GATEWAY}/stats`, config);
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        // 2. Fetch Recent Products for this vendor
        const productsRes = await axios.get(`${API_GATEWAY}/products/vendor/${vendorId}`, config);
        if (productsRes.data.success) {
          setRecentProducts(productsRes.data.data || []);
        }

        // 3. Fetch Shops for this vendor
        const shopsRes = await axios.get(`${API_GATEWAY}/shops/${vendorId}`, config);
        if (shopsRes.data.success) {
          const fetchedShops = shopsRes.data.data || [];
          setShops(fetchedShops);

          // Restore previously active shop if navigated back from another page or direct URL
          if (shopId) {
            const routeShop = fetchedShops.find(s => s.id.toString() === shopId);
            if (routeShop) {
              setSelectedShop(routeShop);
              setActiveTab('shop-dashboard');
            }
          } else if (location.state?.returnToShopId) {
            const returnShop = fetchedShops.find(s => s.id === location.state.returnToShopId);
            if (returnShop) {
              setSelectedShop(returnShop);
              setActiveTab('shop-dashboard');
              navigate(`/${returnShop.id}/dashboard`, { replace: true });
            }
          } else if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
          }
        }
      } catch (err) {
        console.error("Dashboard Data Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== 'shop-dashboard') {
      setSelectedShop(null);
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard', { state: { activeTab: tabId } });
      }
    }
  };

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    setActiveTab('shop-dashboard');
    navigate(`/${shop.id}/dashboard`);
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      
      {/* SIDEBAR */}
      <aside style={{ 
        width: '260px', 
        background: 'white', 
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0'
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: primaryColor, color: 'white', padding: '8px', borderRadius: '8px' }}>
            <Package size={20} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Vendor Hub</h2>
        </div>

        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => handleNavClick('overview')} primaryColor={primaryColor} />
          <NavItem icon={<Store size={18} />} label="My Business" active={activeTab === 'my-business' || activeTab === 'shop-dashboard'} onClick={() => handleNavClick('my-business')} primaryColor={primaryColor} />
          <NavItem icon={<Package size={18} />} label="My Products" active={activeTab === 'products'} onClick={() => handleNavClick('products')} primaryColor={primaryColor} />
          <NavItem icon={<Layers size={18} />} label="Categories" active={activeTab === 'categories'} onClick={() => handleNavClick('categories')} primaryColor={primaryColor} />
          <NavItem icon={<TrendingUp size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => handleNavClick('analytics')} primaryColor={primaryColor} />
          <div style={{ margin: '1.5rem 0.75rem', height: '1px', background: '#e2e8f0' }}></div>
          <NavItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'settings'} onClick={() => handleNavClick('settings')} primaryColor={primaryColor} />
        </nav>

        <div style={{ padding: '0 1.5rem' }}>
          <div style={{ 
            background: `${primaryColor}11`, 
            padding: '1rem', 
            borderRadius: '12px',
            border: `1px dashed ${primaryColor}44`
          }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Need help?</p>
            <button style={{ 
              width: '100%', 
              background: primaryColor, 
              color: 'white', 
              border: 'none', 
              padding: '0.5rem', 
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Contact Support
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        {/* HEADER */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
              {activeTab === 'overview' ? 'Merchant Dashboard' : activeTab === 'my-business' ? 'My Business Shops' : selectedShop ? selectedShop.shop_name : 'Dashboard'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {activeTab === 'overview' ? "Welcome back! Here's what's happening today." : activeTab === 'my-business' ? "Select a shop to view its specific dashboard." : "Real-time insights for your generated shop."}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                style={{ 
                  padding: '0.5rem 1rem 0.5rem 2.2rem', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  width: '240px'
                }} 
              />
            </div>
            <div style={{ color: '#64748b', position: 'relative' }}>
              <Bell size={20} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', height: '8px', width: '8px', borderRadius: '50%', border: '2px solid white' }}></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px', borderRadius: '30px', border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ background: '#f1f5f9', color: '#64748b', padding: '5px', borderRadius: '50%' }}>
                <User size={18} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', marginRight: '5px' }}>Logged In Vendor</span>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {/* STATS AREA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <StatCard 
                title="Total Products" 
                value={recentProducts.length} 
                change="Active Inventory" 
                icon={<Package size={20} />} 
                color={primaryColor} 
              />
              <StatCard 
                title="Total Shops" 
                value={shops.length} 
                change="Generated Brands" 
                icon={<Store size={20} />} 
                color="#22c55e" 
              />
              <StatCard 
                title="Categories" 
                value={new Set(recentProducts.map(p => p.category)).size} 
                change="Unique Niches" 
                icon={<Layers size={20} />} 
                color="#f59e0b" 
              />

            </div>

            {/* RECENT PRODUCTS TABLE */}
            <section style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '700', color: '#1e293b' }}>Recent Product Activity</h3>
                <button style={{ color: primaryColor, fontSize: '0.85rem', fontWeight: '600', border: 'none', background: 'none' }}>View All</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={tableHeaderStyle}>Product Name</th>
                      <th style={tableHeaderStyle}>Category</th>
                      <th style={tableHeaderStyle}>Price</th>
                      <th style={tableHeaderStyle}>Status</th>
                      <th style={tableHeaderStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.length > 0 ? recentProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                              <Package size={14} />
                            </div>
                            {p.name}
                          </div>
                        </td>
                        <td style={tableCellStyle}>{p.category}</td>
                        <td style={{ ...tableCellStyle, fontWeight: '700' }}>${parseFloat(p.price).toFixed(2)}</td>
                        <td style={tableCellStyle}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            background: '#dcfce7', 
                            color: '#166534' 
                          }}>Active</span>
                        </td>
                        <td style={tableCellStyle}>
                          <ArrowUpRight size={18} style={{ color: '#94a3b8', cursor: 'pointer' }} />
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No products found. Start by generating one!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {recentProducts.length > productsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#94a3b8' : '#1e293b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Page {currentPage} of {Math.ceil(recentProducts.length / productsPerPage)}
                  </span>
                  <button 
                    disabled={currentPage >= Math.ceil(recentProducts.length / productsPerPage)} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentProducts.length / productsPerPage)))}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? '#f1f5f9' : 'white', color: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? '#94a3b8' : '#1e293b', cursor: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'products' && (
          <section style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '700', color: '#1e293b' }}>All Vendor Products</h3>
              <button onClick={() => navigate('/products')} style={{ background: primaryColor, color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={tableHeaderStyle}>Product Name</th>
                    <th style={tableHeaderStyle}>Category</th>
                    <th style={tableHeaderStyle}>Price</th>
                    <th style={tableHeaderStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.length > 0 ? recentProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                            <Package size={14} />
                          </div>
                          {p.name}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{p.category}</td>
                      <td style={{ ...tableCellStyle, fontWeight: '700' }}>${parseFloat(p.price).toFixed(2)}</td>
                      <td style={tableCellStyle}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>Active</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No products found. Start by generating one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {recentProducts.length > productsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#94a3b8' : '#1e293b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Page {currentPage} of {Math.ceil(recentProducts.length / productsPerPage)}
                </span>
                <button 
                  disabled={currentPage >= Math.ceil(recentProducts.length / productsPerPage)} 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentProducts.length / productsPerPage)))}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? '#f1f5f9' : 'white', color: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? '#94a3b8' : '#1e293b', cursor: currentPage >= Math.ceil(recentProducts.length / productsPerPage) ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'my-business' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {shops.length > 0 ? shops.map((shop, idx) => (
              <div 
                key={idx} 
                onClick={() => handleShopClick(shop)}
                style={{ 
                  background: 'white', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: shop.config?.theme?.primary || primaryColor, color: 'white', padding: '12px', borderRadius: '12px' }}>
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{shop.shop_name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Layout: {shop.config?.layout || 'Standard'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>{shop.config?.products?.length || 0}</strong> Generated Products
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', color: primaryColor, fontSize: '0.85rem', fontWeight: '600' }}>
                    View Dashboard <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', background: 'white', padding: '3rem', textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Store size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>No Shops Yet</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Generate your first shop using the AI generator to see it here.</p>
                <button onClick={() => navigate('/')} style={{ background: primaryColor, color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Go to Generator</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop-dashboard' && selectedShop && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              <StatCard 
                title="Shop Products" 
                value={shopLiveProducts.length} 
                change="Active Items" 
                icon={<Package size={20} />} 
                color={selectedShop.config?.theme?.primary || primaryColor} 
              />
              <StatCard 
                title="Theme Applied" 
                value="Custom" 
                change="AI Color Sync" 
                icon={<Settings size={20} />} 
                color={selectedShop.config?.theme?.accent || "#22c55e"} 
              />
              <StatCard 
                title="Layout Style" 
                value={selectedShop.config?.layout || "Standard"} 
                change="Optimized UI" 
                icon={<Layers size={20} />} 
                color="#f59e0b" 
              />
              <div style={{ 
                background: selectedShop.config?.theme?.primary || primaryColor, 
                borderRadius: '16px', 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                color: 'white',
                boxShadow: `0 10px 15px -3px ${selectedShop.config?.theme?.primary || primaryColor}44`
              }}>
                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Ready for more?</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Add New Product</h3>
                <button 
                  onClick={() => {
                    navigate('/products', { state: { defaultCategory: getShopCategory(selectedShop), shopId: selectedShop.id } });
                  }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <section style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '700', color: '#1e293b' }}>{selectedShop.shop_name} Inventory</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={tableHeaderStyle}>Product Name</th>
                      <th style={tableHeaderStyle}>Price</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopLiveProducts.length > 0 ? shopLiveProducts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: `${selectedShop.config?.theme?.primary}11` || '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedShop.config?.theme?.primary || primaryColor }}>
                              <Package size={14} />
                            </div>
                            {p.name}
                          </div>
                        </td>
                        <td style={{ ...tableCellStyle, fontWeight: '700' }}>${parseFloat(p.price || 0).toFixed(2)}</td>
                        <td style={tableCellStyle}>
                          <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>Active</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No live products found for this shop. Click "Add New Product" to add some!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

      </main>
    </div>
  );
}

// Sub-components for cleaner structure
function NavItem({ icon, label, active = false, primaryColor, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '0.75rem 1rem', 
      borderRadius: '10px',
      cursor: 'pointer',
      color: active ? primaryColor : '#64748b',
      background: active ? `${primaryColor}11` : 'transparent',
      fontWeight: active ? '700' : '500',
      marginBottom: '4px',
      transition: 'all 0.2s'
    }}>
      {icon}
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: '4px', height: '16px', background: primaryColor, borderRadius: '4px' }}></div>}
    </div>
  );
}

function StatCard({ title, value, change, icon, color }) {
  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ background: `${color}22`, color: color, padding: '8px', borderRadius: '10px' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#22c55e', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', alignSelf: 'start' }}>
          {change}
        </span>
      </div>
      <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', margin: '0 0 5px 0' }}>{title}</h4>
      <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>{value}</p>
    </div>
  );
}

const tableHeaderStyle = { padding: '12px 1.5rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' };
const tableCellStyle = { padding: '1rem 1.5rem', fontSize: '0.9rem', color: '#1e293b' };

export default Dashboard;
