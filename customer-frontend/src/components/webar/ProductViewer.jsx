import React, { Suspense, useState, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Environment, useGLTF, Html, ContactShadows } from '@react-three/drei';
import Loader from './Loader';

const Model = ({ url }) => {
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  return <primitive object={scene} />;
};

// Error Boundary to catch 3D rendering failures
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="text-red-500 bg-white p-4 rounded-xl shadow-lg border border-red-100 flex flex-col items-center">
            <span className="font-bold">Rendering Error</span>
            <span className="text-xs">Check console for details</span>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

const ProductViewer = ({ modelUrl }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  
  // Fullscreen toggle logic
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Reset camera position
  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] md:h-[600px] bg-gradient-to-b from-gray-50 to-gray-200 rounded-2xl overflow-hidden shadow-inner group"
    >
      <Canvas dpr={[1, 2]}>
        <color attach="background" args={['#f3f4f6']} />
        
        <Suspense fallback={null}>
          <ErrorBoundary>
            <Stage intensity={0.5} environment="city" preset="rembrandt" adjustCamera shadows={false}>
              {modelUrl ? <Model url={modelUrl} /> : null}
            </Stage>
            <ContactShadows 
              position={[0, -0.01, 0]} 
              opacity={0.4} 
              scale={10} 
              blur={2.5} 
              far={4} 
            />
          </ErrorBoundary>
        </Suspense>

        {/* Interactive Camera Controls */}
        <OrbitControls 
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enablePan={true}
          enableZoom={true}
          makeDefault
        />
      </Canvas>

      {/* Global Loader Overlay - Safe from State Conflicts */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
           <Loader />
        </div>
      </Suspense>

      {/* Floating UI Toolbar */}
      <div className="absolute bottom-4 right-4 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={resetCamera}
          className="bg-white/80 backdrop-blur p-2.5 rounded-full shadow hover:bg-white text-gray-700 transition"
          title="Reset Camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        <button 
          onClick={() => setAutoRotate(!autoRotate)}
          className="bg-white/80 backdrop-blur p-2.5 rounded-full shadow hover:bg-white text-gray-700 transition"
          title={autoRotate ? "Pause Rotation" : "Play Rotation"}
        >
          {autoRotate ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          )}
        </button>

        <button 
          onClick={toggleFullscreen}
          className="bg-white/80 backdrop-blur p-2.5 rounded-full shadow hover:bg-white text-gray-700 transition"
          title="Fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Preload the model so it starts downloading immediately when the component mounts
// Adjust this to preload specific default models if needed.
// useGLTF.preload('url-to-model.glb');

export default ProductViewer;
