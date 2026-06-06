import React from 'react';

const RadiusFilter = ({ radius, setRadius, disabled }) => {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center',
      gap: '10px', marginTop: '2rem', opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <span style={{
        color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
        fontWeight: '700', marginRight: '4px'
      }}>
        Search Radius:
      </span>
      {[10, 50, 100, 500].map(r => (
        <button
          key={r}
          onClick={() => setRadius(r)}
          style={{
            padding: '8px 20px', borderRadius: '100px',
            fontSize: '0.85rem', fontWeight: '800',
            cursor: 'pointer', transition: 'all 0.25s ease',
            border: radius === r ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
            background: radius === r
              ? 'linear-gradient(135deg, #f97316, #eab308)'
              : 'rgba(255,255,255,0.05)',
            color: radius === r ? '#451a03' : 'rgba(255,255,255,0.7)',
            boxShadow: radius === r ? '0 4px 15px rgba(249,115,22,0.4)' : 'none',
            transform: radius === r ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {r} km
        </button>
      ))}
    </div>
  );
};

export default React.memo(RadiusFilter);
