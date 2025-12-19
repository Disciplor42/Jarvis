
import React, { useEffect, useState } from 'react';

interface HolographicFeedbackProps {
    transcript: string;
    intent: string;
    onComplete: () => void;
    theme?: 'cyan' | 'red';
}

const HolographicFeedback: React.FC<HolographicFeedbackProps> = ({ 
    transcript, intent, onComplete, theme = 'cyan' 
}) => {
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const duration = 10000; // 10 seconds
        const startTime = Date.now();
        
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
            
            if (remaining <= 0) {
                setIsVisible(false);
                setTimeout(onComplete, 500); // Wait for fade out
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [onComplete]);

    const colorClass = theme === 'red' ? 'text-red-500 border-red-500' : 'text-cyan-400 border-cyan-400';
    const bgClass = theme === 'red' ? 'bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
    const barClass = theme === 'red' ? 'bg-red-600' : 'bg-cyan-500';

    return (
        <div className={`fixed top-24 right-8 z-[200] w-80 transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
            <div className={`relative p-4 border ${colorClass} ${bgClass} backdrop-blur-md clip-hud-panel overflow-hidden`}>
                {/* Hex Grid Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
                
                <div className="relative z-10 font-mono">
                    <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-bold tracking-[0.3em] uppercase ${colorClass}`}>Secure Data Stream</span>
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-1 h-3 ${theme === 'red' ? 'bg-red-900' : 'bg-cyan-900'} ${i === 3 ? 'animate-pulse' : ''}`}></div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">Decoded Transmission</label>
                            <p className="text-xs text-white leading-relaxed border-l border-white/20 pl-2 italic">
                                "{transcript || '...'}"
                            </p>
                        </div>

                        <div>
                            <label className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">System Interpretation</label>
                            <div className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 ${theme === 'red' ? 'bg-red-500/10' : 'bg-cyan-500/10'} border-l-2 ${colorClass}`}>
                                {intent || 'Analyzing context...'}
                            </div>
                        </div>
                    </div>

                    {/* Timer Bar */}
                    <div className="mt-4 pt-2 border-t border-white/5">
                        <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${barClass} transition-all duration-75 ease-linear`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[7px] text-slate-600">AUTO-DEMATERIALIZE</span>
                            <span className="text-[7px] text-slate-600">ID: HUD-FEEDBACK-{Math.floor(progress)}</span>
                        </div>
                    </div>
                </div>

                {/* Corner Decoration */}
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${colorClass} opacity-40`}></div>
            </div>
        </div>
    );
};

export default HolographicFeedback;
