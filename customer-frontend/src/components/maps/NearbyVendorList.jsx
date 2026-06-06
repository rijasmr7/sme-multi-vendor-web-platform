import React from 'react';
import VendorDistanceCard from '../location/VendorDistanceCard';
import { Compass } from 'lucide-react';

const NearbyVendorList = ({ shops, radius }) => {
  if (!shops || shops.length === 0) {
    return (
      <div className="animate-fade-in" style={{
        textAlign: 'center', padding: '4rem 2rem',
        border: '2px dashed rgba(251,191,36,0.3)',
        borderRadius: '24px', marginTop: '1.5rem',
        background: 'rgba(255,251,235,0.5)'
      }}>
        <div style={{
          width: '70px', height: '70px',
          background: 'rgba(251,191,36,0.1)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <Compass size={36} style={{ color: '#fbbf24', opacity: 0.6 }} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#451a03', marginBottom: '0.5rem' }}>
          No shops in view
        </h3>
        <p style={{ color: '#92400e', fontWeight: '500', maxWidth: '350px', margin: '0 auto' }}>
          Try expanding your search radius to discover vendors further away.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px'
      }}>
        <p style={{ color: '#92400e', fontWeight: '700', fontSize: '1rem', margin: 0 }}>
          Found <span style={{ color: '#f97316', fontWeight: '900' }}>{shops.length}</span> shop{shops.length !== 1 ? 's' : ''} within {radius} km
        </p>
      </div>
      <div className="shop-grid" style={{ padding: 0 }}>
        {shops.map((shop, idx) => (
          <VendorDistanceCard key={shop.shopId} shop={shop} index={idx} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(NearbyVendorList);
