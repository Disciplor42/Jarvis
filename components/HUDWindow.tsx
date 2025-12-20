
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
    
    useEffect(() => {
        const timer = setTimeout(() => setIsMounting(false), 50);
        return () => clearTimeout(timer);
    }, []);

    // Frame-less, glass-like container
    const containerClasses = `flex flex-col w-full h-full overflow-hidden transition-all duration-500 
    bg-slate-950/40 backdrop-blur-md border border-white/5 
    shadow-[0_0_30px_rgba(0,0,0,0.3)]
    ${isMounting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${className || ''}`;

    return (
        <div className={containerClasses}>
            {/* Minimal Header */}
            {!noFrame && (
                <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-white/[0.02] shrink-0 select-none group">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-1 bg-cyan-500 rounded-full shadow-[0_0_5px_cyan]"></div>
                        <span className="text-[10px] font-bold font-tech tracking-[0.2em] uppercase text-slate-400 group-hover:text-cyan-400 transition-colors">
                            {title}
                        </span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 001.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(6,182,212,0.02),rgba(6,182,212,0.01),rgba(6,182,212,0.02))] bg-[length:100%_4px,3px_100%] z-0 opacity-10"></div>
                <div className="relative z-10 h-full w-full">
                    {children}
                </div>
            </div>
            
            {/* Tech Footer Decoration */}
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/20"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/20"></div>
        </div>
    );
};

export default HUDWindow;
