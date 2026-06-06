import React from 'react';
import { Eye, ShoppingCart, Box, MousePointerClick } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col gap-2 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-slate-600/50">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`} />
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2.5 rounded-xl bg-${color}-500/20 text-${color}-400`}>
        <Icon size={20} />
      </div>
      <h3 className="text-slate-400 font-medium text-sm tracking-wide">{title}</h3>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString()}</p>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

const KPISection = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KPICard 
        title="Total Views" 
        value={data.totalViews || 0} 
        icon={Eye} 
        color="brand" 
        trend="+12%" 
      />
      <KPICard 
        title="Total Orders" 
        value={data.totalOrders || 0} 
        icon={ShoppingCart} 
        color="green" 
        trend="+5%" 
      />
      <KPICard 
        title="AR Sessions" 
        value={data.arOpens || 0} 
        icon={Box} 
        color="blue" 
        trend="+24%" 
      />
      <KPICard 
        title="Recommendation Clicks" 
        value={data.recommendationClicks || 0} 
        icon={MousePointerClick} 
        color="purple" 
      />
    </div>
  );
};

export default KPISection;
