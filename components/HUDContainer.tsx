
import React, { useEffect, useRef } from 'react';
import { HUDTheme } from '../types';

interface HUDContainerProps {
    children: React.ReactNode;
    theme: HUDTheme;
}

const HUDContainer: React.FC<HUDContainerProps> = ({ children, theme }) => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const cursorRingRef = useRef<HTMLDivElement>(null);
    const cursorDotRef = useRef<HTMLDivElement>(null);
    const crosshairRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
            }
            if (cursorRingRef.current) {
                cursorRingRef.current.animate({
                    transform: `translate3d(${clientX}px, ${clientY}px, 0)`
                }, { duration: 50, fill: "forwards" });
            }

            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .interactive-target, .cursor-pointer');

            if (isInteractive) {
                if (cursorRingRef.current) {
                    cursorRingRef.current.classList.add('scale-75'); 
                    cursorRingRef.current.classList.remove('opacity-30'); 
                    cursorRingRef.current.classList.add('opacity-100'); 
                }
                if (cursorDotRef.current) {
                    cursorDotRef.current.classList.add('shadow-[0_0_10px_currentColor]');
                }
                if (crosshairRef.current) {
                    crosshairRef.current.classList.add('rotate-45', 'scale-110');
                }
            } else {
                if (cursorRingRef.current) {
                    cursorRingRef.current.classList.remove('scale-75');
                    cursorRingRef.current.classList.add('opacity-30');
                    cursorRingRef.current.classList.remove('opacity-100');
                }
                if (cursorDotRef.current) {
                    cursorDotRef.current.classList.remove('shadow-[0_0_10px_currentColor]');
                }
                if (crosshairRef.current) {
                    crosshairRef.current.classList.remove('rotate-45', 'scale-110');
                }
            }
        };

        const handleMouseDown = () => cursorRingRef.current?.classList.add('scale-50');
        const handleMouseUp = () => cursorRingRef.current?.classList.remove('scale-50');

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const themeMap = {
        cyan: { border: 'border-cyan-400', accent: 'bg-cyan-400', text: 'text-cyan-400', rgb: '6,182,212' },
        red: { border: 'border-red-500', accent: 'bg-red-500', text: 'text-red-500', rgb: '239,68,68' },
        amber: { border: 'border-amber-500', accent: 'bg-amber-500', text: 'text-amber-500', rgb: '245,158,11' },
        green: { border: 'border-green-500', accent: 'bg-green-500', text: 'text-green-500', rgb: '34,197,94' }
    };

    const current = themeMap[theme] || themeMap.cyan;
    
    return (
        <div className={`relative w-screen h-screen overflow-hidden bg-black text-slate-200 selection:bg-cyan-500/30 font-sans cursor-none transition-colors duration-1000`}>
            
            {/* BACKGROUND LAYERS */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none z-0"></div>
            <div className={`absolute inset-0 bg-[linear-gradient(rgba(${current.rgb},0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(${current.rgb},0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-20`}></div>
            
            {/* CORNER DECORATIONS */}
            <div className="absolute inset-4 pointer-events-none z-50 mix-blend-screen">
                <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 ${current.border} opacity-50`}></div>
                <div className={`absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 ${current.border} opacity-50`}></div>
                <div className={`absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 ${current.border} opacity-50`}></div>
                <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 ${current.border} opacity-50`}></div>
            </div>

            {/* CURSOR SYSTEM */}
            <div ref={cursorRef} className="fixed top-0 left-0 z-[10000] pointer-events-none -ml-1 -mt-1 w-2 h-2 flex items-center justify-center will-change-transform mix-blend-difference">
                <div ref={cursorDotRef} className={`w-1 h-1 bg-white rounded-full shadow-[0_0_2px_white] transition-colors duration-200`}></div>
            </div>

            <div ref={cursorRingRef} className={`fixed top-0 left-0 z-[9999] pointer-events-none -ml-6 -mt-6 w-12 h-12 flex items-center justify-center transition-opacity duration-300 will-change-transform opacity-30 mix-blend-screen`}>
                 <div className={`absolute inset-0 border border-dashed ${current.border} rounded-full animate-[spin_10s_linear_infinite]`}></div>
                 <div ref={crosshairRef} className="absolute inset-0 flex items-center justify-center transition-transform duration-300">
                    <div className={`absolute w-full h-[1px] bg-white opacity-20`}></div>
                    <div className={`absolute h-full w-[1px] bg-white opacity-20`}></div>
                 </div>
            </div>

            {/* CONTENT */}
            <div className="relative z-10 w-full h-full flex flex-col p-6 pl-0 md:p-8 md:pl-0">
                 {children}
            </div>
        </div>
    );
};

export default HUDContainer;
