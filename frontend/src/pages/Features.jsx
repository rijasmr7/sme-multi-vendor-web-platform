import React from 'react';
import { Bot, BarChart3, Globe, Smartphone, Zap, ShieldCheck } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Store Creation",
      description: "Our advanced AI models analyze your business description to generate a complete, customized online store in seconds. Say goodbye to complex website builders."
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics Dashboard",
      description: "Monitor your store's performance with live data. Track visitor counts, conversion rates, and sales trends instantly."
    },
    {
      icon: Globe,
      title: "Global CDN & Fast Hosting",
      description: "Your shop is deployed globally on edge networks, ensuring lightning-fast load times for customers anywhere in the world."
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Every generated store is fully responsive and looks incredible on smartphones, tablets, and desktop computers."
    },
    {
      icon: Zap,
      title: "Instant Inventory Sync",
      description: "Manage your products easily. Changes to inventory or pricing are instantly reflected on your live storefront."
    },
    {
      icon: ShieldCheck,
      title: "Secure Transactions",
      description: "Built-in security ensures all customer data and transactions are encrypted and protected against modern threats."
    }
  ];

  return (
    <div className="features-page">
      <style>{`
        .features-page {
          min-height: 100vh;
          background-color: #0f172a;
          padding-top: 6rem;
          padding-bottom: 6rem;
          color: #cbd5e1;
          font-family: 'Outfit', sans-serif;
        }
        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .features-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 5rem;
        }
        .features-title {
          font-size: 2.75rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.025em;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .features-subtitle {
          font-size: 1.2rem;
          color: #94a3b8;
          line-height: 1.75;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2.5rem;
        }
        .feature-card {
          background-color: #0b0f19;
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .feature-card:hover {
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .icon-wrapper {
          width: 56px;
          height: 56px;
          background-color: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justifyContent: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }
        .feature-card:hover .icon-wrapper {
          background-color: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
          transform: scale(1.05);
        }
        .card-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
        }
        .card-desc {
          font-size: 0.975rem;
          color: #94a3b8;
          line-height: 1.625;
        }
        @media (max-width: 640px) {
          .features-title {
            font-size: 2.25rem;
          }
          .features-page {
            padding-top: 5rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
      <div className="features-container">
        <div className="features-header">
          <h1 className="features-title">
            Powerful Features for Modern SMEs
          </h1>
          <p className="features-subtitle">
            Everything you need to launch, manage, and scale your online business without touching a single line of code.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="feature-card">
                <div className="icon-wrapper">
                  <Icon className="icon" style={{ width: '28px', height: '28px', color: '#818cf8' }} />
                </div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-desc">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Features;
