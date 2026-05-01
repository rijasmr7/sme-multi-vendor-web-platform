import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles, LogIn, LogOut, Package } from 'lucide-react';
import Generator from './Generator';
import Dashboard from './Dashboard';
import VendorAuth from './VendorAuth';
import ProductDashboard from './ProductDashboard';
import './index.css';

function App() {
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const location = useLocation();
  const navigate = useNavigate();

  // Hydrate token from localStorage on first render with strict check
  const [vendor, setVendor] = useState(() => {
    const token = localStorage.getItem('vendorToken');
    return (token && token !== 'null' && token !== 'undefined') ? token : null;
  });

  const [hasShop, setHasShop] = useState(() => {
    const shopFlag = localStorage.getItem('hasShop');
    return shopFlag === 'true' || shopFlag === true;
  });

  useEffect(() => {
    const checkShops = async () => {
      if (vendor && vendor !== 'null' && vendor !== 'undefined') {
        try {
          const parseJwtLocal = (t) => {
            try { return JSON.parse(atob(t.split('.')[1])); } catch (e) { return null; }
          };
          const vendorId = parseJwtLocal(vendor)?.id || 1;
          const res = await fetch(`http://localhost:5000/shops/${vendorId}`);
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            setHasShop(true);
            localStorage.setItem('hasShop', 'true');
          } else {
            setHasShop(false);
            localStorage.setItem('hasShop', 'false');
          }
        } catch (error) {
          console.error("Failed to check shops:", error);
        }
      }
    };
    checkShops();
  }, [vendor]);

  const handleLogin = (token) => {
    setVendor(token);
    // When logging in, we might want to check if they already have a shop, 
    // but for now we'll rely on the Generator to set this.
    setTimeout(() => navigate('/'), 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('hasShop');
    setVendor(null);
    setHasShop(false);
    navigate('/');
  };

  const handleShopGenerated = () => {
    setHasShop(true);
    localStorage.setItem('hasShop', 'true');
  };

  // Helper for nav link styling
  const navLink = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: location.pathname === path ? primaryColor : '#64748b',
    fontWeight: location.pathname === path ? '700' : '500',
    fontSize: '0.9rem',
  });

  return (
    <div className="main-wrapper">
      {/* GLOBAL NAVIGATION BAR — only visible when logged in */}
      {vendor && (
        <nav className="global-nav" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '20px', 
          padding: '1rem', 
          background: 'white', 
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <Link to="/" style={navLink('/')}>
            <Sparkles size={18} />
            Shop Generator
          </Link>
          
          {hasShop && (
            <>
              <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
              <Link to="/dashboard" style={navLink('/dashboard')}>
                <LayoutDashboard size={18} />
                Vendor Dashboard
              </Link>
            </>
          )}

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }}></div>
          <button
            id="nav-logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      )}

      {/* PAGE CONTENT */}
      <Routes>
        {vendor ? (
          <>
            {/* Logged-in routes */}
            <Route 
              path="/" 
              element={<Generator primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} onShopGenerated={handleShopGenerated} />} 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard primaryColor={primaryColor} />} 
            />
            <Route 
              path="/:shopId/dashboard" 
              element={<Dashboard primaryColor={primaryColor} />} 
            />
            <Route 
              path="/products" 
              element={<ProductDashboard />} 
            />
            {/* If logged in and visits auth pages, redirect to home */}
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            {/* Not logged-in: show auth pages only */}
            <Route
              path="/"
              element={<VendorAuth onLogin={handleLogin} defaultMode="register" />}
            />
            <Route
              path="/register"
              element={<VendorAuth onLogin={handleLogin} defaultMode="register" />}
            />
            <Route
              path="/login"
              element={<VendorAuth onLogin={handleLogin} defaultMode="login" />}
            />
            <Route
              path="/auth"
              element={<VendorAuth onLogin={handleLogin} defaultMode="login" />}
            />
            {/* If not logged in and visits protected pages, redirect to register */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </>
        )}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
