
import React, { useState, useEffect } from 'react';
import { AppSettings, UserData } from '../types';
import { fetchAvailableModels } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  fullUserData?: UserData; // Added to access data for export
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, fullUserData }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [availableGroqModels, setAvailableGroqModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isScanningMic, setIsScanningMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if(isOpen) {
        setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const scanAudioDevices = async () => {
      if (!navigator.mediaDevices) {
        setMicError("Hardware Access Unavailable");
        return;
      }
      setIsScanningMic(true);
      setMicError(null);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices.filter(d => d.kind === 'audioinput');
          setAudioDevices(inputs);
          stream.getTracks().forEach(track => track.stop());
      } catch (e: any) {
          console.error("Mic scan failed", e);
          setMicError("Calibration Error");
      } finally {
          setIsScanningMic(false);
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

  const handleSave = () => onSave(localSettings);

  const handleDataDump = () => {
      if (!fullUserData) return;
      const dump = JSON.stringify(fullUserData, null, 2);
      navigator.clipboard.writeText(dump);
      alert("NEURAL NET DUMPED TO CLIPBOARD.\nPaste this into your external analysis model.");
  };

  const handleFactoryReset = () => {
      if (confirm("WARNING: CRITICAL SYSTEM WIPE.\nProceed?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const chatModels = availableGroqModels.length > 0 ? availableGroqModels.filter(m => !m.includes('whisper')) : ['moonshotai/kimi-k2-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  const transcriptionModels = availableGroqModels.filter(m => m.includes('whisper'));
  const audioOptions = transcriptionModels.length > 0 ? transcriptionModels : ['whisper-large-v3-turbo', 'whisper-large-v3'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-700 w-full max-w-lg p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-fade-in-up">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold font-tech text-white uppercase tracking-widest">System Configuration</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6">
          
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Security Keys</h3>
             <div>
                 <label className="block text-[10px] text-orange-500 mb-1 font-bold">GROQ API KEY (REQUIRED)</label>
                 <input 
                    type="password" 
                    value={localSettings.groqApiKey} 
                    onChange={e => handleChange('groqApiKey', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono focus:border-cyan-500 outline-none"
                    placeholder="gsk_..."
                 />
             </div>
          </div>
          
          <div className="space-y-3">
             <div className="flex justify-between items-end border-b border-slate-800 pb-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Audio Hardware</h3>
                 <button onClick={scanAudioDevices} className="text-[10px] text-green-400 hover:text-white underline font-mono">
                     {isScanningMic ? 'SCANNING...' : 'SCAN HW'}
                 </button>
             </div>
             <select
                value={localSettings.audioInputDeviceId || ''}
                onChange={e => handleChange('audioInputDeviceId', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono uppercase focus:border-cyan-500 outline-none"
             >
                 <option value="">System Default</option>
                 {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
             </select>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-end border-b border-slate-800 pb-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model Pipeline</h3>
                 <button onClick={handleFetchModels} className="text-[10px] text-cyan-400 hover:text-white underline font-mono">REFRESH</button>
             </div>
             <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-bold">INTELLIGENCE (JARVIS)</label>
                <select value={localSettings.models.jarvis} onChange={e => handleModelChange('jarvis', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono mb-2">
                    {chatModels.map(m => <option key={`j-${m}`} value={m}>{m}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-bold">TRANSCRIPTION</label>
                <select value={localSettings.models.transcription} onChange={e => handleModelChange('transcription', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 font-mono">
                    {audioOptions.map(m => <option key={`t-${m}`} value={m}>{m}</option>)}
                </select>
             </div>
          </div>

          {/* DATA EXPORT */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Operations</h3>
              <button 
                onClick={handleDataDump}
                className="w-full py-2 bg-amber-900/20 text-amber-500 border border-amber-900/50 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-900/40 transition-colors"
              >
                  [ DUMP NEURAL NET TO CLIPBOARD ]
              </button>
          </div>

          <div className="pt-2 flex gap-3">
             <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700">Abort</button>
             <button onClick={handleSave} className="flex-1 py-3 bg-cyan-900 text-cyan-100 text-xs font-bold uppercase hover:bg-cyan-800 border border-cyan-700">Commit</button>
          </div>
          
          <button onClick={handleFactoryReset} className="w-full text-[9px] text-red-900 hover:text-red-500 mt-2 font-bold uppercase">System Wipe</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
