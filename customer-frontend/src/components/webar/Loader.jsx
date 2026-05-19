import React from 'react';
import { useProgress } from '@react-three/drei';

const Loader = () => {
  const { progress, active } = useProgress();
  
  if (!active && progress === 100) return null;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 bg-white/50 backdrop-blur-sm p-8 rounded-3xl">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-indigo-600 font-medium text-sm whitespace-nowrap bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur">
        {progress.toFixed(0)}% loaded
      </div>
    </div>
  );
};

export default Loader;
