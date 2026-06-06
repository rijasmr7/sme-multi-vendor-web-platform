import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leafet icon issues in React if needed, but we use CircleMarkers here mostly.

function HeatmapLayer({ hotspots }) {
  const map = useMap();
  
  // A simple representation of heat using CircleMarkers.
  // In a production app, we might use react-leaflet-heatmap-layer.
  return hotspots.map((spot, idx) => {
    // Intensity could dictate the radius and color
    const radius = Math.min(spot.intensity * 2 + 10, 50);
    const color = spot.intensity > 10 ? '#ef4444' : spot.intensity > 5 ? '#f97316' : '#eab308';
    
    return (
      <CircleMarker
        key={idx}
        center={[spot.center_lat, spot.center_lon]}
        radius={radius}
        pathOptions={{ color: 'transparent', fillColor: color, fillOpacity: 0.6 }}
      >
        <Popup>
          <div className="text-center">
            <p className="font-semibold">Activity Intensity: {spot.intensity}</p>
            <p className="text-xs text-gray-500">Center: {spot.center_lat}, {spot.center_lon}</p>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

const GeoHeatmap = ({ hotspots }) => {
  // Center roughly on New York (or calculate from hotspots)
  const defaultCenter = hotspots.length > 0 ? [hotspots[0].center_lat, hotspots[0].center_lon] : [40.7128, -74.0060];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer center={defaultCenter} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hotspots && hotspots.length > 0 && <HeatmapLayer hotspots={hotspots} />}
      </MapContainer>
    </div>
  );
};

export default GeoHeatmap;
