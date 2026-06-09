import React from 'react';
import { UserPlus, Sparkles, LayoutDashboard, Rocket } from 'lucide-react';

const Step = ({ number, icon: Icon, title, description }) => (
  <div className="step-item">
    <div className="step-connector"></div>
    <div className="step-icon-wrapper">
      <Icon className="step-icon" style={{ width: '28px', height: '28px' }} />
      <div className="step-number-badge">
        {number}
      </div>
    </div>
    <div className="step-content-card">
      <h3 className="step-title">{title}</h3>
      <p className="step-desc">
        {description}
      </p>
    </div>
  </div>
);

const HowItWorks = () => {
  return (
    <div className="how-it-works-page">
      <style>{`
        .how-it-works-page {
          min-height: 100vh;
          background-color: #0f172a;
          padding-top: 6rem;
          padding-bottom: 6rem;
          color: #cbd5e1;
          font-family: 'Outfit', sans-serif;
        }
        .how-it-works-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .how-it-works-header {
          text-align: center;
          margin-bottom: 5rem;
        }
        .how-it-works-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .how-it-works-subtitle {
          font-size: 1.2rem;
          color: #94a3b8;
          line-height: 1.75;
        }
        .steps-list {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }
        .step-item {
          position: relative;
          display: flex;
          gap: 2.5rem;
        }
        .step-connector {
          position: absolute;
          left: 2rem;
          top: 4rem;
          bottom: -4rem;
          width: 2px;
          background-color: rgba(255, 255, 255, 0.05);
          z-index: 1;
        }
        .step-item:last-child .step-connector {
          display: none;
        }
        .step-icon-wrapper {
          position: relative;
          z-index: 2;
          flex-shrink: 0;
          width: 4rem;
          height: 4rem;
          border-radius: 16px;
          background-color: #6366f1;
          color: #ffffff;
          display: flex;
          align-items: center;
          justifyContent: center;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }
        .step-number-badge {
          position: absolute;
          top: -0.5rem;
          right: -0.5rem;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background-color: #0f172a;
          border: 2px solid #6366f1;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #818cf8;
        }
        .step-content-card {
          flex-grow: 1;
          background-color: #0b0f19;
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-content-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateX(6px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }
        .step-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.75rem;
        }
        .step-desc {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.625;
        }
        @media (max-width: 768px) {
          .step-item {
            flex-direction: column;
            gap: 1.25rem;
          }
          .step-connector {
            display: none;
          }
          .step-icon-wrapper {
            width: 3.5rem;
            height: 3.5rem;
          }
          .step-content-card {
            padding: 1.5rem;
          }
          .how-it-works-title {
            font-size: 2.25rem;
          }
          .how-it-works-page {
            padding-top: 5rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
      <div className="how-it-works-container">
        <div className="how-it-works-header">
          <h1 className="how-it-works-title">
            How It Works
          </h1>
          <p className="how-it-works-subtitle">
            Four simple steps to launch your dream online store.
          </p>
        </div>

        <div className="steps-list">
          <Step 
            number="1"
            icon={UserPlus}
            title="Create an Account"
            description="Sign up for free in seconds. We just need your basic details to create your secure vendor workspace."
          />
          <Step 
            number="2"
            icon={Sparkles}
            title="Describe Your Shop"
            description="Use our AI Shop Generator. Simply tell us what you sell, your target audience, and your preferred vibe. Our AI will draft a complete storefront in real-time."
          />
          <Step 
            number="3"
            icon={LayoutDashboard}
            title="Manage Products"
            description="Head over to your Vendor Dashboard. Here you can add new products, update prices, and manage your inventory with ease."
          />
          <Step 
            number="4"
            icon={Rocket}
            title="Launch & Analyze"
            description="Your shop goes live instantly! Use the Live Analytics dashboard to monitor traffic, track sales, and grow your business using real-time data."
          />
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
