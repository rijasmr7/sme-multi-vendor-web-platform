import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import VendorMarker, { userIcon } from './VendorMarker';

// Component to dynamically update map center when user location changes
const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const VendorMap = ({ customerLocation, shops, radius }) => {
  const center = customerLocation 
    ? [customerLocation.latitude, customerLocation.longitude] 
    : [40.7128, -74.0060]; // Default to NY if no location

  // Calculate appropriate zoom level based on radius
  const getZoomLevel = (r) => {
    if (r <= 10) return 13;
    if (r <= 50) return 10;
    if (r <= 100) return 8;
    return 6;
  };

  return (
    <div style={{ 
      height: '600px', width: '100%', borderRadius: '24px', 
      overflow: 'hidden', border: '1px solid rgba(251,191,36,0.3)',
      boxShadow: '0 20px 40px -10px rgba(249,115,22,0.15)',
      position: 'relative', zIndex: 1 
    }}>
      <MapContainer 
        center={center} 
        zoom={getZoomLevel(radius)} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapCenterUpdater center={center} />

        {/* Customer Location Marker */}
        {customerLocation && (
          <Marker position={[customerLocation.latitude, customerLocation.longitude]} icon={userIcon}>
            <Popup className="vendor-custom-popup">
              <div style={{ padding: '4px', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                <strong style={{ color: '#3b82f6', fontSize: '1rem' }}>You are here</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Vendor Markers */}
        {shops && shops.map(shop => (
          <VendorMarker key={shop.shopId} shop={shop} />
        ))}
      </MapContainer>
    </div>
  );
};

export default React.memo(VendorMap);
