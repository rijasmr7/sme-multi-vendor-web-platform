import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, LayoutDashboard, Activity, LogOut, LogIn, UserPlus, Info, Zap } from 'lucide-react';

const Navbar = ({ vendor, hasShop, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  // Inline styles
  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    fontFamily: "'Outfit', sans-serif"
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '64px'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    textDecoration: 'none'
  };

  const menuStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  };

  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    transition: 'all 0.2s',
    color: isActive(path) ? '#a5b4fc' : '#cbd5e1',
    backgroundColor: isActive(path) ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
  });

  const signInStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#cbd5e1',
    padding: '0.5rem 1rem',
    transition: 'color 0.2s'
  };

  const registerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#6366f1',
    padding: '0.5rem 1.25rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <Link to="/" onClick={closeMenu} style={logoStyle}>
          <Sparkles style={{ height: '24px', width: '24px', color: '#818cf8' }} />
          <span>SME Vendor</span>
        </Link>

        {/* Desktop Menu */}
        {!isMobile && (
          <div style={menuStyle}>
            {!vendor ? (
              <>
                <Link to="/features" style={getLinkStyle('/features')}><Zap size={16} /> Features</Link>
                <Link to="/how-it-works" style={getLinkStyle('/how-it-works')}><Info size={16} /> How it Works</Link>
                
                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                
                <Link to="/login" style={signInStyle}><LogIn size={16} /> Sign In</Link>
                <Link to="/register" style={registerStyle}><UserPlus size={16} /> Register</Link>
              </>
            ) : (
              <>
                <Link to="/" style={getLinkStyle('/')}><Sparkles size={16} /> Generator</Link>
                {hasShop && (
                  <>
                    <Link to="/dashboard" style={getLinkStyle('/dashboard')}><LayoutDashboard size={16} /> Dashboard</Link>
                  </>
                )}
                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                <Link to="/features" style={getLinkStyle('/features')}><Zap size={16} /> Features</Link>
                <Link to="/how-it-works" style={getLinkStyle('/how-it-works')}><Info size={16} /> Docs</Link>
                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#fca5a5', fontSize: '0.9rem', fontWeight: '500',
                    padding: '0.5rem 0.75rem', borderRadius: '8px', transition: 'all 0.2s'
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
          </div>
        )}

        {/* Mobile menu toggle button */}
        {isMobile && (
          <button onClick={toggleMenu} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu Panel */}
      {isMobile && isOpen && (
        <div style={{
          backgroundColor: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {!vendor ? (
            <>
              <Link to="/features" onClick={closeMenu} style={getLinkStyle('/features')}><Zap size={18} /> Features</Link>
              <Link to="/how-it-works" onClick={closeMenu} style={getLinkStyle('/how-it-works')}><Info size={18} /> How it Works</Link>
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <Link to="/login" onClick={closeMenu} style={signInStyle}><LogIn size={18} /> Sign In</Link>
              <Link to="/register" onClick={closeMenu} style={{ ...registerStyle, justifyContent: 'center' }}><UserPlus size={18} /> Register</Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeMenu} style={getLinkStyle('/')}><Sparkles size={18} /> Generator</Link>
              {hasShop && (
                <>
                  <Link to="/dashboard" onClick={closeMenu} style={getLinkStyle('/dashboard')}><LayoutDashboard size={18} /> Dashboard</Link>
                </>
              )}
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <Link to="/features" onClick={closeMenu} style={getLinkStyle('/features')}><Zap size={18} /> Features</Link>
              <Link to="/how-it-works" onClick={closeMenu} style={getLinkStyle('/how-it-works')}><Info size={18} /> Docs</Link>
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                  background: 'rgba(239, 68, 68, 0.15)', border: 'none', cursor: 'pointer',
                  color: '#fca5a5', fontSize: '1rem', fontWeight: '500',
                  padding: '0.75rem 1rem', borderRadius: '8px', transition: 'all 0.2s'
                }}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
