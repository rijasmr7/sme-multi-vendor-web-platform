import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Users as UsersIcon, 
  Store, 
  Package, 
  ClipboardList, 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  DollarSign,
  ShoppingCart,
  Menu,
  X
} from 'lucide-react';

const API_GATEWAY = 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data Lists
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modalType, setModalType] = useState(null); // 'user-add', 'user-edit', 'shop-edit', 'product-add', 'product-edit', 'order-edit'
  const [selectedItem, setSelectedItem] = useState(null);

  // Helper config for API requests
  const getAuthHeaders = () => {
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // JWT Helper
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  // Load Admin Data
  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const config = getAuthHeaders();
      const [usersRes, shopsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_GATEWAY}/admin/users`, config),
        axios.get(`${API_GATEWAY}/admin/shops`, config),
        axios.get(`${API_GATEWAY}/admin/products`, config),
        axios.get(`${API_GATEWAY}/admin/orders`, config)
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (shopsRes.data.success) setShops(shopsRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setErrorMsg('Unauthorized or backend service offline. Please try logging in again.');
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Flash Message Handlers
  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const flashError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // CRUD actions: USERS
  const handleUserSubmit = async (e, type, id = null) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const body = Object.fromEntries(data.entries());
    
    try {
      const config = getAuthHeaders();
      let res;
      if (type === 'add') {
        res = await axios.post(`${API_GATEWAY}/admin/users`, body, config);
        if (res.data.success) {
          flashSuccess('User created successfully!');
          setUsers(prev => [res.data.data, ...prev]);
        }
      } else {
        res = await axios.put(`${API_GATEWAY}/admin/users/${id}`, body, config);
        if (res.data.success) {
          flashSuccess('User updated successfully!');
          setUsers(prev => prev.map(u => u.id === id ? res.data.data : u));
        }
      }
      setModalType(null);
    } catch (err) {
      flashError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This will remove all their credentials.')) return;
    try {
      const config = getAuthHeaders();
      const res = await axios.delete(`${API_GATEWAY}/admin/users/${id}`, config);
      if (res.data.success) {
        flashSuccess('User deleted!');
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err) {
      flashError(err.response?.data?.message || 'Delete failed');
    }
  };

  // CRUD actions: SHOPS
  const handleShopApprovalToggle = async (id, currentStatus) => {
    try {
      const config = getAuthHeaders();
      const nextStatus = !currentStatus;
      const res = await axios.put(`${API_GATEWAY}/admin/shops/${id}/approve`, { isApproved: nextStatus }, config);
      if (res.data.success) {
        flashSuccess(nextStatus ? 'Shop approved and is now live!' : 'Shop disapproved.');
        setShops(prev => prev.map(s => s.id === id ? { ...s, is_approved: nextStatus } : s));
      }
    } catch (err) {
      flashError(err.response?.data?.message || 'Failed to update approval status');
    }
  };

  const handleShopSubmit = async (e, id) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const body = Object.fromEntries(data.entries());
    
    // Parse location coordinates if set
    let location = null;
    if (body.lat && body.lon) {
      location = {
        lat: parseFloat(body.lat),
        lon: parseFloat(body.lon),
        address: body.address || 'Colombo, Sri Lanka'
      };
    }

    try {
      const config = getAuthHeaders();
      const res = await axios.put(`${API_GATEWAY}/admin/shops/${id}`, {
        shop_name: body.shop_name,
        is_published: body.is_published === 'true',
        is_approved: body.is_approved === 'true',
        location: location
      }, config);

      if (res.data.success) {
        flashSuccess('Shop updated successfully!');
        setShops(prev => prev.map(s => s.id === id ? res.data.data : s));
      }
      setModalType(null);
    } catch (err) {
      flashError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleShopDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shop? This cannot be undone.')) return;
    try {
      const config = getAuthHeaders();
      const res = await axios.delete(`${API_GATEWAY}/admin/shops/${id}`, config);
      if (res.data.success) {
        flashSuccess('Shop deleted successfully!');
        setShops(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      flashError(err.response?.data?.message || 'Delete failed');
    }
  };

  // CRUD actions: PRODUCTS
  const handleProductSubmit = async (e, type, id = null) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const body = Object.fromEntries(data.entries());

    try {
      const config = getAuthHeaders();
      let res;
      if (type === 'add') {
        res = await axios.post(`${API_GATEWAY}/admin/products`, {
          vendorId: parseInt(body.vendorId),
          name: body.name,
          price: parseFloat(body.price),
          category: body.category,
          description: body.description
        }, config);
        if (res.data.success) {
          flashSuccess('Product added to catalog!');
          setProducts(prev => [res.data.data, ...prev]);
        }
      } else {
        res = await axios.put(`${API_GATEWAY}/admin/products/${id}`, {
          name: body.name,
          price: parseFloat(body.price),
          category: body.category,
          description: body.description
        }, config);
        if (res.data.success) {
          flashSuccess('Product updated!');
          setProducts(prev => prev.map(p => p.id === id ? res.data.data : p));
        }
      }
      setModalType(null);
    } catch (err) {
      flashError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      const config = getAuthHeaders();
      const res = await axios.delete(`${API_GATEWAY}/admin/products/${id}`, config);
      if (res.data.success) {
        flashSuccess('Product deleted!');
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      flashError(err.response?.data?.message || 'Delete failed');
    }
  };

  // CRUD actions: ORDERS
  const handleOrderSubmit = async (e, id) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const body = Object.fromEntries(data.entries());

    try {
      const config = getAuthHeaders();
      const res = await axios.put(`${API_GATEWAY}/admin/orders/${id}`, {
        status: body.status,
        quantity: parseInt(body.quantity),
        total_price: parseFloat(body.total_price),
        delivery_type: body.delivery_type,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        address_line: body.address_line,
        city: body.city,
        zip_code: body.zip_code
      }, config);

      if (res.data.success) {
        flashSuccess('Order updated successfully!');
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...res.data.data, customer_name: body.customer_name, customer_phone: body.customer_phone, address_line: body.address_line, city: body.city, zip_code: body.zip_code } : o));
      }
      setModalType(null);
    } catch (err) {
      flashError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleOrderDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const config = getAuthHeaders();
      const res = await axios.delete(`${API_GATEWAY}/admin/orders/${id}`, config);
      if (res.data.success) {
        flashSuccess('Order deleted!');
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    } catch (err) {
      flashError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (!token) {
    return <AdminLogin setToken={setToken} parseJwt={parseJwt} />;
  }

  // Filter calculations based on search terms
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShops = shops.filter(s => 
    s.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id?.toString().includes(searchTerm)
  );

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor_id?.toString().includes(searchTerm)
  );

  const filteredOrders = orders.filter(o => 
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.toString().includes(searchTerm) ||
    o.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingShopsCount = shops.filter(s => s.is_published && !s.is_approved).length;

  return (
    <div className="dashboard-layout">
      <div className="bg-ambient"></div>
      
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="logo-container" style={{ margin: 0 }}>
          <div className="logo-icon">
            <Shield size={22} />
          </div>
          <span className="logo-text">SME Admin</span>
        </div>
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <div className="logo-icon">
            <Shield size={22} />
          </div>
          <span className="logo-text">SME Admin</span>
        </div>

        <nav className="nav-links">
          <div 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setSearchTerm(''); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </div>

          <div 
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setSearchTerm(''); setIsMobileMenuOpen(false); }}
          >
            <UsersIcon size={20} />
            <span>Users Control</span>
          </div>

          <div 
            className={`nav-link ${activeTab === 'shops' ? 'active' : ''}`}
            onClick={() => { setActiveTab('shops'); setSearchTerm(''); setIsMobileMenuOpen(false); }}
          >
            <Store size={20} />
            <span>Shops Approval {pendingShopsCount > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '50%', marginLeft: 'auto' }}>{pendingShopsCount}</span>}</span>
          </div>

          <div 
            className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSearchTerm(''); setIsMobileMenuOpen(false); }}
          >
            <Package size={20} />
            <span>Catalog Items</span>
          </div>

          <div 
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); setIsMobileMenuOpen(false); }}
          >
            <ClipboardList size={20} />
            <span>Orders & Carts</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <h4>System Admin</h4>
              <span>Platform Moderator</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-panel">
        {successMsg && (
          <div style={{ position: 'fixed', top: '24px', right: '24px', background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid var(--success)', padding: '12px 24px', borderRadius: '12px', zIndex: 1000, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ position: 'fixed', top: '24px', right: '24px', background: 'var(--error-glow)', color: 'var(--error)', border: '1px solid var(--error)', padding: '12px 24px', borderRadius: '12px', zIndex: 1000, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} /> {errorMsg}
          </div>
        )}

        <div className="panel-header">
          <div className="panel-title">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard</h2>
            <p>Platform management operations and moderation filters.</p>
          </div>
          
          {isLoading && <Loader2 className="animate-spin text-primary" size={24} />}
          
          {!isLoading && activeTab === 'users' && (
            <button className="btn-action" onClick={() => { setSelectedItem(null); setModalType('user-add'); }}>
              <Plus size={18} /> Create User
            </button>
          )}

          {!isLoading && activeTab === 'products' && (
            <button className="btn-action" onClick={() => { setSelectedItem(null); setModalType('product-add'); }}>
              <Plus size={18} /> Add Catalog Product
            </button>
          )}
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                  <UsersIcon size={26} />
                </div>
                <div className="stat-data">
                  <p>Total Users</p>
                  <h3>{users.length}</h3>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  <Store size={26} />
                </div>
                <div className="stat-data">
                  <p>Shops Count</p>
                  <h3>{shops.length}</h3>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Package size={26} />
                </div>
                <div className="stat-data">
                  <p>Catalog Items</p>
                  <h3>{products.length}</h3>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <ClipboardList size={26} />
                </div>
                <div className="stat-data">
                  <p>Orders Handled</p>
                  <h3>{orders.length}</h3>
                </div>
              </div>
            </div>

            <div className="overview-grid">
              {/* Left: Shops requiring approval */}
              <div className="table-panel">
                <div className="table-header-row">
                  <h3>Moderation Queue (Pending Shops)</h3>
                  <span className="badge badge-warning">{pendingShopsCount} shops awaiting</span>
                </div>
                {pendingShopsCount === 0 ? (
                  <p className="text-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>All clear! No shops are currently awaiting moderation.</p>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Shop ID</th>
                          <th>Shop Name</th>
                          <th>Vendor ID</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shops.filter(s => s.is_published && !s.is_approved).map(shop => (
                          <tr key={shop.id}>
                            <td>#{shop.id}</td>
                            <td style={{ fontWeight: 'bold' }}>{shop.shop_name}</td>
                            <td>Vendor #{shop.vendor_id}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon btn-icon-approve" 
                                  title="Approve Shop"
                                  onClick={() => handleShopApprovalToggle(shop.id, shop.is_approved)}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right: Quick Settings Summary */}
              <div className="table-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: '800' }}>Platform Health</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <span className="text-muted">User Service</span>
                  <span className="text-success" style={{ fontWeight: '700' }}>ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <span className="text-muted">AI Generating Engine</span>
                  <span className="text-success" style={{ fontWeight: '700' }}>ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <span className="text-muted">Product Catalog Service</span>
                  <span className="text-success" style={{ fontWeight: '700' }}>ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                  <span className="text-muted">Order & Cart Engine</span>
                  <span className="text-success" style={{ fontWeight: '700' }}>ONLINE</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="table-panel">
            <div className="table-header-row">
              <h3>System Users List</h3>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search name, email, or role..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>City</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{user.name}</td>
                      <td>{user.email || <span className="text-muted">-</span>}</td>
                      <td>{user.phone || <span className="text-muted">-</span>}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-error' : user.role === 'vendor' ? 'badge-primary' : 'badge-success'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.city || <span className="text-muted">Unknown</span>}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-icon-edit" 
                            title="Edit User"
                            onClick={() => { setSelectedItem(user); setModalType('user-edit'); }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete" 
                            title="Delete User"
                            onClick={() => handleUserDelete(user.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shops Tab */}
        {activeTab === 'shops' && (
          <div className="table-panel">
            <div className="table-header-row">
              <h3>Vendor Shops List</h3>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search shop name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vendor ID</th>
                    <th>Shop Name</th>
                    <th>Published</th>
                    <th>Admin Approved</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map(shop => (
                    <tr key={shop.id}>
                      <td>#{shop.id}</td>
                      <td>Vendor #{shop.vendor_id}</td>
                      <td style={{ fontWeight: 'bold' }}>{shop.shop_name}</td>
                      <td>
                        <span className={`badge ${shop.is_published ? 'badge-success' : 'badge-warning'}`}>
                          {shop.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleShopApprovalToggle(shop.id, shop.is_approved)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                          title={shop.is_approved ? 'Revoke Approval' : 'Approve Shop'}
                        >
                          <span className={`badge ${shop.is_approved ? 'badge-success' : 'badge-error'}`}>
                            {shop.is_approved ? 'Approved' : 'Awaiting Approval'}
                          </span>
                        </button>
                      </td>
                      <td>{new Date(shop.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-icon-edit" 
                            title="Edit Shop"
                            onClick={() => { setSelectedItem(shop); setModalType('shop-edit'); }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete" 
                            title="Delete Shop"
                            onClick={() => handleShopDelete(shop.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="table-panel">
            <div className="table-header-row">
              <h3>Products Catalog</h3>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search product name or category..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vendor ID</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>#{product.id}</td>
                      <td>Vendor #{product.vendor_id}</td>
                      <td style={{ fontWeight: 'bold' }}>{product.name}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '700' }}>LKR {parseFloat(product.price).toLocaleString()}</td>
                      <td>
                        <span className="badge badge-primary">{product.category}</span>
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description || <span className="text-muted">-</span>}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-icon-edit" 
                            title="Edit Product"
                            onClick={() => { setSelectedItem(product); setModalType('product-edit'); }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete" 
                            title="Delete Product"
                            onClick={() => handleProductDelete(product.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="table-panel">
            <div className="table-header-row">
              <h3>Platform Transactions</h3>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search status, name, or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Shop ID</th>
                    <th>Product ID</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Delivery</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{order.customer_name || `Customer #${order.customer_id}`}</td>
                      <td>Shop #{order.shop_id}</td>
                      <td>{order.product_id}</td>
                      <td>{order.quantity}</td>
                      <td style={{ fontWeight: '700' }}>LKR {parseFloat(order.total_price).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'completed' || order.status === 'delivered' ? 'badge-success' :
                          order.status === 'pending' ? 'badge-warning' :
                          order.status === 'cancelled' ? 'badge-error' : 'badge-primary'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{order.delivery_type || 'Standard'}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-icon-edit" 
                            title="Edit Order"
                            onClick={() => { setSelectedItem(order); setModalType('order-edit'); }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete" 
                            title="Delete Order"
                            onClick={() => handleOrderDelete(order.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CRUD MODALS CONTAINER */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {modalType === 'user-add' && 'Create New User Profile'}
                {modalType === 'user-edit' && `Edit User Profile #${selectedItem?.id}`}
                {modalType === 'shop-edit' && `Configure Shop #${selectedItem?.id}`}
                {modalType === 'product-add' && 'Register Catalog Product'}
                {modalType === 'product-edit' && `Edit Catalog Product #${selectedItem?.id}`}
                {modalType === 'order-edit' && `Modify Order #${selectedItem?.id}`}
              </h3>
              <button className="btn-close" onClick={() => setModalType(null)}>×</button>
            </div>

            {/* Modal Forms */}
            {modalType.startsWith('user-') && (
              <form onSubmit={(e) => handleUserSubmit(e, modalType === 'user-add' ? 'add' : 'edit', selectedItem?.id)}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" name="name" className="input-field" defaultValue={selectedItem?.name || ''} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" name="email" className="input-field" defaultValue={selectedItem?.email || ''} />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input type="text" name="phone" className="input-field" defaultValue={selectedItem?.phone || ''} />
                </div>
                <div className="input-group">
                  <label className="input-label">User Role</label>
                  <select name="role" className="input-field" defaultValue={selectedItem?.role || 'vendor'} style={{ background: '#000' }}>
                    <option value="customer">customer</option>
                    <option value="vendor">vendor</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">City Location</label>
                  <input type="text" name="city" className="input-field" defaultValue={selectedItem?.city || ''} />
                </div>
                <div className="input-group">
                  <label className="input-label">Associated Shop Name</label>
                  <input type="text" name="shop_name" className="input-field" defaultValue={selectedItem?.shop_name || ''} />
                </div>
                <div className="input-group">
                  <label className="input-label">Password {modalType === 'user-edit' && '(Leave blank to keep current)'}</label>
                  <input type="password" name="password" className="input-field" required={modalType === 'user-add'} />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Profile</button>
                </div>
              </form>
            )}

            {modalType === 'shop-edit' && (
              <form onSubmit={(e) => handleShopSubmit(e, selectedItem?.id)}>
                <div className="input-group">
                  <label className="input-label">Shop Name</label>
                  <input type="text" name="shop_name" className="input-field" defaultValue={selectedItem?.shop_name || ''} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Published State</label>
                  <select name="is_published" className="input-field" defaultValue={selectedItem?.is_published ? 'true' : 'false'} style={{ background: '#000' }}>
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Admin Approval Status</label>
                  <select name="is_approved" className="input-field" defaultValue={selectedItem?.is_approved ? 'true' : 'false'} style={{ background: '#000' }}>
                    <option value="true">Approved</option>
                    <option value="false">Pending Approval</option>
                  </select>
                </div>
                
                {/* Coordinates */}
                <div className="modal-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Latitude</label>
                    <input type="number" step="any" name="lat" className="input-field" defaultValue={selectedItem?.location?.lat || ''} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Longitude</label>
                    <input type="number" step="any" name="lon" className="input-field" defaultValue={selectedItem?.location?.lon || selectedItem?.location?.lng || ''} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Resolved Address</label>
                  <input type="text" name="address" className="input-field" defaultValue={selectedItem?.location?.address || ''} />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update Shop Config</button>
                </div>
              </form>
            )}

            {modalType.startsWith('product-') && (
              <form onSubmit={(e) => handleProductSubmit(e, modalType === 'product-add' ? 'add' : 'edit', selectedItem?.id)}>
                {modalType === 'product-add' && (
                  <div className="input-group">
                    <label className="input-label">Vendor ID</label>
                    <input type="number" name="vendorId" className="input-field" required />
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Product Name</label>
                  <input type="text" name="name" className="input-field" defaultValue={selectedItem?.name || ''} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Price (LKR)</label>
                  <input type="number" step="any" name="price" className="input-field" defaultValue={selectedItem?.price || ''} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select name="category" className="input-field" defaultValue={selectedItem?.category || 'fruit'} style={{ background: '#000' }}>
                    <option value="fruit">fruit</option>
                    <option value="clothing">clothing</option>
                    <option value="electronics">electronics</option>
                    <option value="bakery">bakery</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea name="description" rows="3" className="input-field" defaultValue={selectedItem?.description || ''} style={{ fontFamily: 'inherit', resize: 'vertical' }}></textarea>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Item</button>
                </div>
              </form>
            )}

            {modalType === 'order-edit' && (
              <form onSubmit={(e) => handleOrderSubmit(e, selectedItem?.id)}>
                <div className="input-group">
                  <label className="input-label">Order Status</label>
                  <select name="status" className="input-field" defaultValue={selectedItem?.status || 'pending'} style={{ background: '#000' }}>
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="ready_for_pickup">ready_for_pickup</option>
                    <option value="delivered">delivered</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>

                <div className="modal-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Quantity</label>
                    <input type="number" name="quantity" className="input-field" defaultValue={selectedItem?.quantity || 1} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Total Price (LKR)</label>
                    <input type="number" step="any" name="total_price" className="input-field" defaultValue={selectedItem?.total_price || ''} required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Delivery Type</label>
                  <input type="text" name="delivery_type" className="input-field" defaultValue={selectedItem?.delivery_type || ''} />
                </div>

                <h4 style={{ margin: '1.5rem 0 0.5rem 0', fontFamily: 'var(--font-title)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Delivery Address Details</h4>
                <div className="modal-grid-2col">
                  <div className="input-group">
                    <label className="input-label">Customer Name</label>
                    <input type="text" name="customer_name" className="input-field" defaultValue={selectedItem?.customer_name || ''} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <input type="text" name="customer_phone" className="input-field" defaultValue={selectedItem?.customer_phone || ''} required />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Street Address</label>
                  <input type="text" name="address_line" className="input-field" defaultValue={selectedItem?.address_line || ''} />
                </div>
                <div className="modal-grid-2col">
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input type="text" name="city" className="input-field" defaultValue={selectedItem?.city || ''} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Zip Code</label>
                    <input type="text" name="zip_code" className="input-field" defaultValue={selectedItem?.zip_code || ''} />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update Order</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: AdminLogin
function AdminLogin({ setToken, parseJwt }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Admin authenticates via the main login route
      const response = await axios.post(`${API_GATEWAY}/login`, { email, password });
      const { token } = response.data.data;
      
      // Decode JWT token to check user role
      const decoded = parseJwt(token);
      if (!decoded || decoded.role !== 'admin') {
        setErrorMsg('Access Denied: You do not have administrator privileges.');
        return;
      }
      
      localStorage.setItem('adminToken', token);
      setToken(token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Invalid email/phone or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper flex-center">
      <div className="bg-ambient"></div>
      <div className="glass-card">
        <div className="auth-header">
          <div className="logo-icon flex-center" style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', borderRadius: '18px' }}>
            <Shield size={32} />
          </div>
          <h1>Admin Control</h1>
          <p>Sign in with your platform manager account.</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--error-glow)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 15px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '2.6rem' }}
                placeholder="admin@sme.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2.5rem' }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.6rem' }}
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
