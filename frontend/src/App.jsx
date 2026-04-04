import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Apple, Shirt, Laptop, Croissant, Sparkles, Box, Loader2, Save, CheckCircle, BarChart3, DollarSign, Tag } from 'lucide-react';
import './index.css';

const API_GATEWAY = 'http://localhost:5000';

function App() {
  const [selectedType, setSelectedType] = useState('');
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null); // Step 12: Analytics Dashboard state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Analytics Stats from Gateway
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_GATEWAY}/stats`);
      if (response.data.success) {
        setStats(response.data.dashboard);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  };

  // Load stats automatically when the app first opens
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
    setSelectedType(type.id);
    setProducts([]);
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // ✅ Now hitting the REAL Gemini AI endpoint through the Gateway!
      const response = await axios.get(`${API_GATEWAY}/generate-ai/${type.id}`);
      
      const formattedProducts = response.data.data.products.map((product, index) => ({
        id: index + 1,
        name: product.name,
        // AI now generates real prices for us securely!
        price: product.price 
      }));

      setProducts(formattedProducts);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError('Failed to generate AI suggestions. Check if your AI Service and Gateway are running.');
    }
  };

  const handleProductChange = (productId, field, value) => {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === productId ? { ...p, [field]: value } : p)
    );
  };

  // 3. Save products to Catalog
  const handleSaveToCatalog = async () => {
    setIsSaving(true);
    setSuccessMsg('');
    setError('');

    try {
      for (const product of products) {
        if (product.name.trim() === '') continue;

        const productData = {
          name: product.name,
          price: parseFloat(product.price) || 0,
          category: selectedType
        };

        await axios.post(`${API_GATEWAY}/products`, productData);
      }

      setSuccessMsg('Successfully saved! Your new items are in the catalog.');
      setIsSaving(false);
      
      // ✅ Step 12: Magic Refresh! Update the top dashboard widgets dynamically!
      fetchStats();

    } catch (err) {
      setError('Failed to save to catalog. Check backend terminal.');
      setIsSaving(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">SME AI Platform</h1>
        <p className="subtitle">Let AI build your catalog context, edit prices, and launch.</p>
      </header>

      {/* DASHBOARD WIDGETS */}
      {stats && (
        <section className="dashboard-widget">
          <div className="stat-card">
            <div className="stat-icon"><Box size={32} /></div>
            <div className="stat-content">
              <h3>Live Catalog</h3>
              <p>{stats.totalProducts} Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon text-accent"><DollarSign size={32} /></div>
            <div className="stat-content">
              <h3>Total Value</h3>
              <p>{stats.totalInventoryValue}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon text-secondary"><Tag size={32} /></div>
            <div className="stat-content">
              <h3>Avg. Price</h3>
              <p>{stats.averageProductPrice}</p>
            </div>
          </div>
        </section>
      )}

      <main className="selection-container">
        <div className="label">
          <Store className="mr-2 text-primary" size={20} />
          <span style={{marginLeft: '0.5rem'}}>Generate New Inventory using AI</span>
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
        <div className="loading">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p>AI is architecting your perfect inventory...</p>
        </div>
      )}

      {error && (
        <div className="empty-state text-red-400 border-red-500/30">
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="empty-state text-green-400 border-green-500/30 font-semibold flex flex-col items-center">
          <CheckCircle size={40} className="mb-2 text-green-400" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Editable Results Section */}
      {!isLoading && !successMsg && products.length > 0 && (
        <section className="results-container">
          <div className="results-header">
            <Sparkles className="text-accent" size={24} />
            <h2>Interactive AI Draft</h2>
          </div>
          
          <div className="results-grid">
            {products.map((product, index) => (
              <div key={product.id} className="product-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="product-header">
                  <div className="icon-box">
                    <BarChart3 size={24} />
                  </div>
                  <span className="text-muted font-light text-sm">AI Item #{index + 1}</span>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Product Name</label>
                  <input 
                    type="text" 
                    value={product.name}
                    onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Suggested Price ($)</label>
                  <input 
                    type="number" 
                    value={product.price}
                    onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                    className="input-field"
                    step="0.01"
                  />
                </div>

              </div>
            ))}
          </div>

          <div className="save-btn-container">
            <button 
              className="save-btn" 
              onClick={handleSaveToCatalog}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Saving...' : 'Approve & Save to Catalog'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
