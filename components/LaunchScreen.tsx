
import React, { useState, useEffect } from 'react';

interface LaunchScreenProps {
  onLaunch: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onLaunch }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Phase 1: Calibration ("Goomer Goomer" Loading)
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center overflow-hidden font-tech selection:bg-red-500/30 cursor-default">
        {/* Atmosphere */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,#0f172a_0%,#000000_100%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

        {/* Central Reactor Interaction */}
        <button 
            onClick={() => isReady && onLaunch()}
            disabled={!isReady}
            className={`relative group flex items-center justify-center outline-none focus:outline-none tap-highlight-transparent transition-all duration-1000 ${isReady ? 'cursor-pointer' : 'cursor-wait'}`}
        >
            {/* Main Scaling Container - Reduced size by ~30% as requested */}
            <div className="relative w-[420px] h-[420px] md:w-[560px] md:h-[560px] flex items-center justify-center">

                {/* 1. OUTER RING: RED (Mark 85 Protocols) */}
                <div className={`absolute inset-0 rounded-full border border-red-900/20 border-t-red-600 border-b-red-600/50 
                    ${isReady ? 'animate-[spin_20s_linear_infinite] group-hover:animate-[spin_2s_linear_infinite_reverse]' : 'animate-[spin_0.5s_linear_infinite]'}
                `}>
                </div>

                {/* 2. MIDDLE RING: GOLD (Vision/Mind Stone) - Adjusted Inset */}
                <div className={`absolute inset-[12%] rounded-full border border-amber-900/20 border-r-amber-500 border-l-amber-500/50
                    ${isReady ? 'animate-[spin_15s_linear_infinite_reverse] group-hover:animate-[spin_2s_linear_infinite]' : 'animate-[spin_0.7s_linear_infinite_reverse]'}
                `}>
                </div>
                
                {/* 3. INNER RING: DARK BLUE (Structural) - Adjusted Inset */}
                <div className={`absolute inset-[22%] rounded-full border border-blue-900/40 border-t-blue-600 border-l-blue-600/50
                    ${isReady ? 'animate-[spin_12s_linear_infinite] group-hover:animate-[spin_1.5s_linear_infinite_reverse]' : 'animate-[spin_0.6s_linear_infinite]'}
                `}>
                </div>

                {/* 4. CORE RING: LIGHT BLUE / CYAN (AI Core/Friday) - Adjusted Inset */}
                <div className={`absolute inset-[28%] rounded-full border-[2px] border-cyan-500/30 border-t-cyan-400 border-dashed
                    ${isReady ? 'animate-[spin_30s_linear_infinite_reverse] group-hover:animate-[spin_1s_linear_infinite]' : 'animate-[spin_0.3s_linear_infinite]'}
                `}>
                </div>

                {/* 5. CENTER CORE (The Interaction Point) - SIGNFICANTLY LARGER (Inset Reduced) */}
                <div className={`absolute inset-[33%] rounded-full bg-slate-950 border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_100px_rgba(6,182,212,0.6)] group-hover:border-red-500/50`}>
                    
                    {/* Reactor Background Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#06b6d4_0%,transparent_70%)] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    
                    {/* Spinning Turbine Effect */}
                    <div className={`absolute inset-0 border-[1px] border-dashed border-white/10 rounded-full ${isReady ? 'animate-[spin_60s_linear_infinite]' : 'animate-[spin_0.2s_linear_infinite]'}`}></div>

                    {/* Text Display */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full pointer-events-none">
                         {!isReady ? (
                             <div className="flex flex-col items-center gap-2 animate-pulse">
                                 <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin"></div>
                             </div>
                         ) : (
                             <>
                                {/* IDLE TEXT */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-150 group-hover:opacity-0">
                                    <span className="text-cyan-400 text-sm md:text-base font-bold tracking-[0.2em] text-glow mb-1">PRESS TO</span>
                                    <span className="text-white text-lg md:text-2xl font-bold tracking-[0.3em] text-glow">START</span>
                                </div>
                                
                                {/* HOVER TEXT */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 opacity-0 scale-50 group-hover:scale-100 group-hover:opacity-100">
                                    <span className="text-red-500 text-xl md:text-2xl font-bold tracking-[0.2em] text-glow-red">INITIALIZE</span>
                                    <span className="text-white text-sm md:text-base font-bold tracking-[0.4em] text-glow">SYSTEM</span>
                                </div>
                             </>
                         )}
                    </div>
                </div>
            </div>
        </button>

        {/* Bottom Status */}
        <div className="absolute bottom-10 text-slate-500 font-mono text-[10px] tracking-[0.5em] animate-pulse">
            {isReady ? 'STARK INDUSTRIES :: SECURE SERVER' : 'CALIBRATING FUSION REACTOR...'}
        </div>
    </div>
  );
};

export default LaunchScreen;
