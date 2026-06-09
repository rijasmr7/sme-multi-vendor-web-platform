import { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Apple, Shirt, Laptop, Croissant, Sparkles, Box, Loader2, Save, CheckCircle, BarChart3, Users, Menu, ShoppingCart, User, ArrowRight, Search, MapPin, Compass, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Navigate } from 'react-router-dom';
const API_GATEWAY = 'http://localhost:5000';

// Custom Map Marker Icon for Shop Picker
const locationIcon = new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #14b8a6, #0f766e);
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid white; box-shadow: 0 8px 16px rgba(20,184,166,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; transform: translate(-50%, -100%);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <div style="
      width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent;
      border-top: 14px solid #14b8a6; position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 100%);
    "></div>
  `,
  className: 'custom-location-marker',
  iconSize: [40, 54],
  iconAnchor: [20, 54],
  popupAnchor: [0, -60]
});

// Component to handle map clicks
function MapEventsHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

// Component to update map viewport on location changes
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}


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

  // Location-related States
  const [shopLocation, setShopLocation] = useState(null); // { lat, lon, address }
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);

  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingLoc(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  // Live search geocoding suggestions as user types (debounced at 500ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Don't search if the query is the exact address of the current location (prevents loops on selection/reverse-geo)
    if (shopLocation && searchQuery === shopLocation.address) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingLoc(true);
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`
        );
        setSearchResults(response.data);
      } catch (err) {
        console.error("Live geocoding failed", err);
      } finally {
        setIsSearchingLoc(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, shopLocation]);

  const handleSelectSearchResult = (result) => {
    const newLoc = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      address: result.display_name
    };
    setShopLocation(newLoc);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  const handleMapClick = async (latlng) => {
    const { lat, lng } = latlng;
    
    // Set immediate coordinates, address will be resolved shortly
    setShopLocation({ lat, lon: lng, address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (response.data && response.data.display_name) {
        setShopLocation({
          lat,
          lon: lng,
          address: response.data.display_name
        });
        setSearchQuery(response.data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setShopLocation({ lat, lon, address: `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}` });
          
          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            if (response.data && response.data.display_name) {
              setShopLocation({ lat, lon, address: response.data.display_name });
              setSearchQuery(response.data.display_name);
            }
          } catch (err) {
            console.error("Reverse geocoding current location failed", err);
          }
        },
        (error) => {
          console.error("Geolocation request failed", error);
        }
      );
    }
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = windowWidth < 1024;

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
          isPublished: isPublished,
          location: shopLocation
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

  const handleTryAnother = () => {
    setProducts([]);
    setShopData(null);
    setSelectedType('');
    setSuccessMsg('');
    setError('');
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

  const renderStorePreview = (isMobile) => {
    return (
      <div style={{
        background: shopData.theme.background, 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* MINI-SITE NAV */}
        <nav style={{ 
          backgroundColor: shopData.theme.primary, 
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{ fontWeight: '800', fontSize: isMobile ? '1rem' : '1.2rem', display: 'flex', alignItems: 'center' }}>
            <div style={{ background: 'white', color: shopData.theme.primary, padding: '4px', borderRadius: '4px', marginRight: '8px' }}>
              <Store size={14} />
            </div>
            {shopData.shopName}
          </div>
          
          {/* Desktop navigation links (hidden on mobile) */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', opacity: 0.9 }}>
              {shopData.navigation.map(item => <span key={item}>{item}</span>)}
            </div>
          )}

          {/* Right actions container */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <User size={isMobile ? 16 : 18} />
            <ShoppingCart size={isMobile ? 16 : 18} />
            {isMobile && <Menu size={20} style={{ cursor: 'pointer', marginLeft: '2px' }} />}
          </div>
        </nav>

        {/* HERO SECTION */}
        <header style={{ 
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem', 
          textAlign: 'center', 
          background: `linear-gradient(135deg, ${shopData.theme.primary}22, ${shopData.theme.accent}11)`,
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ color: shopData.theme.text, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '800' }}>{shopData.shopName}</h2>
          <p style={{ color: shopData.theme.text, opacity: 0.6, fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
            Welcome to our premium {selectedType} collection.
          </p>
          <button style={{ 
            marginTop: '1rem', 
            backgroundColor: shopData.theme.accent, 
            color: 'white', 
            padding: isMobile ? '0.35rem 0.8rem' : '0.4rem 1rem', 
            borderRadius: '9999px', 
            border: 'none',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            Shop New Arrivals <ArrowRight size={isMobile ? 12 : 14} />
          </button>
        </header>

        {/* PRODUCT GRID PREVIEW */}
        <div style={{ 
          padding: isMobile ? '1rem' : '1.5rem', 
          overflowY: 'auto', 
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? 'repeat(auto-fill, minmax(110px, 1fr))' 
            : (shopData.layout === 'grid' || shopData.layout === 'modern-grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : '1fr'),
          gap: isMobile ? '10px' : '15px'
        }}>
          {shopData.products.map((p, idx) => (
            <div key={idx} style={{ 
              background: 'white', 
              padding: isMobile ? '8px' : '10px', 
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
                <Box size={isMobile ? 24 : 32} />
              </div>
              <h4 style={{ color: shopData.theme.text, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '600', margin: 0 }}>{p.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <span style={{ color: shopData.theme.primary, fontWeight: '700', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>${p.price}</span>
                <div style={{ background: shopData.theme.primary, color: 'white', padding: isMobile ? '3px' : '4px', borderRadius: '4px' }}>
                  <ShoppingCart size={isMobile ? 10 : 12} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MINI FOOTER */}
        <footer style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.7rem', color: shopData.theme.text, opacity: 0.4, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          © 2026 {shopData.shopName}. All rights reserved.
        </footer>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Shop Generator</h1>
        <p className="subtitle">Architect your digital brand with AI-driven RAG logic.</p>
      </header>

      {/* DASHBOARD WIDGETS */}
      {stats && (
        <section className="dashboard-widget" style={{ display: 'flex', justifyContent: 'center', gridTemplateColumns: 'none' }}>
          <div className="stat-card" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', gap: '0.75rem' }}>
            <div className="stat-icon text-secondary" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '50%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={32} />
            </div>
            <div className="stat-content">
              <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>Platform Statistics</h3>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', margin: '0.5rem 0' }}>
                Trusted by {stats.totalShops} active shops
              </p>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Empowering modern SMEs with AI storefronts</span>
            </div>
          </div>
        </section>
      )}

      {!isLoading && !successMsg && products.length > 0 && shopData ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <button 
            onClick={handleTryAnother} 
            className="save-btn" 
            style={{ 
              background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
              padding: '0.8rem 2.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 10px 20px -10px rgba(20, 184, 166, 0.5)',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              transition: 'all 0.3s ease'
            }}
          >
            <Sparkles size={18} />
            Try Another
          </button>
        </div>
      ) : (
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

          {/* Location Picker (Optional) */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <div className="label" style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MapPin className="text-accent" size={20} style={{ color: '#14b8a6' }} />
                <span style={{marginLeft: '0.5rem', fontWeight: '600'}}>2. Enter Shop Location (Optional)</span>
              </div>
              {shopLocation && (
                <button 
                  type="button"
                  onClick={() => { setShopLocation(null); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <Trash2 size={14} /> Clear Location
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '-4px', marginBottom: '12px' }}>
              Enter your location for your customers to easily find you on the map.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Search location (e.g. 5th Avenue, New York)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchLocation();
                  }
                }}
                className="input-field"
                style={{ flex: 1, fontSize: '1rem', padding: '0.6rem 0.8rem' }}
              />
              <button 
                type="button"
                onClick={handleSearchLocation}
                disabled={isSearchingLoc}
                style={{ 
                  background: 'linear-gradient(135deg, #14b8a6, #0f766e)',
                  border: 'none', color: 'white', padding: '0 1.2rem',
                  borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {isSearchingLoc ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
              <button 
                type="button"
                onClick={handleUseCurrentLocation}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', padding: '0 1rem',
                  borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
                title="Use Current Location"
              >
                <Compass size={16} />
              </button>
            </div>

            {/* Suggestions list */}
            {searchResults.length > 0 && (
              <div style={{ 
                position: 'absolute', zIndex: 1000, left: '1.5rem', right: '1.5rem',
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
              }}>
                {searchResults.map((result) => (
                  <div 
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    style={{ 
                      padding: '10px 15px', color: '#e2e8f0', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {result.display_name}
                  </div>
                ))}
              </div>
            )}

            {/* Map container */}
            <div style={{ height: '220px', width: '100%', borderRadius: '10px', overflow: 'hidden', marginTop: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 0 }}>
              <MapContainer 
                center={shopLocation ? [shopLocation.lat, shopLocation.lon] : [6.9271, 79.8612]} 
                zoom={shopLocation ? 14 : 10} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapEventsHandler onClick={handleMapClick} />
                {shopLocation && (
                  <>
                    <MapCenterUpdater center={[shopLocation.lat, shopLocation.lon]} />
                    <Marker position={[shopLocation.lat, shopLocation.lon]} icon={locationIcon} />
                  </>
                )}
              </MapContainer>
            </div>

            {shopLocation && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '10px', color: '#14b8a6', fontWeight: '600' }}>
                  <span>Lat: {shopLocation.lat.toFixed(6)}</span>
                  <span>Lon: {shopLocation.lon.toFixed(6)}</span>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  <strong>Selected Address:</strong> {shopLocation.address}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="label" style={{ marginBottom: 0 }}>
              <Store className="mr-2 text-primary" size={20} />
              <span style={{marginLeft: '0.5rem', fontWeight: '600'}}>3. Select Business Type to Generate</span>
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
      )}

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
        <div className="workspace-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobileLayout ? '1fr' : '1fr 1.6fr', 
          gap: '2.5rem', 
          marginTop: '2rem',
          width: '100%',
          maxWidth: '1400px'
        }}>
          
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

          {/* RIGHT: Dual Previews (Desktop & Mobile) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2.5rem', 
            position: isMobileLayout ? 'static' : 'sticky', 
            top: '20px',
            alignSelf: 'start',
            width: '100%'
          }}>
            {/* Desktop Preview Frame */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)', 
              background: '#1e293b' 
            }}>
              {/* Fake Browser Top Bar */}
              <div style={{ 
                background: '#0f172a', 
                padding: '10px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                borderBottom: '1px solid rgba(255,255,255,0.05)' 
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    background: '#1e293b', 
                    color: '#94a3b8', 
                    fontSize: '0.75rem', 
                    padding: '2px 30px', 
                    borderRadius: '4px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '300px'
                  }}>
                    https://{shopData.shopName.toLowerCase().replace(/\s+/g, '-')}.smevendor.com
                  </div>
                </div>
                <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desktop Preview</span>
              </div>
              
              {/* Preview Viewport */}
              <div style={{ height: '380px', overflowY: 'auto' }}>
                {renderStorePreview(false)}
              </div>
            </div>

            {/* Mobile Preview Frame */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ 
                width: '100%',
                maxWidth: '340px', 
                borderRadius: '32px', 
                border: '8px solid #334155', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                overflow: 'hidden', 
                background: '#1e293b',
                position: 'relative'
              }}>
                {/* Fake Phone Status Bar */}
                <div style={{ 
                  background: '#0f172a', 
                  height: '26px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0 20px', 
                  fontSize: '0.7rem', 
                  color: '#94a3b8', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)' 
                }}>
                  <span>9:41 AM</span>
                  <div style={{ 
                    background: '#000', 
                    width: '70px', 
                    height: '14px', 
                    borderRadius: '0 0 10px 10px', 
                    position: 'absolute', 
                    top: 0, 
                    left: '50%', 
                    transform: 'translateX(-50%)' 
                  }}></div>
                  <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>5G</span>
                    <span style={{ 
                      width: '16px', 
                      height: '8px', 
                      border: '1px solid #94a3b8', 
                      borderRadius: '2px', 
                      display: 'inline-block', 
                      position: 'relative' 
                    }}>
                      <span style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        bottom: 0, 
                        right: '2px', 
                        background: '#94a3b8' 
                      }}></span>
                    </span>
                  </span>
                </div>
                
                {/* Preview Viewport */}
                <div style={{ height: '480px', overflowY: 'auto' }}>
                  {renderStorePreview(true)}
                </div>
              </div>
              <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Mobile Preview</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Generator;
