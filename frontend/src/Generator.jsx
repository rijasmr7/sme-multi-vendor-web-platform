import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Apple, Shirt, Laptop, Croissant, Sparkles, Box, Loader2, Save, CheckCircle, BarChart3, Users, Menu, ShoppingCart, User, ArrowRight } from 'lucide-react';

import { Navigate } from 'react-router-dom';
const API_GATEWAY = 'http://localhost:5000';

function Generator({ primaryColor, setPrimaryColor, onShopGenerated }) {
  const token = localStorage.getItem('vendorToken');
  if (!token || token === 'null' || token === 'undefined') {
    return <Navigate to="/register" replace />;
  }
  const [shopName, setShopName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [products, setProducts] = useState([]);
  const [shopData, setShopData] = useState(null); // Full AI Shop Configuration
  const [stats, setStats] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('vendorToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // 1. Fetch Analytics Stats from Gateway
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_GATEWAY}/stats`, getAuthHeaders());
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const businessTypes = [
    { id: 'fruit', label: 'Fruit Shop', icon: <Apple size={24} /> },
    { id: 'clothing', label: 'Clothing', icon: <Shirt size={24} /> },
    { id: 'electronics', label: 'Electronics', icon: <Laptop size={24} /> },
    { id: 'bakery', label: 'Bakery', icon: <Croissant size={24} /> }
  ];

  // 2. Fetch True AI Suggestions
  const handleSelectBusiness = async (type) => {
    if (!shopName.trim()) {
      setError('Please enter a Shop Name first!');
      return;
    }

    setSelectedType(type.id);
    setProducts([]);
    setShopData(null);
    setError('');
    setSuccessMsg('');
    
    // Helper to get vendor ID from token
    const parseJwtLocal = (token) => {
      try { return JSON.parse(atob(token.split('.')[1])); } 
      catch (e) { return null; }
    };
    
    const token = localStorage.getItem('vendorToken');
    const vendorId = token ? parseJwtLocal(token)?.id : 1;

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_GATEWAY}/generate-shop`, {
        businessType: type.id,
        vendorId,
        shopName, // Pass the manual shop name from the input field
        primaryColor: primaryColor
      }, getAuthHeaders());
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Generation failed');
      }

      // Standardized response from upgraded ai-service
      const data = response.data.data;
      setShopData(data);

      const formattedProducts = data.products.map((product, index) => ({
        id: index + 1,
        name: product.name,
        price: product.price,
        description: product.description || ''
      }));

      setProducts(formattedProducts);
      setIsLoading(false);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setIsLoading(false);
      const msg = err.response?.data?.message || 'Failed to generate AI suggestions. Ensure your services are running.';
      setError(msg);
    }
  };

  const handleProductChange = (productId, field, value) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === productId ? { ...p, [field]: value } : p)
    );
    // Sync with shopData products for the live preview
    setShopData(prev => ({
      ...prev,
      products: prev.products.map((p, idx) => (idx + 1 === productId ? { ...p, [field]: value } : p))
    }));
  };

  // 3. Save products to Catalog
  const handleSaveToCatalog = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setError('');

    try {
      const token = localStorage.getItem('vendorToken');
      const parseJwtLocal = (token) => {
        try { return JSON.parse(atob(token.split('.')[1])); } 
        catch (e) { return null; }
      };
      const VENDOR_ID = token ? parseJwtLocal(token)?.id : 1;

      for (const product of products) {
        if (product.name.trim() === '') continue;

        const productData = {
          vendorId: VENDOR_ID,
          name: product.name,
          price: parseFloat(product.price) || 0,
          category: selectedType,
          description: product.description
        };

        const res = await axios.post(`${API_GATEWAY}/products`, productData, getAuthHeaders());
        if (!res.data.success) throw new Error(res.data.message);
      }

      // Save the shop configuration
      if (shopData) {
        const saveShopRes = await axios.post(`${API_GATEWAY}/save-shop`, {
          vendorId: VENDOR_ID,
          shopName: shopData.shopName,
          config: shopData,
          isPublished: isPublished
        }, getAuthHeaders());
        if (!saveShopRes.data.success) throw new Error(saveShopRes.data.message);
      }

      if (onShopGenerated) onShopGenerated();
      setSuccessMsg(`Successfully saved! Items are in the catalog for Vendor #${VENDOR_ID}.`);
      setIsSaving(false);
      fetchStats();

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save to catalog.';
      setError(msg);
      setIsSaving(false);
    }
  };

  const loadingSteps = [
    "Analyzing industry trends...",
    "Curating optimized products...",
    "Designing smart layout...",
    "Finalizing digital storefront..."
  ];
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStepIndex(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 800);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Shop Generator</h1>
        <p className="subtitle">Architect your digital brand with AI-driven RAG logic.</p>
      </header>

      {/* DASHBOARD WIDGETS */}
      {stats && (
        <section className="dashboard-widget">
          <div className="stat-card">
            <div className="stat-icon"><Users size={32} /></div>
            <div className="stat-content">
              <h3>Total Vendors</h3>
              <p>{stats.totalVendors}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon text-accent"><Box size={32} /></div>
            <div className="stat-content">
              <h3>Total Products</h3>
              <p>{stats.totalProducts}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon text-secondary"><Store size={32} /></div>
            <div className="stat-content">
              <h3>AI Shops</h3>
              <p>{stats.totalShops}</p>
            </div>
          </div>
        </section>
      )}

      <main className="selection-container">
        <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="label" style={{ marginBottom: '0.8rem' }}>
            <Sparkles className="mr-2 text-accent" size={20} />
            <span style={{marginLeft: '0.5rem', fontWeight: '600'}}>1. Enter your Shop Name</span>
          </div>
          <input 
            type="text" 
            placeholder="e.g. Sunny Fruits Market"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="input-field"
            style={{ fontSize: '1.1rem', padding: '0.8rem 1rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="label" style={{ marginBottom: 0 }}>
            <Store className="mr-2 text-primary" size={20} />
            <span style={{marginLeft: '0.5rem', fontWeight: '600'}}>2. Select Business Type to Generate</span>
          </div>

          <div className="color-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="text-muted text-sm">Theme Color:</span>
            <input 
              type="color" 
              value={primaryColor} 
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{ cursor: 'pointer', border: 'none', background: 'none', width: '30px', height: '30px' }}
            />
          </div>
        </div>
        
        <div className="options-grid">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelectBusiness(type)}
              className={`option-btn ${selectedType === type.id ? 'active' : ''}`}
            >
              {type.icon}
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </main>

      {isLoading && (
        <div className="loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(30, 41, 59, 0.7)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', marginBottom: '2rem' }}>
          <Loader2 size={40} className="animate-spin mb-4 text-accent" />
          <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff' }}>{loadingSteps[loadingStepIndex]}</p>
          <div style={{ display: 'flex', gap: '5px', marginTop: '1rem' }}>
            {loadingSteps.map((_, i) => (
              <div key={i} style={{ height: '4px', width: '20px', borderRadius: '2px', background: i <= loadingStepIndex ? '#14b8a6' : 'rgba(255,255,255,0.2)', transition: 'background 0.3s' }}></div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state border-red-500/30" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="empty-state border-green-500/30 font-semibold flex flex-col items-center">
          <CheckCircle size={40} className="mb-2" style={{ color: '#22c55e' }} />
          <p style={{ color: '#ffffff' }}>{successMsg}</p>
        </div>
      )}

      {/* Editable Results & Mini-Site Preview Section */}
      {!isLoading && !successMsg && products.length > 0 && shopData && (
        <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          
          {/* LEFT: Editor Area */}
          <section className="results-container" style={{ marginTop: 0 }}>
            <div className="results-header">
              <Sparkles className="text-accent" size={24} />
              <h2>Interactive AI Draft</h2>
            </div>
            
            <div className="results-grid" style={{ gridTemplateColumns: '1fr' }}>
              {products.map((product, index) => (
                <div key={product.id} className="generator-product-card" style={{animationDelay: `${index * 0.05}s`, marginBottom: '1.2rem', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderLeft: '4px solid #14b8a6', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ color: '#14b8a6', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Name</label>
                    <input 
                      type="text" 
                      value={product.name}
                      onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                      className="input-field"
                      style={{ background: 'rgba(0, 0, 0, 0.3)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', width: '100%', fontSize: '1rem', transition: 'all 0.3s ease' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginTop: '0.8rem' }}>
                    <label className="input-label" style={{ color: '#14b8a6', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price ($)</label>
                    <input 
                      type="number" 
                      value={product.price}
                      onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                      className="input-field"
                      step="0.01"
                      style={{ background: 'rgba(0, 0, 0, 0.3)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', width: '100%', fontSize: '1rem', transition: 'all 0.3s ease' }}
                    />
                  </div>

                  <div className="input-group" style={{ marginTop: '0.8rem' }}>
                    <label className="input-label" style={{ color: '#14b8a6', fontWeight: '700', marginBottom: '6px', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                    <textarea 
                      value={product.description}
                      onChange={(e) => handleProductChange(product.id, 'description', e.target.value)}
                      className="input-field"
                      rows="2"
                      style={{ background: 'rgba(0, 0, 0, 0.3)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem 1rem', borderRadius: '10px', width: '100%', fontSize: '0.9rem', transition: 'all 0.3s ease', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="save-btn-container" style={{ flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', fontSize: '1rem', fontWeight: '600' }}>
                <input 
                  type="checkbox" 
                  checked={isPublished} 
                  onChange={(e) => setIsPublished(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#14b8a6' }}
                />
                Publish shop immediately to customer marketplace
              </label>
              
              <button className="save-btn" onClick={handleSaveToCatalog} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? 'Saving...' : 'Approve & Save to Catalog'}
              </button>
            </div>
          </section>

          {/* RIGHT: Mini-Site Live Preview */}
          <section className="preview-area" style={{ 
            background: shopData.theme.background, 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '800px',
            position: 'sticky',
            top: '20px'
          }}>
            {/* MINI-SITE NAV */}
            <nav style={{ 
              backgroundColor: shopData.theme.primary, 
              padding: '1rem 1.5rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              color: 'white'
            }}>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                <div style={{ background: 'white', color: shopData.theme.primary, padding: '4px', borderRadius: '4px', marginRight: '8px' }}>
                  <Store size={16} />
                </div>
                {shopData.shopName}
              </div>
              <div style={{ display: 'none' }}>
                <Menu size={20} />
              </div>
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', opacity: 0.9 }}>
                {shopData.navigation.map(item => <span key={item}>{item}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <User size={18} />
                <ShoppingCart size={18} />
              </div>
            </nav>

            {/* HERO SECTION */}
            <header style={{ 
              padding: '2rem 1.5rem', 
              textAlign: 'center', 
              background: `linear-gradient(135deg, ${shopData.theme.primary}22, ${shopData.theme.accent}11)`,
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ color: shopData.theme.text, fontSize: '1.5rem', fontWeight: '800' }}>{shopData.shopName}</h2>
              <p style={{ color: shopData.theme.text, opacity: 0.6, fontSize: '0.9rem' }}>Welcome to our premium {selectedType} collection.</p>
              <button style={{ 
                marginTop: '1rem', 
                backgroundColor: shopData.theme.accent, 
                color: 'white', 
                padding: '0.4rem 1rem', 
                borderRadius: 'full', 
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                Shop New Arrivals <ArrowRight size={14} />
              </button>
            </header>

            {/* PRODUCT GRID PREVIEW */}
            <div style={{ 
              padding: '1.5rem', 
              overflowY: 'auto', 
              flex: 1,
              display: 'grid',
              gridTemplateColumns: shopData.layout === 'grid' || shopData.layout === 'modern-grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : '1fr',
              gap: '15px'
            }}>
              {shopData.products.map((p, idx) => (
                <div key={idx} style={{ 
                  background: 'white', 
                  padding: '10px', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1', 
                    background: `${shopData.theme.secondary}22`, 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: shopData.theme.accent,
                    marginBottom: '8px'
                  }}>
                    <Box size={32} />
                  </div>
                  <h4 style={{ color: shopData.theme.text, fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>{p.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{ color: shopData.theme.primary, fontWeight: '700', fontSize: '0.9rem' }}>${p.price}</span>
                    <div style={{ background: shopData.theme.primary, color: 'white', padding: '4px', borderRadius: '4px' }}>
                      <ShoppingCart size={12} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MINI FOOTER */}
            <footer style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.7rem', color: shopData.theme.text, opacity: 0.4, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              © 2026 {shopData.shopName}. All rights reserved.
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Generator;
