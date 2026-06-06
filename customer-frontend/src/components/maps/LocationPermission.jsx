import React from 'react';
import { Compass, AlertCircle, MapPin } from 'lucide-react';

const LocationPermission = ({ status, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="animate-fade-in" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center',
        background: 'rgba(255,255,255,0.7)', borderRadius: '24px',
        border: '1px solid rgba(251,191,36,0.3)',
        boxShadow: '0 10px 30px -10px rgba(249,115,22,0.1)'
      }}>
        <div style={{
          width: '80px', height: '80px',
          background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,179,8,0.1))',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem', position: 'relative'
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent', borderTopColor: '#f97316',
            animation: 'spin 1s linear infinite'
          }}></div>
          <Compass size={32} style={{ color: '#f97316' }} />
        </div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>
          Acquiring GPS Signal...
        </h3>
        <p style={{ color: '#92400e', fontWeight: '500', opacity: 0.7, maxWidth: '300px' }}>
          Please allow location access in your browser to discover nearby shops.
        </p>
      </div>
    );
  }

  if (status === 'denied' || error) {
    return (
      <div className="glass-card animate-fade-in" style={{
        maxWidth: '500px', margin: '2rem auto', padding: '3rem',
        textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)',
        background: 'rgba(254,242,242,0.8)'
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(239,68,68,0.1)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', color: '#ef4444'
        }}>
          <AlertCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.75rem' }}>
          Location Access Required
        </h3>
        <p style={{ color: '#92400e', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: '500' }}>
          {error || "We need your location to show vendors near you. Please enable location permissions in your browser."}
        </p>
        <button
          onClick={onRetry}
          style={{
            marginTop: '1.5rem', padding: '10px 24px', borderRadius: '12px',
            background: '#f97316', color: 'white', border: 'none',
            fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
          }}
        >
          <MapPin size={16} /> Try Again
        </button>
      </div>
    );
  }

  return null;
};

export default LocationPermission;
