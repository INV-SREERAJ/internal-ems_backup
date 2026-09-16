import React from 'react';
import { FaUsers } from 'react-icons/fa';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center login-gradient-bg text-white z-50">
      <div className="flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative mb-8 animate-pulse duration-2000">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-40 animate-pulse duration-1000"></div>
          <div className="relative bg-white/10 p-6 rounded-full backdrop-blur-lg border border-white/20 shadow-2xl">
            <FaUsers className="w-14 h-14 text-blue-300" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">
          Workforce OS
        </h1>
        
        <p className="mb-8 text-sm font-medium text-indigo-300/70 tracking-widest uppercase">
          Employee Management System
        </p>
        
        {/* Loading Indicator */}
        <div className="flex items-center space-x-2 mt-4">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
