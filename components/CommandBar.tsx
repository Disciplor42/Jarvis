
import React, { useState, useEffect, useRef } from 'react';
import { AiParseResult, Task, WeatherData } from '../types';
import { parseUserCommand } from '../services/aiService';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface CommandBarProps {
  onCommandProcessed: (results: AiParseResult[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  memory: string[];
  activeTasks: Task[];
  groqApiKey: string; 
  modelConfig: { friday: string, jarvis: string, vision: string, transcription: string };
  weatherData?: WeatherData | null;
  activePersona?: 'FRIDAY' | 'JARVIS' | 'VISION';
  setActivePersona?: (p: 'FRIDAY' | 'JARVIS' | 'VISION') => void;
  theme?: 'cyan' | 'red';
  onLiveTranscript?: (text: string) => void; // Callback to bubble up
}

const CommandBar: React.FC<CommandBarProps> = ({ 
    onCommandProcessed, isLoading, setIsLoading, memory, activeTasks, groqApiKey, modelConfig, weatherData,
    activePersona: propPersona, setActivePersona: propSetPersona, theme = 'cyan', onLiveTranscript
}) => {
  const [input, setInput] = useState('');
  const [statusLog, setStatusLog] = useState<string>('System Online. Ready.');
  const [localPersona, setLocalPersona] = useState<'FRIDAY' | 'JARVIS' | 'VISION'>('JARVIS');
  
  const activePersona = propPersona || localPersona;
  const setActivePersona = propSetPersona || setLocalPersona;

  const inputRef = useRef<HTMLInputElement>(null);

  // Voice Input Hook with Live Transcript
  const { isListening, toggleListening, transcript } = useVoiceInput((text) => {
      // Final result handler
      setInput(text);
      processCommand(text);
  });

  // Effect to update input field with live transcript while speaking
  useEffect(() => {
      if (isListening && transcript) {
          setInput(transcript);
          if (onLiveTranscript) onLiveTranscript(transcript);
      }
  }, [transcript, isListening, onLiveTranscript]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setStatusLog('Processing Directive...');

    try {
      const results = await parseUserCommand(
          text, 
          groqApiKey, 
          modelConfig, 
          activePersona, 
          memory, 
          activeTasks,
          [],
          [],
          weatherData ? `Temp ${weatherData.temp}C` : "Sensors Offline"
      );
      
      const actionCount = results.filter(r => r.action !== 'QUERY' && r.action !== 'UNKNOWN').length;

      if (actionCount > 0) {
          setStatusLog(`Success. ${actionCount} Protocol(s) Generated.`);
      } else if (results.length > 0 && results[0].action === 'QUERY') {
          setStatusLog(`Response received.`);
      } else {
          setStatusLog('Command unclear.');
      }

      onCommandProcessed(results);
      setInput(''); // Clear on success

    } catch (err: any) {
      console.error(err);
      setStatusLog(`System Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    processCommand(input);
  };

  const borderColor = theme === 'red' ? 'border-red-500' : 'border-cyan-500';
  const textColor = theme === 'red' ? 'text-red-500' : 'text-cyan-500';
  const bgColor = theme === 'red' ? 'bg-red-950/30' : 'bg-cyan-950/30';
  const placeholderColor = theme === 'red' ? 'placeholder-red-800' : 'placeholder-cyan-800';

  return (
    <div className={`flex flex-col h-full ${bgColor}`}>
        <div className="flex-1 flex items-center px-4 gap-4">
             <div className="flex-1 relative">
                 <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "LISTENING... (SPEAK CLEARLY)" : `ENTER COMMAND FOR ${activePersona}...`}
                    className={`w-full bg-transparent border-none ${textColor} text-base font-mono ${placeholderColor} focus:outline-none uppercase tracking-wider pr-8 transition-all`}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSubmit(null); }}}
                    autoFocus
                    disabled={isLoading}
                 />
                 {/* Voice Button */}
                 <button 
                    onClick={toggleListening}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:text-white transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}
                    title="Voice Input"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                 </button>
             </div>
             <div className="flex gap-2 items-center border-l border-white/10 pl-4">
                 {(['FRIDAY', 'JARVIS', 'VISION'] as const).map(p => (
                     <button
                        key={p}
                        onClick={() => setActivePersona(p)}
                        className={`text-[10px] font-bold px-3 py-1 border ${activePersona === p ? `${borderColor} ${textColor} bg-white/10` : 'border-transparent text-slate-600'}`}
                     >
                         {p}
                     </button>
                 ))}
                 <button
                    onClick={() => handleSubmit(null)}
                    disabled={isLoading}
                    className={`ml-2 px-6 py-2 ${isLoading ? 'bg-white/10' : `bg-${theme}-500/20`} border ${borderColor} ${textColor} text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors`}
                 >
                     {isLoading ? 'EXECUTING...' : 'ENGAGE'}
                 </button>
             </div>
        </div>
        <div className="px-4 py-1 flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-white/5 bg-black/40">
            <span>LOG: {statusLog}</span>
            <span>SECURE CHANNEL ENCRYPTED</span>
        </div>
    </div>
  );
};

export default CommandBar;
