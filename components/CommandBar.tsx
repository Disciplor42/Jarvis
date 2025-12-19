
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
  modelConfig: { jarvis: string; transcription: string };
  weatherData?: WeatherData | null;
  theme?: 'cyan' | 'red';
  onLiveTranscript?: (text: string) => void;
}

const COMMAND_TEMPLATES = [
  "INITIALIZE PROJECT: ",
  "CREATE TASK: ",
  "START POMODORO FOR: ",
  "START STOPWATCH",
  "DEPLOY DAILY BRIEFING",
  "SHOW WEATHER TELEMETRY",
  "OPEN CALENDAR GRID",
  "LOCK FOCUS MODE",
  "PURGE COMPLETED TASKS",
  "SAVE MEMORY: ",
  "REVERT HUD LAYOUT",
  "CLOSE ALL WINDOWS"
];

const CommandBar: React.FC<CommandBarProps> = ({ 
    onCommandProcessed, isLoading: isAILoading, setIsLoading, memory, activeTasks, groqApiKey, modelConfig, weatherData,
    theme = 'cyan', onLiveTranscript
}) => {
  const [input, setInput] = useState('');
  const [statusLog, setStatusLog] = useState<string>('System Online. Ready.');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice Input Hook with Groq Whisper
  const { 
    isListening, 
    isProcessing: isTranscribing, 
    toggleListening 
  } = useVoiceInput((text) => {
      setInput(text);
      processCommand(text);
  }, groqApiKey, modelConfig.transcription);

  const isLoading = isAILoading || isTranscribing;

  // Update suggestions based on input
  useEffect(() => {
    if (input.trim().length > 0 && !isListening) {
      const filtered = COMMAND_TEMPLATES.filter(cmd => 
        cmd.toLowerCase().includes(input.toLowerCase()) && 
        cmd.toLowerCase() !== input.toLowerCase()
      );
      setSuggestions(filtered.slice(0, 5));
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [input, isListening]);

  useEffect(() => {
    if (isTranscribing) {
      setStatusLog('Translating Audio Frequencies...');
    }
  }, [isTranscribing]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setStatusLog('Processing Directive...');
    setSuggestions([]);

    try {
      const results = await parseUserCommand(
          text, 
          groqApiKey, 
          modelConfig, 
          'JARVIS', 
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
      setInput(''); 

    } catch (err: any) {
      console.error(err);
      setStatusLog(`System Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        setInput(selected);
        if (!selected.endsWith(': ')) {
          processCommand(selected);
        } else {
          setSuggestions([]);
        }
      } else {
        processCommand(input);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && inputRef.current?.selectionStart === input.length)) {
      if (suggestions.length > 0) {
        e.preventDefault();
        setInput(suggestions[0]);
        setSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const borderColor = theme === 'red' ? 'border-red-500' : 'border-cyan-500';
  const textColor = theme === 'red' ? 'text-red-500' : 'text-cyan-500';
  const bgColor = theme === 'red' ? 'bg-red-950/30' : 'bg-cyan-950/30';
  const accentGlow = theme === 'red' ? 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_10px_rgba(6,182,212,0.5)]';
  const placeholderColor = theme === 'red' ? 'placeholder-red-800' : 'placeholder-cyan-800';

  return (
    <div className={`flex flex-col h-full ${bgColor} relative`}>
        {/* Suggestion Overlay */}
        {suggestions.length > 0 && (
          <div className={`absolute bottom-full left-4 mb-2 w-72 bg-black/90 border ${borderColor} ${accentGlow} clip-hud-panel z-[120] animate-fade-in-up`}>
            <div className="p-1 border-b border-white/5 bg-white/5 text-[8px] font-mono text-slate-500 tracking-widest px-2">SUGGESTED PROTOCOLS</div>
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInput(suggestion);
                  if (!suggestion.endsWith(': ')) processCommand(suggestion);
                  else inputRef.current?.focus();
                }}
                className={`w-full text-left px-3 py-2 text-[10px] font-mono border-b border-white/5 last:border-0 transition-colors
                  ${idx === selectedIndex ? `${theme === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'} border-l-2 ${borderColor}` : 'text-slate-400 hover:bg-white/5'}
                `}
              >
                <span className="opacity-50 mr-2">>>></span>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 flex items-center px-4 gap-4">
             <div className="flex-1 relative">
                 {/* Ghost text for top suggestion */}
                 {suggestions.length > 0 && selectedIndex === -1 && (
                    <div className="absolute inset-0 flex items-center px-0 pointer-events-none opacity-30">
                        <span className={`text-base font-mono uppercase tracking-wider ${textColor}`}>
                            {input}<span className="text-slate-500">{suggestions[0].slice(input.length)}</span>
                        </span>
                    </div>
                 )}
                 <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "LISTENING... (PRESS ICON TO FINISH)" : isTranscribing ? "TRANSCRIBING..." : `ENTER DIRECTIVE...`}
                    className={`w-full bg-transparent border-none ${textColor} text-base font-mono ${placeholderColor} focus:outline-none uppercase tracking-wider pr-8 transition-all relative z-10`}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={isLoading}
                 />
                 {/* Voice Button */}
                 <button 
                    onClick={toggleListening}
                    disabled={isLoading && !isListening}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:text-white transition-colors z-20 ${isListening ? 'text-red-500 animate-pulse' : isTranscribing ? 'text-cyan-400 animate-spin' : 'text-slate-600'}`}
                    title="Voice Input (Groq Whisper)"
                 >
                    {isTranscribing ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                      </svg>
                    )}
                 </button>
             </div>
             <div className="flex gap-2 items-center border-l border-white/10 pl-4">
                 <button
                    onClick={() => processCommand(input)}
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
