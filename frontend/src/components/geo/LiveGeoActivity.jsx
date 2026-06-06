import React from 'react';
import { Activity, Map, Navigation } from 'lucide-react';

const LiveGeoActivity = ({ liveEvents }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-green-500 animate-pulse" />
        Live Geo Activity
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {liveEvents.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">Waiting for live location events...</p>
        ) : (
          liveEvents.map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-green-100 p-2 rounded-full flex-shrink-0 mt-1">
                {event.event_type.includes('map') ? (
                  <Map className="w-4 h-4 text-green-600" />
                ) : (
                  <Navigation className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 uppercase tracking-wider text-xs">
                  {event.event_type.replace(/_/g, ' ')}
                </p>
                <div className="flex justify-between items-end mt-1">
                  <p className="text-xs text-gray-500">
                    {event.latitude && event.longitude 
                      ? `${Number(event.latitude).toFixed(4)}, ${Number(event.longitude).toFixed(4)}`
                      : 'Unknown Location'}
                  </p>
                  <p className="text-[10px] text-gray-400">Just now</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveGeoActivity;
