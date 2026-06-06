import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { XR, Controllers, Interactive, useHitTest, useXREvent } from '@react-three/xr';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import ProductViewer from './ProductViewer';
import ARButton from './ARButton';
import CameraFallbackAR from './CameraFallbackAR';

// The AR-specific Model logic. This handles finding the floor and placing the object.
const ARModel = ({ url }) => {
  const { camera } = useThree();
  // We use the same Draco decoder path as the ProductViewer
  const { scene } = useGLTF(url, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const reticleRef = useRef();
  const [modelPosition, setModelPosition] = useState(null);

  // useHitTest fires 60 times a second in AR. It casts a ray from the phone camera
  // and detects real-world surfaces (like the floor).
  useHitTest((hitMatrix, hit) => {
    if (hitMatrix && reticleRef.current && !modelPosition) {
      // Move the reticle (target ring) to the detected floor position
      reticleRef.current.position.setFromMatrixPosition(hitMatrix);
      reticleRef.current.visible = true;
    }
  });

  const placeModel = () => {
    if (modelPosition) return;

    // When the user taps the screen, we lock the model to the reticle's coordinates
    if (reticleRef.current && reticleRef.current.visible) {
      setModelPosition([
        reticleRef.current.position.x,
        reticleRef.current.position.y,
        reticleRef.current.position.z,
      ]);
      reticleRef.current.visible = false;
    } else {
      // Fallback placement: place model 1.5 meters in front of the camera
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const pos = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(1.5));
      
      // Place it slightly lower so it appears to be on the floor/table
      pos.y = Math.min(pos.y, camera.position.y - 1.0);
      
      setModelPosition([pos.x, pos.y, pos.z]);
      if (reticleRef.current) {
        reticleRef.current.visible = false;
      }
    }
  };

  // Listen for global select (tap) events in WebXR AR session
  useXREvent('select', placeModel);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      {/* The Target Ring (Reticle) */}
      {!modelPosition && (
        <Interactive onSelect={placeModel}>
          <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={false}>
            <ringGeometry args={[0.1, 0.15, 32]} />
            <meshStandardMaterial color="#4f46e5" opacity={0.8} transparent />
          </mesh>
        </Interactive>
      )}

      {/* The Actual Product placed on the floor */}
      {modelPosition && (
        <primitive 
          object={scene} 
          position={modelPosition} 
        />
      )}
    </>
  );
};

const ARViewer = ({ modelUrl }) => {
  const [isARSupported, setIsARSupported] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. The Main 3D Viewer (Full Space) */}
      <div className="w-full h-full relative flex-1 min-h-[400px]">
        <ProductViewer modelUrl={modelUrl} />
      </div>

      {/* 2. The AR Launch Button (Only shows on mobile) */}
      <ARButton 
        onARSupported={setIsARSupported} 
        onFallbackAR={() => setShowFallback(true)} 
      />

      {/* 3. Simulated Camera AR Fallback for Low-End Devices */}
      {showFallback && (
        <CameraFallbackAR 
          modelUrl={modelUrl} 
          onClose={() => setShowFallback(false)} 
        />
      )}

      {/* 
        4. The WebXR Canvas (Hidden visually, but active in the DOM)
        When the ARButton is clicked, WebXR takes over the device screen and uses this Canvas.
      */}
      {isARSupported && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden' }}>
           <Canvas>
             <XR>
               <Controllers />
               <Suspense fallback={null}>
                 <ARModel url={modelUrl} />
               </Suspense>
             </XR>
           </Canvas>
        </div>
      )}
    </div>
  );
};

export default ARViewer;
