import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles, LogIn, LogOut, Package, Activity } from 'lucide-react';
import Generator from './Generator';
import Dashboard from './Dashboard';
import VendorAuth from './VendorAuth';
import LiveDashboard from './components/LiveDashboard';
import ProductDashboard from './ProductDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
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
    <div className="main-wrapper flex flex-col min-h-screen">
      <Navbar 
        vendor={vendor} 
        hasShop={hasShop} 
        handleLogout={handleLogout} 
        primaryColor={primaryColor} 
      />

      <div className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/features" element={<><Features /><Footer /></>} />
          <Route path="/how-it-works" element={<><HowItWorks /><Footer /></>} />

          {/* Root route: conditionally render LandingPage or Generator */}
          <Route 
            path="/" 
            element={vendor ? (
              <Generator primaryColor={primaryColor} setPrimaryColor={setPrimaryColor} onShopGenerated={handleShopGenerated} />
            ) : (
              <><LandingPage /><Footer /></>
            )} 
          />

          {/* Authentication routes */}
          <Route
            path="/register"
            element={vendor ? <Navigate to="/" replace /> : <VendorAuth onLogin={handleLogin} defaultMode="register" />}
          />
          <Route
            path="/login"
            element={vendor ? <Navigate to="/" replace /> : <VendorAuth onLogin={handleLogin} defaultMode="login" />}
          />
          <Route
            path="/auth"
            element={vendor ? <Navigate to="/" replace /> : <VendorAuth onLogin={handleLogin} defaultMode="login" />}
          />

          {/* Protected dashboard routes */}
          <Route 
            path="/dashboard" 
            element={vendor ? <Dashboard primaryColor={primaryColor} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/live-dashboard" 
            element={vendor ? <LiveDashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/:shopId/dashboard" 
            element={vendor ? <Dashboard primaryColor={primaryColor} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/:shopId/products/add" 
            element={vendor ? <AddProduct /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/:shopId/products/edit/:productId" 
            element={vendor ? <EditProduct /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/products" 
            element={vendor ? <ProductDashboard /> : <Navigate to="/login" replace />} 
          />

          {/* Catch-all redirect */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
