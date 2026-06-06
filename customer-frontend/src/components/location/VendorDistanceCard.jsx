import React, { useState } from 'react';
import { MapPin, Navigation, ArrowRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorDistanceCard = ({ shop, index = 0 }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/shop/${shop.shopId}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="glass-card animate-fade-in" style={{
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        animationDelay: `${index * 0.08}s`,
        transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 25px 50px -12px rgba(249, 115, 22, 0.2)'
          : '0 10px 30px -10px rgba(0,0,0,0.05)',
        border: hovered
          ? '1px solid rgba(249, 115, 22, 0.4)'
          : '1px solid rgba(251, 191, 36, 0.15)',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Map Placeholder Header */}
        <div style={{
          height: '140px',
          background: 'linear-gradient(135deg, #451a03, #78350f)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Dot Grid Pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.12,
            backgroundImage: 'radial-gradient(circle, #fbbf24 1.2px, transparent 1.2px)',
            backgroundSize: '18px 18px'
          }}></div>

          {/* Glow behind pin */}
          <div style={{
            position: 'absolute',
            width: '100px', height: '100px',
            background: 'radial-gradient(circle, rgba(249,115,22,0.35), transparent 70%)',
            borderRadius: '50%', filter: 'blur(20px)',
            transition: 'all 0.3s',
            transform: hovered ? 'scale(1.4)' : 'scale(1)'
          }}></div>

          {/* Pin Icon */}
          <div style={{
            position: 'relative', zIndex: 2,
            width: '56px', height: '56px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(251,191,36,0.3)',
            color: '#fbbf24',
            transition: 'all 0.3s',
            transform: hovered ? 'scale(1.15)' : 'scale(1)'
          }}>
            <MapPin size={26} />
          </div>

          {/* Distance Badge */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'linear-gradient(135deg, #f97316, #eab308)',
            color: '#451a03', fontSize: '0.75rem', fontWeight: '800',
            padding: '5px 14px', borderRadius: '100px',
            display: 'flex', alignItems: 'center', gap: '5px',
            boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
            letterSpacing: '0.02em'
          }}>
            <Navigation size={11} style={{ fill: '#451a03' }} />
            {shop.distanceKm} km
          </div>
        </div>

        {/* Card Body */}
        <div style={{
          padding: '1.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Shop Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #f97316, #eab308)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
                boxShadow: '0 4px 10px rgba(249,115,22,0.25)'
              }}>
                <Store size={18} />
              </div>
              <h3 style={{
                fontSize: '1.2rem', fontWeight: '850',
                color: hovered ? '#f97316' : '#451a03',
                transition: 'color 0.3s', margin: 0,
                lineHeight: 1.2
              }}>
                {shop.shopName}
              </h3>
            </div>

            {/* Coordinates */}
            <p style={{
              fontSize: '0.8rem', color: '#92400e', opacity: 0.6,
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
              margin: '0 0 1.25rem 0'
            }}>
              <MapPin size={12} />
              {shop.latitude.toFixed(4)}°N, {Math.abs(shop.longitude).toFixed(4)}°{shop.longitude >= 0 ? 'E' : 'W'}
            </p>
          </div>

          {/* Visit Button */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid rgba(251,191,36,0.15)',
            paddingTop: '1rem'
          }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: '700',
              color: '#92400e', opacity: 0.7
            }}>
              {shop.distanceKm < 1 ? `${Math.round(shop.distanceKm * 1000)}m away` : `${shop.distanceKm} km away`}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              color: hovered ? '#f97316' : '#92400e',
              fontWeight: '800', fontSize: '0.9rem',
              transition: 'all 0.3s',
              transform: hovered ? 'translateX(4px)' : 'translateX(0)'
            }}>
              Visit <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VendorDistanceCard;
