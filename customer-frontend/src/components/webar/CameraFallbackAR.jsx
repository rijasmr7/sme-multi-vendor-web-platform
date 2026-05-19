import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, ContactShadows } from '@react-three/drei';

const Model = ({ url }) => {
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  return <primitive object={scene} />;
};

const CameraFallbackAR = ({ modelUrl, onClose }) => {
  const videoRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setError("Camera access denied or unavailable.");
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white font-semibold text-lg drop-shadow-md">AR Preview</span>
        <button 
          onClick={onClose}
          className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera Background */}
      <div className="absolute inset-0 z-0">
        {error ? (
          <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 p-6 text-center">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 3D Canvas Overlay */}
      <div className="absolute inset-0 z-10 touch-none">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <Suspense fallback={null}>
            <Stage intensity={0.5} environment="city" preset="rembrandt" adjustCamera={false}>
              <Model url={modelUrl} />
            </Stage>
            <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} />
          </Suspense>
          <OrbitControls makeDefault enableZoom={true} enablePan={true} />
        </Canvas>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-10 left-0 w-full text-center z-20 pointer-events-none">
        <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur drop-shadow">
          Drag to rotate • Pinch to scale
        </span>
      </div>
    </div>
  );
};

export default CameraFallbackAR;
