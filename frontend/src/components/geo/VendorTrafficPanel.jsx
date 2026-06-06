import React from 'react';
import { Users, Navigation } from 'lucide-react';

const VendorTrafficPanel = ({ vendorTraffic }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-md text-white relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
        <Users size={120} />
      </div>
      
      <h3 className="text-lg font-semibold mb-1 opacity-90">Nearby Traffic</h3>
      <p className="text-sm opacity-75 mb-6">Active customers within 10km</p>
      
      <div className="flex items-end gap-3 mb-6">
        <span className="text-5xl font-bold tracking-tight">
          {vendorTraffic ? vendorTraffic.length : 0}
        </span>
        <span className="text-lg opacity-80 mb-1">active users</span>
      </div>
      
      <div className="space-y-3 relative z-10">
        <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">Closest Customers</h4>
        {vendorTraffic && vendorTraffic.length > 0 ? (
          vendorTraffic.slice(0, 3).map((customer, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/10 rounded-lg p-2 px-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Navigation className="w-3 h-3 opacity-70" />
                <span className="text-sm">User {String(customer.latitude).slice(-4)}</span>
              </div>
              <span className="text-sm font-semibold">{customer.distanceKm} km away</span>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-70">No nearby activity right now.</p>
        )}
      </div>
    </div>
  );
};

export default VendorTrafficPanel;
