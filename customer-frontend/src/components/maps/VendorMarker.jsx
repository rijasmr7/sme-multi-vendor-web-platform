import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Store, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom Map Marker Icon to match theme
const vendorIcon = new L.DivIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #f97316, #eab308);
      width: 40px; height: 40px; border-radius: 50%;
      border: 3px solid white; box-shadow: 0 8px 16px rgba(249,115,22,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; transform: translate(-50%, -100%);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
      </svg>
    </div>
    <div style="
      width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent;
      border-top: 14px solid #f97316; position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 100%);
    "></div>
  `,
  className: 'custom-vendor-marker',
  iconSize: [40, 54],
  iconAnchor: [20, 54],
  popupAnchor: [0, -60]
});

// User location marker
export const userIcon = new L.DivIcon({
  html: `
    <div style="
      background: #3b82f6; width: 24px; height: 24px; border-radius: 50%;
      border: 4px solid white; box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      position: relative; transform: translate(-50%, -50%);
    ">
      <div style="
        position: absolute; inset: -10px; border-radius: 50%;
        border: 2px solid #3b82f6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    </div>
  `,
  className: 'custom-user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -20]
});

const VendorMarker = ({ shop }) => {
  return (
    <Marker 
      position={[shop.latitude, shop.longitude]} 
      icon={vendorIcon}
    >
      <Popup className="vendor-custom-popup">
        <div style={{ padding: '0.5rem', minWidth: '220px', fontFamily: "'Outfit', sans-serif" }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f97316, #eab308)', 
              color: 'white', padding: '6px', borderRadius: '8px'
            }}>
              <Store size={16} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#451a03', lineHeight: 1.1 }}>
              {shop.shopName}
            </h4>
          </div>

          <div style={{ 
            background: '#fffbeb', padding: '10px', borderRadius: '12px', 
            marginBottom: '12px', border: '1px solid rgba(251,191,36,0.3)'
          }}>
            <p style={{ 
              margin: '0 0 6px 0', fontSize: '0.85rem', color: '#92400e', 
              fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <Navigation size={14} style={{ fill: '#fbbf24' }} />
              Distance: <span style={{ color: '#f97316', fontWeight: '900' }}>{shop.distanceKm} km</span>
            </p>
            <p style={{ 
              margin: 0, fontSize: '0.75rem', color: '#92400e', opacity: 0.7,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <MapPin size={12} /> {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
            </p>
          </div>

          <Link 
            to={`/shop/${shop.shopId}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#f97316', color: 'white', textDecoration: 'none',
              padding: '10px', borderRadius: '10px', fontWeight: '800',
              fontSize: '0.9rem', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Visit Shop <ArrowRight size={16} />
          </Link>

        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(VendorMarker);
