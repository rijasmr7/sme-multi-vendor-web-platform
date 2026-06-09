import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, BarChart3, Globe, ShieldCheck, Zap } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon-wrapper">
      <Icon className="feature-icon" style={{ width: '24px', height: '24px' }} />
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">
      {description}
    </p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100vh;
          background-color: #0f172a;
          color: #cbd5e1;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
        }
        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 8rem 1.5rem 6rem;
          background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 45%),
                      radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.08), transparent 45%),
                      #0f172a;
        }
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          background-color: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: #a5b4fc;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 2.5rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hero-title {
          font-size: 3.75rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 2rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .gradient-text {
          background: linear-gradient(to right, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: #94a3b8;
          line-height: 1.75;
          max-width: 700px;
          margin: 0 auto 3rem;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.25rem;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          background-color: #6366f1;
          color: #ffffff;
          font-weight: 600;
          font-size: 1.1rem;
          text-decoration: none;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          background-color: #4f46e5;
          box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.45);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2rem;
          border-radius: 12px;
          background-color: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-weight: 600;
          font-size: 1.1rem;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background-color: #1e293b;
          border-color: rgba(255, 255, 255, 0.15);
        }
        .features-section {
          padding: 7rem 1.5rem;
          background-color: #0f172a;
        }
        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .section-header {
          text-align: center;
          margin-bottom: 4.5rem;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }
        .section-subtitle {
          font-size: 1.15rem;
          color: #94a3b8;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          text-align: left;
        }
        .feature-card {
          background-color: #0b0f19;
          border-radius: 20px;
          padding: 2.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .feature-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .feature-icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: 12px;
          background-color: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justifyContent: center;
          margin-bottom: 1.5rem;
          color: #818cf8;
          transition: all 0.3s ease;
        }
        .feature-card:hover .feature-icon-wrapper {
          background-color: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        .feature-desc {
          font-size: 0.95rem;
          color: #94a3b8;
          line-height: 1.625;
        }
        .view-more-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #818cf8;
          font-weight: 600;
          text-decoration: none;
          margin-top: 3.5rem;
          transition: color 0.2s;
        }
        .view-more-link:hover {
          color: #a5b4fc;
        }
        .cta-section {
          position: relative;
          background-color: #090d16;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 6.5rem 1.5rem;
          text-align: center;
          overflow: hidden;
        }
        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 1.25rem;
        }
        .cta-subtitle {
          font-size: 1.15rem;
          color: #cbd5e1;
          margin-bottom: 2.5rem;
          line-height: 1.65;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .btn-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2.25rem;
          border-radius: 12px;
          background-color: #ffffff;
          color: #4f46e5;
          font-weight: 700;
          font-size: 1.1rem;
          text-decoration: none;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .btn-cta:hover {
          transform: translateY(-2px);
          background-color: #f8fafc;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-subtitle {
            font-size: 1.1rem;
          }
          .cta-buttons {
            flex-direction: column;
            width: 100%;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .hero-section {
            padding-top: 6rem;
            padding-bottom: 4rem;
          }
          .section-title {
            font-size: 2rem;
          }
          .cta-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <main>
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-container">
            <div className="hero-badge">
              <Zap style={{ width: '16px', height: '16px', color: '#818cf8' }} />
              <span>Next-Gen Vendor Platform</span>
            </div>
            <h1 className="hero-title">
              Build your online store with <span className="gradient-text">AI Power</span>
            </h1>
            <p className="hero-subtitle">
              Launch, manage, and scale your SME business instantly. Let AI handle your inventory, design, and analytics while you focus on growth.
            </p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary">
                Get Started Free
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </Link>
              <Link to="/how-it-works" className="btn-secondary">
                See How it Works
              </Link>
            </div>
          </div>
        </div>

        {/* Features Preview Section */}
        <div className="features-section">
          <div className="features-container">
            <div className="section-header">
              <h2 className="section-title">Everything you need to succeed</h2>
              <p className="section-subtitle">
                Our platform provides a comprehensive suite of tools designed specifically for modern Small and Medium Enterprises.
              </p>
            </div>

            <div className="features-grid">
              <FeatureCard 
                icon={Bot}
                title="AI Shop Generator"
                description="Describe your business, and our AI instantly generates a fully customized, responsive storefront tailored to your brand."
              />
              <FeatureCard 
                icon={BarChart3}
                title="Real-time Analytics"
                description="Track visitors, sales, and customer behavior with our intuitive, live dashboard. Make data-driven decisions instantly."
              />
              <FeatureCard 
                icon={Globe}
                title="Global Reach"
                description="Optimized for search engines and mobile devices, ensuring your shop looks great and performs perfectly everywhere."
              />
            </div>
            
            <div>
              <Link to="/features" className="view-more-link">
                View all features <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to transform your business?</h2>
            <p className="cta-subtitle">
              Join thousands of other SMEs who have scaled their operations using our AI-driven platform. Setup takes less than 5 minutes.
            </p>
            <Link to="/register" className="btn-cta">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
