import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ArrowLeft, LayoutList, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorMap from '../maps/VendorMap';
import NearbyVendorList from '../maps/NearbyVendorList';
import RadiusFilter from '../maps/RadiusFilter';
import LocationPermission from '../maps/LocationPermission';

const API_GATEWAY = 'http://localhost:5000';

const NearbyVendors = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending'); // pending, granted, denied
  const [radius, setRadius] = useState(50);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocationStatus('denied');
      return;
    }

    setLoading(true);
    setError(null);
    setLocationStatus('pending');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('granted');
      },
      (err) => {
        setLocationStatus('denied');
        setLoading(false);
        if (err.code === 1) {
          setError('Location access was denied. Please enable location permissions in your browser to discover nearby shops.');
        } else {
          setError('Failed to fetch your location. Please try again.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (locationStatus === 'granted' && customerLocation) {
      fetchNearbyShops(customerLocation.latitude, customerLocation.longitude, radius);
    }
  }, [locationStatus, customerLocation, radius]);

  const fetchNearbyShops = async (lat, lon, r) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_GATEWAY}/location/nearby?lat=${lat}&lon=${lon}&radius=${r}`);
      const data = await response.json();
      if (data.success) {
        setShops(data.data);
      } else {
        setError(data.message || 'Failed to fetch nearby shops.');
      }
    } catch (err) {
      setError('Network error: Location Service is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
        padding: '3rem 1.5rem 4rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle, #fbbf24 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}></div>
        <div style={{
          position: 'absolute', top: '-60px', right: '-40px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.3), transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-30px',
          width: '160px', height: '160px',
          background: 'radial-gradient(circle, rgba(234,179,8,0.25), transparent 70%)',
          borderRadius: '50%', filter: 'blur(30px)'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
            fontSize: '0.9rem', fontWeight: '600', marginBottom: '1.5rem',
            transition: 'color 0.2s'
          }}
            onMouseOver={e => e.currentTarget.style.color = '#fbbf24'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.3)',
            padding: '6px 16px', borderRadius: '100px',
            color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700',
            marginBottom: '1rem'
          }}>
            <MapPin size={14} /> PostGIS Geospatial Intelligence
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900',
            color: '#ffffff', marginBottom: '0.75rem',
            letterSpacing: '-0.03em', lineHeight: 1.1
          }}>
            Discover <span style={{ color: '#fbbf24' }}>Nearby</span> Shops
          </h1>
          <p style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'rgba(255,255,255,0.6)', maxWidth: '550px',
            fontWeight: '500', lineHeight: 1.6
          }}>
            Find local SME vendors around your current location, sorted by distance and powered by spatial queries.
          </p>

          <RadiusFilter 
            radius={radius} 
            setRadius={setRadius} 
            disabled={locationStatus !== 'granted' || loading} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        <LocationPermission 
          status={locationStatus} 
          loading={loading && !customerLocation} 
          error={error} 
          onRetry={requestLocation} 
        />

        {locationStatus === 'granted' && customerLocation && (
          <div className="animate-fade-in">
            {/* View Toggles */}
            <div style={{ 
              display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem',
              gap: '10px'
            }}>
              <button 
                onClick={() => setViewMode('map')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '12px', border: 'none',
                  background: viewMode === 'map' ? '#f97316' : 'rgba(249,115,22,0.1)',
                  color: viewMode === 'map' ? 'white' : '#f97316',
                  fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: viewMode === 'map' ? '0 4px 12px rgba(249,115,22,0.3)' : 'none'
                }}
              >
                <MapIcon size={18} /> Map View
              </button>
              <button 
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '12px', border: 'none',
                  background: viewMode === 'list' ? '#f97316' : 'rgba(249,115,22,0.1)',
                  color: viewMode === 'list' ? 'white' : '#f97316',
                  fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: viewMode === 'list' ? '0 4px 12px rgba(249,115,22,0.3)' : 'none'
                }}
              >
                <LayoutList size={18} /> List View
              </button>
            </div>

            {loading && shops.length === 0 ? (
               <div style={{ padding: '4rem', textAlign: 'center', color: '#92400e', fontWeight: '600' }}>
                 Loading Map Data...
               </div>
            ) : viewMode === 'map' ? (
              <VendorMap customerLocation={customerLocation} shops={shops} radius={radius} />
            ) : (
              <NearbyVendorList shops={shops} radius={radius} />
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NearbyVendors;
