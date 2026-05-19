import React, { useState, useEffect } from 'react';
import { ARButton as ThreeARButton } from '@react-three/xr';

// A Tailwind-styled wrapper around the official WebXR ARButton
const ARButton = ({ onARSupported }) => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if WebXR immersive-ar session is available (Mobile devices, HTTPS required)
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsSupported(supported);
        if (onARSupported) onARSupported(supported);
      });
    } else {
      if (onARSupported) onARSupported(false);
    }
  }, [onARSupported]);

  // The button will be completely hidden if the device/browser doesn't support AR
  if (!isSupported) return null;

  return (
    <div className="w-full flex justify-center mb-6 animate-fade-in">
      <ThreeARButton
        sessionInit={{ requiredFeatures: ['hit-test'] }} // Request hit-test to find the floor
        style={{
          backgroundColor: '#4f46e5', // Tailwind indigo-600
          color: 'white',
          padding: '14px 32px',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3), 0 4px 6px -4px rgba(79, 70, 229, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: '350px',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5m13.5-3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 13.5V19.5A2.25 2.25 0 0 0 18 17.25h-1.5m-13.5 3.75H6A2.25 2.25 0 0 1 3.75 19.5V18" />
        </svg>
        View in your Room
      </ThreeARButton>
    </div>
  );
};

export default ARButton;
