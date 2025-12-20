
import React from 'react';
import { AppMode } from '../types';

interface SystemDockProps {
    currentMode: AppMode;
    onSwitchMode: (mode: AppMode) => void;
    onSettings: () => void;
    toggleThanatosis: () => void;
    isThanatosisActive: boolean;
    weatherString?: string;
}

const MODES: { id: AppMode; label: string; shortcut: string; icon: React.ReactNode }[] = [
    { 
        id: 'EXECUTE', 
        label: 'EXECUTE', 
        shortcut: 'ALT/OPT+1',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5zm11.25-1.5a.75.75 0 00-1.5 0v3c0 .414.336.75.75.75h3a.75.75 0 000-1.5h-2.25v-2.25z" clipRule="evenodd" /></svg>
    },
    { 
        id: 'PLAN', 
        label: 'PLAN', 
        shortcut: 'ALT/OPT+2',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg>
    },
    { 
        id: 'INTEL', 
        label: 'INTEL', 
        shortcut: 'ALT/OPT+3',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" /></svg>
    }
];

const SystemDock: React.FC<SystemDockProps> = ({ 
    currentMode, onSwitchMode, onSettings, toggleThanatosis, isThanatosisActive, weatherString 
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-[100] font-tech select-none">
            {/* Left: Branding & Status */}
            <div className="flex items-center gap-4">
                <span className={`text-lg font-bold tracking-[0.2em] ${isThanatosisActive ? 'text-red-600 animate-pulse' : 'text-cyan-500'}`}>
                    {isThanatosisActive ? 'THANATOS' : 'JARVIS'}
                </span>
                <div className="h-4 w-px bg-white/10"></div>
                {weatherString && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{weatherString}</span>
                )}
            </div>

            {/* Center: Mode Switchers (The "Tabs") */}
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
                {MODES.map((mode) => {
                    const isActive = currentMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => onSwitchMode(mode.id)}
                            className={`
                                relative px-6 py-2 flex items-center gap-2 transition-all duration-300 group
                                ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-400'}
                            `}
                            title={`Switch to ${mode.label} (${mode.shortcut})`}
                        >
                            {/* Active Tab Indicator */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent border-t-2 border-cyan-500"></div>
                            )}
                            <span className={isActive ? 'text-cyan-400' : ''}>{mode.icon}</span>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{mode.label}</span>
                                <span className={`text-[7px] font-mono opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-cyan-500' : 'text-slate-600'}`}>[{mode.shortcut}]</span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleThanatosis} 
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${isThanatosisActive ? 'border-red-500 text-red-500 bg-red-900/20' : 'border-slate-800 text-slate-600 hover:border-slate-600'}`}
                >
                    {isThanatosisActive ? 'SAFE MODE' : 'DEFCON 5'}
                </button>
                <button 
                    onClick={onSettings}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                    title="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.047 7.047 0 010-2.228l-1.267-1.113a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SystemDock;
