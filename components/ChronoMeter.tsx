
import React, { useState } from 'react';
import { Task, StudySessionLog } from '../types';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface ChronoMeterProps {
  tasks: Task[];
  onLogTime: (taskId: string, seconds: number, logData: Omit<StudySessionLog, 'id' | 'timestamp' | 'duration' | 'taskId'>) => void;
  theme?: 'cyan' | 'red';
  timerState: {
      mode: 'POMODORO' | 'STOPWATCH';
      timeLeft: number;
      elapsed: number;
      isActive: boolean;
      duration: number;
  };
  timerControls: {
      startTimer: (seconds: number) => void;
      startStopwatch: () => void;
      toggleTimer: () => void;
      resetTimer: () => void;
      setMode: (mode: 'POMODORO' | 'STOPWATCH') => void;
  };
  groqApiKey: string;
  modelConfig: { jarvis: string; transcription: string };
}

const ChronoMeter: React.FC<ChronoMeterProps> = ({ 
  tasks, onLogTime, theme = 'cyan', timerState, timerControls, groqApiKey, modelConfig 
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  
  // Debrief State
  const [focusRating, setFocusRating] = useState(5);
  const [interferenceInput, setInterferenceInput] = useState('');
  const [interferences, setInterferences] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Voice Inputs
  const { 
      isListening: isListeningInt, 
      isProcessing: isProcInt, 
      toggleListening: toggleInt 
  } = useVoiceInput((text) => setInterferenceInput(text), groqApiKey, modelConfig.transcription);

  const { 
      isListening: isListeningNote, 
      isProcessing: isProcNote, 
      toggleListening: toggleNote 
  } = useVoiceInput((text) => setNotes(prev => prev + (prev ? ' ' : '') + text), groqApiKey, modelConfig.transcription);

  const handleStop = () => {
      timerControls.toggleTimer();
      // If stopping/finishing, open debrief
      if (timerState.isActive) {
          setIsDebriefOpen(true);
      }
  };

  const handleFinishDebrief = () => {
    const seconds = timerState.mode === 'POMODORO' ? (timerState.duration - timerState.timeLeft) : timerState.elapsed;
    
    if (selectedTaskId) {
        onLogTime(selectedTaskId, seconds, {
            focusRating,
            interferences,
            notes
        });
    }
    
    timerControls.resetTimer();
    setIsDebriefOpen(false);
    setInterferences([]);
    setNotes('');
    setFocusRating(5);
  };

  const addInterference = () => {
      if (interferenceInput.trim()) {
          setInterferences([...interferences, interferenceInput.trim()]);
          setInterferenceInput('');
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = timerState.mode === 'POMODORO' 
    ? (timerState.timeLeft / timerState.duration) * 100 
    : 100;
    
  const accentColor = theme === 'red' ? 'text-red-500' : 'text-cyan-500';
  const borderColor = theme === 'red' ? 'border-red-500' : 'border-cyan-500';

  // Helper for voice button style
  const renderVoiceBtn = (listening: boolean, processing: boolean, toggle: () => void) => (
      <button 
          onClick={toggle}
          disabled={processing && !listening}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${listening ? 'text-red-500 bg-red-900/20' : processing ? 'text-cyan-400 animate-spin' : 'text-slate-500 hover:text-cyan-400'}`}
          title="Dictate"
      >
          {processing ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
          )}
      </button>
  );

  if (isDebriefOpen) {
      return (
          <div className="h-full p-6 bg-[#05050a] flex flex-col animate-fade-in">
              <h2 className="text-sm font-bold font-tech uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-800 pb-2">Tactical Debrief</h2>
              
              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                  <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Focus Efficiency Index (1-10)</label>
                      <div className="flex items-center gap-4">
                          <input 
                            type="range" min="1" max="10" step="1" 
                            value={focusRating} 
                            onChange={(e) => setFocusRating(parseInt(e.target.value))}
                            className="flex-1 accent-cyan-500"
                          />
                          <span className={`text-xl font-bold font-mono ${focusRating > 7 ? 'text-green-500' : focusRating < 4 ? 'text-red-500' : 'text-yellow-500'}`}>
                              {focusRating}
                          </span>
                      </div>
                  </div>

                  <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Interference Log</label>
                      <div className="flex gap-2 mb-2">
                          <div className="relative flex-1">
                            <input 
                                type="text" 
                                value={interferenceInput}
                                onChange={(e) => setInterferenceInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addInterference()}
                                placeholder="e.g. Phone, Noise..."
                                className="w-full bg-slate-900 border border-slate-700 text-xs p-2 pr-8 text-white outline-none focus:border-cyan-500"
                            />
                            {renderVoiceBtn(isListeningInt, isProcInt, toggleInt)}
                          </div>
                          <button onClick={addInterference} className="bg-slate-800 px-3 text-xs font-bold text-slate-300 border border-slate-600">+</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {interferences.map((inf, i) => (
                              <span key={i} className="bg-red-900/30 text-red-400 border border-red-900 text-[9px] px-2 py-1 uppercase font-bold">
                                  {inf}
                              </span>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Session Notes</label>
                      <div className="relative">
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs p-2 h-20 outline-none focus:border-cyan-500 resize-none font-mono"
                            placeholder="Log cognitive breakthroughs..."
                        />
                        <div className="absolute right-2 bottom-2">
                             {renderVoiceBtn(isListeningNote, isProcNote, toggleNote)}
                        </div>
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleFinishDebrief}
                className={`w-full py-3 mt-4 ${theme === 'red' ? 'bg-red-900/50 hover:bg-red-800' : 'bg-cyan-900/50 hover:bg-cyan-800'} border ${borderColor} text-white font-bold font-tech uppercase tracking-widest transition-all`}
              >
                  Archive Session Data
              </button>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-[#05050a] font-mono relative overflow-hidden">
      {/* T-Minus Event Horizon Widget (Mini) */}
      <div className="absolute top-2 right-2 flex flex-col items-end opacity-50">
          <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest">Event Horizon</span>
          <span className="text-[10px] font-mono text-red-400">T-MINUS 14:02:00</span>
      </div>

      <div className="flex justify-between mb-4 border-b border-slate-800 pb-2 mt-4">
        <button 
          onClick={() => { timerControls.setMode('POMODORO'); timerControls.resetTimer(); }}
          className={`text-[10px] px-3 py-1 border ${timerState.mode === 'POMODORO' ? `border-cyan-500 text-cyan-400 bg-cyan-900/20` : 'border-slate-800 text-slate-500'}`}
        >
          SESSION
        </button>
        <button 
          onClick={() => { timerControls.setMode('STOPWATCH'); timerControls.resetTimer(); }}
          className={`text-[10px] px-3 py-1 border ${timerState.mode === 'STOPWATCH' ? `border-cyan-500 text-cyan-400 bg-cyan-900/20` : 'border-slate-800 text-slate-500'}`}
        >
          COUNT
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-900" />
                <circle 
                  cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={502.4} 
                  strokeDashoffset={502.4 * (1 - progress / 100)} 
                  className={`${accentColor} transition-all duration-1000 shadow-[0_0_15px_currentColor]`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold tracking-tighter ${accentColor}`}>
                  {timerState.mode === 'POMODORO' ? formatTime(timerState.timeLeft) : formatTime(timerState.elapsed)}
                </span>
                <span className="text-[9px] text-slate-600 uppercase tracking-widest">{timerState.isActive ? 'ACTIVE' : 'IDLE'}</span>
            </div>
        </div>

        <div className="mt-8 flex gap-4">
            <button 
              onClick={timerState.isActive ? handleStop : timerControls.toggleTimer} 
              className={`px-6 py-2 border ${timerState.isActive ? 'border-amber-500 text-amber-500 bg-amber-900/10' : 'border-green-500 text-green-500 bg-green-900/10'} text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all`}
            >
              {timerState.isActive ? 'LOG & STOP' : 'ENGAGE'}
            </button>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Assign Protocol</label>
          <select 
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px] p-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="">-- General Study --</option>
            {tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
      </div>
    </div>
  );
};

export default ChronoMeter;
