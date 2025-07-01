import React, { useState, useEffect } from 'react';

const ConnectionLoader = () => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm mx-auto">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-transparent border-t-pink-400 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Connecting to Server{dots}
        </h2>

        {/* Subtitle */}
        <p className="text-white/70 mb-6">
          Please wait while we establish a secure connection
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Progress Text */}
        <p className="text-white/50 text-sm">
          {Math.round(Math.min(progress, 100))}% Complete
        </p>
      </div>
    </div>
  );
};

export default ConnectionLoader;