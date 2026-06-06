import React, { useEffect, useState } from 'react';
import { Eye, ShoppingCart, Cuboid, MousePointer2 } from 'lucide-react';

const Card = ({ title, value, icon: Icon, color, bgAccent }) => {
  // Add a simple pop animation effect when value changes
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group transition-all hover:border-slate-600">
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${bgAccent}`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-4xl font-bold transition-transform duration-300 text-white ${animate ? 'scale-110 text-brand-DEFAULT' : 'scale-100'}`}>
              {value.toLocaleString()}
            </h3>
            {animate && <span className="text-xs text-brand-DEFAULT font-bold animate-bounce">+1</span>}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${bgAccent} bg-opacity-20`}>
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );
};

const AnalyticsCards = ({ stats }) => {
  // We mock some of the specific counters based on total events for demonstration,
  // or use the real stats passed from LiveDashboard.
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card 
        title="Live Viewers (5m)" 
        value={stats.activeViewers || 0} 
        icon={Eye} 
        color="text-blue-400"
        bgAccent="bg-blue-500"
      />
      <Card 
        title="Total Events Processed" 
        value={stats.totalEvents || 0} 
        icon={MousePointer2} 
        color="text-brand-DEFAULT"
        bgAccent="bg-brand-DEFAULT"
      />
      <Card 
        title="Orders Created" 
        value={Math.floor((stats.totalEvents || 0) * 0.05)} // Mock ratio for demo
        icon={ShoppingCart} 
        color="text-emerald-400"
        bgAccent="bg-emerald-500"
      />
      <Card 
        title="AR Sessions Opened" 
        value={Math.floor((stats.totalEvents || 0) * 0.15)} // Mock ratio for demo
        icon={Cuboid} 
        color="text-purple-400"
        bgAccent="bg-purple-500"
      />
    </div>
  );
};

export default AnalyticsCards;
