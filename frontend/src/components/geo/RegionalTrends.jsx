import React from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

const RegionalTrends = ({ hotspots }) => {
  if (!hotspots || hotspots.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-center h-full">
        <p className="text-gray-400">No regional data available yet.</p>
      </div>
    );
  }

  // Take top 5 for the list
  const topRegions = hotspots.slice(0, 5);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Regional Hotspots
      </h3>
      <div className="space-y-4">
        {topRegions.map((region, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 text-sm">Zone {region.center_lat}, {region.center_lon}</p>
                <p className="text-xs text-gray-500">Active area</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-600">{region.intensity}</p>
              <p className="text-xs text-gray-400">Events</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionalTrends;
