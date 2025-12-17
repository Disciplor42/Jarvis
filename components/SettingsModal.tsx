
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { fetchAvailableModels } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [availableGroqModels, setAvailableGroqModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Audio Input State
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if(isOpen) {
        setLocalSettings(settings);
        scanAudioDevices();
    }
  }, [isOpen, settings]);

  const scanAudioDevices = async () => {
      try {
          // Request permission first to get labels
          await navigator.mediaDevices.getUserMedia({ audio: true });
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices.filter(d => d.kind === 'audioinput');
          setAudioDevices(inputs);
      } catch (e) {
          console.error("Mic scan failed", e);
      }
  };

  const handleFetchModels = async () => {
    if(!localSettings.groqApiKey) {
        alert("Enter Groq API Key to fetch models.");
        return;
    }
    setIsLoadingModels(true);
    const models = await fetchAvailableModels(localSettings.groqApiKey);
    setAvailableGroqModels(models);
    setIsLoadingModels(false);
  };

  const handleChange = (field: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleModelChange = (key: keyof AppSettings['models'], value: string) => {
      setLocalSettings(prev => ({
          ...prev,
          models: { ...prev.models, [key]: value }
      }));
  };

  const handleDeleteMacro = (index: number) => {
      const newMacros = localSettings.layoutMacros.filter((_, i) => i !== index);
      setLocalSettings(prev => ({ ...prev, layoutMacros: newMacros }));
  };

  const handleSave = () => {
      onSave(localSettings);
  };

  const handleFactoryReset = () => {
      if (confirm("WARNING: CRITICAL SYSTEM WIPE.\nThis will delete all Tasks, Events, Memories, and API Keys from this device.\n\nProceed?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const allModels = availableGroqModels.length > 0 ? availableGroqModels : ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  const transcriptionModels = availableGroqModels.filter(m => m.includes('whisper'));
  const audioOptions = transcriptionModels.length > 0 ? transcriptionModels : ['whisper-large-v3'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-700 w-full max-w-lg p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-fade-in-up">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold font-tech text-white">SYSTEM CONFIGURATION</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6">
          
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Security Keys</h3>

             <div>
                 <label className="block text-[10px] text-orange-500 mb-1">GROQ API KEY (REQUIRED)</label>
                 <input 
                    type="password" 
                    value={localSettings.groqApiKey} 
                    onChange={e => handleChange('groqApiKey', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono"
                    placeholder="gsk_..."
                 />
                 <p className="text-[9px] text-slate-600 mt-1">Required for AI processing. Not stored on external servers.</p>
             </div>
          </div>
          
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Audio Hardware</h3>
             <div>
                 <label className="block text-[10px] text-green-500 mb-1">MICROPHONE INPUT</label>
                 <select
                    value={localSettings.audioInputDeviceId || ''}
                    onChange={e => handleChange('audioInputDeviceId', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono uppercase"
                 >
                     <option value="">System Default</option>
                     {audioDevices.map(d => (
                         <option key={d.deviceId} value={d.deviceId}>
                             {d.label || `Microphone ${d.deviceId.slice(0,5)}...`}
                         </option>
                     ))}
                 </select>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-end border-b border-slate-800 pb-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model Allocation</h3>
                 <button 
                    onClick={handleFetchModels}
                    disabled={isLoadingModels}
                    className="text-[10px] text-cyan-400 hover:text-white underline"
                 >
                     {isLoadingModels ? 'SCANNING...' : 'REFRESH LIST'}
                 </button>
             </div>

             <div>
                 <label className="block text-[10px] text-cyan-400 uppercase mb-1">FRIDAY (TACTICAL / FAST)</label>
                 <select
                    value={localSettings.models.friday}
                    onChange={e => handleModelChange('friday', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono"
                 >
                    <option value="">-- Select Model --</option>
                    {allModels.map(m => <option key={`f-${m}`} value={m}>{m}</option>)}
                 </select>
             </div>

             <div>
                 <label className="block text-[10px] text-red-400 uppercase mb-1">JARVIS (EXECUTIVE / COMPLEX)</label>
                 <select
                    value={localSettings.models.jarvis}
                    onChange={e => handleModelChange('jarvis', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono"
                 >
                    <option value="">-- Select Model --</option>
                    {allModels.map(m => <option key={`j-${m}`} value={m}>{m}</option>)}
                 </select>
             </div>

             <div>
                 <label className="block text-[10px] text-yellow-400 uppercase mb-1">VISION (BRIEFING / ANALYSIS)</label>
                 <select
                    value={localSettings.models.vision}
                    onChange={e => handleModelChange('vision', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono"
                 >
                    <option value="">-- Select Model --</option>
                    {allModels.map(m => <option key={`v-${m}`} value={m}>{m}</option>)}
                 </select>
             </div>

             <div>
                 <label className="block text-[10px] text-orange-400 uppercase mb-1">HEARING (TRANSCRIPTION)</label>
                 <select
                    value={localSettings.models.transcription}
                    onChange={e => handleModelChange('transcription', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono"
                 >
                    <option value="">-- Select Audio Model --</option>
                    {audioOptions.map(m => <option key={`t-${m}`} value={m}>{m}</option>)}
                 </select>
             </div>
          </div>
          
          {/* LAYOUT MACROS SECTION */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Saved Layouts (Macros)</h3>
             {localSettings.layoutMacros && localSettings.layoutMacros.length > 0 ? (
                 <div className="grid grid-cols-2 gap-2">
                     {localSettings.layoutMacros.map((macro, i) => (
                         <div key={i} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700">
                             <span className="text-xs text-cyan-400 font-mono truncate">{macro.name}</span>
                             <button onClick={() => handleDeleteMacro(i)} className="text-red-500 hover:text-red-400 px-2 font-bold text-xs">X</button>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="text-[10px] text-slate-600 italic">No custom layouts saved. Use voice command "Save layout as [name]" to create one.</div>
             )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
             <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-cyan-900 text-cyan-100 text-xs font-bold uppercase hover:bg-cyan-800 border border-cyan-700">Save Config</button>
             </div>
             
             <button 
                onClick={handleFactoryReset}
                className="w-full py-2 bg-red-950/30 text-red-500 hover:text-red-400 text-[10px] uppercase font-bold tracking-widest border border-red-900/50 hover:bg-red-900/50"
             >
                Initialize System Factory Reset
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
