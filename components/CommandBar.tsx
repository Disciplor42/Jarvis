
import React, { useState, useEffect, useRef } from 'react';
import { AiParseResult, Task, WeatherData, AppMode } from '../types';
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
  currentMode?: AppMode; // Added
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
  "SAVE MEMORY: "
];

// Fuzzy scoring helper
const calculateFuzzyScore = (text: string, query: string): number => {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    
    // Exact match
    if (t === q) return 100;
    
    // Starts with
    if (t.startsWith(q)) return 80;
    
    // Contains
    if (t.includes(q)) return 60;
    
    // Fuzzy sequence check
    let qIdx = 0;
    let score = 0;
    for (let i = 0; i < t.length && qIdx < q.length; i++) {
        if (t[i] === q[qIdx]) {
            qIdx++;
            score += 1;
        }
    }
    
    // Only return a score if the full query sequence exists in text (in order)
    if (qIdx === q.length) return 20 + (score / t.length) * 10;
    
    return 0;
};

const CommandBar: React.FC<CommandBarProps> = ({ 
    onCommandProcessed, isLoading: isAILoading, setIsLoading, memory, activeTasks, groqApiKey, modelConfig, weatherData,
    theme = 'cyan', currentMode
}) => {
  const [input, setInput] = useState('');
  const [statusLog, setStatusLog] = useState<string>('Ready');
  const [reasoningLog, setReasoningLog] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus Shortcut Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K to focus
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Update suggestions based on input using Fuzzy Matching
  useEffect(() => {
    if (input.trim().length > 0 && !isListening) {
      const query = input.trim();
      const candidates: { text: string; score: number; type: 'CMD' | 'TASK' | 'MEM' }[] = [];

      // 1. Templates
      COMMAND_TEMPLATES.forEach(cmd => {
          candidates.push({ text: cmd, score: calculateFuzzyScore(cmd, query), type: 'CMD' });
      });

      // 2. Tasks
      activeTasks.forEach(t => {
          const score = calculateFuzzyScore(t.title, query);
          if (score > 0) {
              // Add visual prefix for logic downstream
              candidates.push({ text: `TASK: ${t.title}`, score: score - 5, type: 'TASK' });
          }
      });

      // 3. Memory
      memory.forEach(m => {
          const score = calculateFuzzyScore(m, query);
          if (score > 0) {
              const snippet = m.length > 40 ? m.substring(0, 40) + '...' : m;
              candidates.push({ text: `MEM: ${snippet}`, score: score - 10, type: 'MEM' });
          }
      });

      const sorted = candidates
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6) // Show top 6
        .map(c => c.text);

      setSuggestions(sorted);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [input, isListening, activeTasks, memory]);

  useEffect(() => {
    if (isTranscribing) {
      setStatusLog('Translating Audio Frequencies...');
    }
  }, [isTranscribing]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setStatusLog('Analyzing Intent...');
    setReasoningLog('');
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
          weatherData ? `Temp ${weatherData.temp}C` : "Sensors Offline",
          undefined,
          currentMode // Pass mode
      );
      
      const actionCount = results.filter(r => r.action !== 'QUERY' && r.action !== 'UNKNOWN').length;

      // Extract reasoning
      if (results.length > 0 && results[0].reasoning) {
          setReasoningLog(results[0].reasoning);
      }

      if (actionCount > 0) {
          setStatusLog(`Exec: ${actionCount} Protocols.`);
      } else if (results.length > 0 && results[0].action === 'QUERY') {
          setStatusLog(`Response Recieved.`);
      } else {
          setStatusLog('Command unclear.');
      }

      onCommandProcessed(results);
      setInput(''); 

    } catch (err: any) {
      console.error(err);
      setStatusLog(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        
        // Strip prefix for input visual if it's a task/mem, or keep it to be explicit?
        // Let's keep the full text so the user sees what they selected, AI handles "TASK: ..." fine.
        setInput(selected);
        
        if (!selected.endsWith(': ')) {
          processCommand(selected);
        } else {
          setSuggestions([]);
          // If it ends with : space, keep focus to let user type param
          inputRef.current?.focus();
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
      inputRef.current?.blur();
    }
  };

  const borderColor = theme === 'red' ? 'border-red-500' : 'border-cyan-500';
  const textColor = theme === 'red' ? 'text-red-500' : 'text-cyan-500';
  const accentGlow = theme === 'red' ? 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_10px_rgba(6,182,212,0.5)]';

  return (
    <div className={`w-full max-w-3xl mx-auto relative group pointer-events-auto`}>
        {reasoningLog && (
            <div className={`absolute bottom-full mb-2 left-0 w-full p-2 bg-black/90 border-l-2 ${borderColor} backdrop-blur-md text-[10px] font-mono text-slate-300 animate-fade-in-up`}>
                <span className={`${textColor} font-bold mr-2`}>LOGIC CORE:</span>
                <span className="italic opacity-80">{reasoningLog}</span>
            </div>
        )}

        {suggestions.length > 0 && (
          <div className={`absolute bottom-full left-0 mb-2 w-full bg-black/90 border ${borderColor} ${accentGlow} clip-hud-panel z-[120] animate-fade-in-up`}>
            <div className="p-1 border-b border-white/5 bg-white/5 text-[8px] font-mono text-slate-500 tracking-widest px-2">SUGGESTED PROTOCOLS</div>
            {suggestions.map((suggestion, idx) => {
              // Parse visual type for icon
              let icon = ">>>";
              let display = suggestion;
              let itemColorClass = "text-slate-400";

              if (suggestion.startsWith("TASK:")) {
                  icon = "⬡";
                  display = suggestion.replace("TASK:", "").trim();
                  itemColorClass = theme === 'red' ? 'text-red-300' : 'text-cyan-300';
              } else if (suggestion.startsWith("MEM:")) {
                  icon = "🧠";
                  display = suggestion.replace("MEM:", "").trim();
                  itemColorClass = "text-purple-400";
              }

              return (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    if (!suggestion.endsWith(': ')) processCommand(suggestion);
                    else inputRef.current?.focus();
                  }}
                  className={`w-full text-left px-3 py-2 text-[10px] font-mono border-b border-white/5 last:border-0 transition-colors flex items-center
                    ${idx === selectedIndex ? `${theme === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'} border-l-2 ${borderColor}` : 'hover:bg-white/5'}
                  `}
                >
                  <span className={`opacity-50 mr-3 w-4 text-center ${itemColorClass}`}>{icon}</span>
                  <span className={`${idx === selectedIndex ? '' : itemColorClass} truncate`}>{display}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className={`relative flex items-center bg-black/80 backdrop-blur-xl border ${borderColor} shadow-2xl`}>
             <div className="hidden md:flex items-center px-3 border-r border-white/10 text-[9px] font-mono text-slate-500 w-32 shrink-0 truncate gap-2">
                 <span className="text-[8px] border border-slate-700 px-1 rounded text-slate-400">⌘K</span>
                 {statusLog}
             </div>

             <div className="flex-1 relative">
                 {/* Ghost Text (Only if it matches start of input exactly) */}
                 {suggestions.length > 0 && selectedIndex === -1 && suggestions[0].toLowerCase().startsWith(input.toLowerCase()) && (
                    <div className="absolute inset-0 flex items-center px-4 pointer-events-none opacity-30">
                        <span className={`text-sm font-mono uppercase tracking-wider ${textColor}`}>
                            {input}<span className="text-slate-500">{suggestions[0].slice(input.length)}</span>
                        </span>
                    </div>
                 )}
                 <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "LISTENING..." : isTranscribing ? "TRANSCRIBING..." : `COMMAND LINE_`}
                    className={`w-full bg-transparent border-none ${textColor} text-sm font-mono placeholder-slate-700 focus:outline-none uppercase tracking-wider px-4 py-3 pr-10`}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                 />
             </div>

             <button 
                onClick={toggleListening}
                disabled={isLoading && !isListening}
                className={`p-3 border-l border-white/10 hover:bg-white/5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : isTranscribing ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`}
                title="Voice Input (Ctrl+Space)"
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
    </div>
  );
};

export default CommandBar;
