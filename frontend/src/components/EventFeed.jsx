import React from 'react';
import { Eye, ShoppingCart, Cuboid, MousePointer2, Clock } from 'lucide-react';

const EventIcon = ({ type }) => {
  switch (type) {
    case 'product_view':
      return <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Eye size={16} /></div>;
    case 'order_created':
      return <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><ShoppingCart size={16} /></div>;
    case 'ar_opened':
      return <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Cuboid size={16} /></div>;
    case 'recommendation_clicked':
      return <div className="p-2 bg-brand-DEFAULT/20 text-brand-DEFAULT rounded-lg"><MousePointer2 size={16} /></div>;
    default:
      return <div className="p-2 bg-slate-700/50 text-slate-400 rounded-lg"><Clock size={16} /></div>;
  }
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const EventFeed = ({ events }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-[800px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Live Feed
          <span className="flex h-3 w-3 relative ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-DEFAULT opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-DEFAULT"></span>
          </span>
        </h3>
        <span className="text-xs font-medium bg-slate-700 px-2 py-1 rounded text-slate-300">
          Last 50 events
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Waiting for real-time events...</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div 
              key={event.id || i} 
              className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors animate-[slideIn_0.3s_ease-out]"
            >
              <EventIcon type={event.event_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 capitalize">
                  {event.event_type.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  User: <span className="text-slate-300">{event.user_id || 'Anonymous'}</span>
                </p>
                {event.product_id && (
                  <p className="text-xs text-slate-400 truncate">
                    Product: <span className="text-brand-light font-medium">{event.product_id}</span>
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap">
                {formatTime(event.timestamp || event.created_at || new Date().toISOString())}
              </div>
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}} />
    </div>
  );
};

export default EventFeed;
