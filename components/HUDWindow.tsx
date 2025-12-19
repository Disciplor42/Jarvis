
import React, { useState, useEffect, useRef } from 'react';

interface HUDWindowProps {
    id: string;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string; 
    noFrame?: boolean; 
}

const HUDWindow: React.FC<HUDWindowProps> = ({ 
    id, title, onClose, children, className, noFrame = false
}) => {
    const [isMounting, setIsMounting] = useState(true);
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounting(false), 50);
        return () => clearTimeout(timer);
    }, []);

    // Effect for Parallax Depth based on screen position
    useEffect(() => {
        const updatePerspective = () => {
            if (!windowRef.current) return;
            const rect = windowRef.current.getBoundingClientRect();
            const screenCenter = window.innerWidth / 2;
            const windowCenter = rect.left + rect.width / 2;
            const offset = (windowCenter - screenCenter) / screenCenter;
            
            // Apply subtle rotation: center is flat, sides are curved in
            const rotation = offset * 5; // Max 5 degree tilt
            windowRef.current.style.transform = `perspective(1000px) rotateY(${-rotation}deg)`;
        };

        updatePerspective();
        window.addEventListener('resize', updatePerspective);
        return () => window.removeEventListener('resize', updatePerspective);
    }, []);

    const containerClasses = noFrame 
        ? `flex flex-col bg-slate-950/80 w-full h-full overflow-hidden transition-all duration-300 ${isMounting ? 'opacity-0' : 'opacity-100'} ${className || ''}`
        : `flex flex-col backdrop-blur-md bg-slate-950/80 border border-slate-700/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] overflow-hidden transition-all duration-500 ease-out clip-hud-panel ${isMounting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} ${className || ''}`;

    return (
        <div ref={windowRef} className={containerClasses} style={{ transformStyle: 'preserve-3d' }}>
            {/* Header */}
            <div className={`h-8 flex items-center justify-between px-3 border-b bg-slate-900/50 border-slate-800 shrink-0 ${noFrame ? '' : 'rounded-t'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan] animate-pulse"></div>
                    <span className="text-[10px] font-bold font-tech tracking-[0.2em] uppercase text-slate-300 hud-text-glow">
                        {title}
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex gap-0.5 h-3 items-center mr-2 opacity-50">
                        <div className="w-0.5 h-full bg-slate-600"></div>
                        <div className="w-0.5 h-2/3 bg-slate-600"></div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="text-slate-500 hover:text-red-500 transition-colors px-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 001.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(6,182,212,0.02),rgba(6,182,212,0.01),rgba(6,182,212,0.02))] bg-[length:100%_4px,3px_100%] z-50 opacity-20"></div>
                {children}
            </div>

            {id !== 'CMD' && (
                <div className="h-4 bg-black/40 border-t border-white/5 flex justify-between items-center px-2 shrink-0">
                    <span className="text-[7px] font-mono text-slate-700 tracking-tighter">TELEMETRY_ID: {id.toUpperCase()}</span>
                    <span className="text-[7px] font-mono text-cyan-900 animate-pulse">ENCRYPTED_LINK_ACTIVE</span>
                </div>
            )}
        </div>
    );
};

export default HUDWindow;
