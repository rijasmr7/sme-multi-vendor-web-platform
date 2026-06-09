import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail } from 'lucide-react';

const Footer = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const footerStyle = {
    backgroundColor: '#090d16',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '4rem 1.5rem 2rem',
    fontFamily: "'Outfit', sans-serif",
    color: '#cbd5e1'
  };

  const gridStyle = {
    maxWidth: '1200px',
    margin: '0 auto 3rem',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr',
    gap: '3rem'
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    textDecoration: 'none',
    marginBottom: '0.5rem'
  };

  const headingStyle = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '0.5rem'
  };

  const linkStyle = {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left'
  };

  const hoverLink = (e) => { e.target.style.color = '#818cf8'; };
  const leaveLink = (e) => { e.target.style.color = '#94a3b8'; };

  const bottomStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.85rem',
    color: '#64748b'
  };

  return (
    <footer style={footerStyle}>
      <div style={gridStyle}>
        {/* Brand Col */}
        <div style={columnStyle}>
          <Link to="/" style={logoStyle}>
            <Sparkles style={{ height: '24px', width: '24px', color: '#818cf8' }} />
            <span>SME Vendor</span>
          </Link>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#94a3b8' }}>
            Empowering small and medium enterprises with AI-driven shop generation and advanced analytics.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Twitter</a>
            <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>GitHub</a>
            <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>LinkedIn</a>
          </div>
        </div>

        {/* Product Col */}
        <div style={columnStyle}>
          <h3 style={headingStyle}>Product</h3>
          <Link to="/features" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Features</Link>
          <Link to="/how-it-works" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>How it Works</Link>
          <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Pricing</a>
        </div>

        {/* Resources Col */}
        <div style={columnStyle}>
          <h3 style={headingStyle}>Resources</h3>
          <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Documentation</a>
          <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>API Reference</a>
          <a href="#" style={linkStyle} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Blog</a>
        </div>

        {/* Contact Col */}
        <div style={columnStyle}>
          <h3 style={headingStyle}>Contact</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            <Mail size={16} /> support@smevendor.com
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#94a3b8' }}>
            123 Innovation Drive<br />Tech City, TC 90210
          </p>
        </div>
      </div>

      <div style={bottomStyle}>
        <p>&copy; {new Date().getFullYear()} SME Vendor Platform. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" style={{ ...linkStyle, fontSize: '0.85rem' }} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Privacy Policy</a>
          <a href="#" style={{ ...linkStyle, fontSize: '0.85rem' }} onMouseEnter={hoverLink} onMouseLeave={leaveLink}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
