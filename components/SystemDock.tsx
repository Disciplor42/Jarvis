
import React from 'react';
import { WindowType } from '../types';

interface SystemDockProps {
    activeWindows: { id: string; type: WindowType; }[];
    onLaunch: (type: WindowType | 'MEMORY' | 'SETTINGS') => void;
    toggleThanatosis: () => void;
    isThanatosisActive: boolean;
    isListening: boolean;
    isProcessing: boolean;
    onToggleVoice: () => void;
    voiceError?: string | null;
}

const LAUNCHERS = [
    { id: 'TASKS', label: 'TASKS', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'red' },
    { id: 'CALENDAR', label: 'CALENDAR', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', color: 'purple' },
    { id: 'PROJECTS', label: 'SYLLABUS', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', color: 'blue' },
    { id: 'MEMORY', label: 'DATA', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125', color: 'amber' },
    { id: 'LOGS', label: 'LOGS', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', color: 'slate' },
    { id: 'WEATHER', label: 'ENV', icon: 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z', color: 'cyan' },
    { id: 'COMMAND', label: 'COMMS', icon: 'M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2M7 4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m10 0a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M5 14a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6Z', color: 'green' },
];

const TOOLS = [
    { id: 'SETTINGS', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
];

const SystemDock: React.FC<SystemDockProps> = ({ 
    activeWindows, onLaunch, toggleThanatosis, isThanatosisActive,
    isListening, isProcessing, onToggleVoice, voiceError
}) => {
    
    const getStatus = (id: string) => {
        const win = activeWindows.find(w => w.type === id);
        return win ? 'active' : 'closed';
    };

    return (
        <div className="fixed top-1/2 left-4 -translate-y-1/2 z-[100] w-14 flex flex-col items-center py-6 bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] gap-6 pointer-events-auto">
            
            {/* Top Identity / Logo Area */}
            <div className="flex flex-col items-center gap-4">
                 <div className={`w-8 h-8 rounded-full border-2 ${isThanatosisActive ? 'border-red-500 animate-pulse' : 'border-cyan-500'} flex items-center justify-center`}>
                    <div className={`w-3 h-3 rounded-full ${isThanatosisActive ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                 </div>

                 {/* VOICE ACTIVATION BUTTON */}
                 <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleVoice(); }}
                    disabled={isProcessing}
                    className={`
                        group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                        ${voiceError 
                            ? 'bg-red-900/50 border-2 border-red-500 animate-pulse' 
                            : isListening 
                                ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] scale-110' 
                                : isProcessing 
                                    ? 'bg-slate-800 border-2 border-slate-600 animate-pulse cursor-wait'
                                    : 'bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 text-slate-400'
                        }
                    `}
                    title={voiceError || "Voice Command"}
                 >
                     {isProcessing ? (
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : voiceError ? (
                         <span className="text-[8px] font-bold text-red-500 font-mono text-center leading-none">ERR</span>
                     ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${isListening ? 'text-white animate-pulse' : ''}`}>
                             <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                             <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                         </svg>
                     )}
                     
                     {/* Recording Ripple */}
                     {isListening && !voiceError && (
                         <span className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-75"></span>
                     )}
                     
                     {/* Error Tooltip */}
                     {voiceError && (
                         <div className="absolute left-12 bg-red-950 text-red-500 text-[9px] font-bold px-2 py-1 rounded border border-red-500/50 whitespace-nowrap z-[200]">
                             {voiceError}
                         </div>
                     )}
                 </button>
            </div>

            {/* Separator */}
            <div className="w-6 h-px bg-slate-800/80"></div>

            {/* Launchers */}
            <div className="flex flex-col items-center gap-4 w-full px-1">
                {LAUNCHERS.map(app => {
                    const status = getStatus(app.id);
                    return (
                        <button
                            key={app.id}
                            type="button"
                            onClick={() => onLaunch(app.id as any)}
                            className={`group relative flex items-center justify-center transition-all duration-300 w-10 h-10 rounded-xl
                                ${status === 'active' ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-500 hover:text-cyan-400'}
                            `}
                            title={app.label}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                                className={`transition-colors w-5 h-5`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d={app.icon} />
                            </svg>
                            {/* Status Dot */}
                            {status === 'active' && (
                                <span className={`absolute -right-1 top-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]`}></span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Bottom Tools */}
            <div className="flex flex-col items-center gap-4 w-full border-t border-slate-800/50 pt-4">
                 <button 
                    type="button"
                    onClick={toggleThanatosis}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-500 group relative
                        ${isThanatosisActive ? 'text-red-500 animate-pulse' : 'text-slate-600 hover:text-red-500'}
                    `}
                    title="PROTOCOL: THANATOS"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                     </svg>
                 </button>

                 {TOOLS.map(t => (
                     <button
                        key={t.id}
                        type="button"
                        onClick={() => onLaunch(t.id as any)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                        </svg>
                     </button>
                 ))}
             </div>
        </div>
    );
};

export default SystemDock;
