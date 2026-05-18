import React from 'react';
import qbLogo from '../assets/qblogo.png';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading QB Pharma..." }) => {
  return (
    <div role="status" aria-busy="true" aria-label={message} className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5"></div>
      </div>
      
      {/* Main Loading Container */}
      <div className="relative flex flex-col items-center space-y-8">
        {/* Logo Container with Spinner */}
        <div className="relative">
          {/* Outer Spinning Ring */}
          <div className="animate-spin-slow w-32 h-32 border-2 border-transparent border-t-blue-400 border-r-blue-400 rounded-full"></div>
          
          {/* Inner Spinning Ring (Counter-rotate) */}
          <div className="absolute inset-2 animate-spin-reverse w-28 h-28 border-2 border-transparent border-b-emerald-400 border-l-emerald-400 rounded-full"></div>
          
          {/* Logo Container */}
          <div className="absolute inset-4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <img 
              src={qbLogo} 
              alt="QB Pharma" 
              className="w-16 h-16 object-contain animate-pulse"
            />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            QB Pharma
          </h2>
          <div className="flex items-center space-x-2">
            <p className="text-slate-300 text-lg">{message}</p>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-80 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full animate-loading-bar"></div>
        </div>
        
        {/* Pharmaceutical Tagline */}
        <p className="text-slate-400 text-sm font-light tracking-wide">
          Empowering Healthcare Management
        </p>
      </div>
      
      {/* Floating Pills Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pill-float pill-1"></div>
        <div className="pill-float pill-2"></div>
        <div className="pill-float pill-3"></div>
        <div className="pill-float pill-4"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;