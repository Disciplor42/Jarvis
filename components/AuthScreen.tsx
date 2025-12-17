
import React, { useState } from 'react';
import { getApiUrl, setApiUrl } from '../services/storageService';

interface AuthScreenProps {
  onLogin: (username: string, password: string, keepLoggedIn: boolean) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<boolean>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Server Config State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiUrl());

  const handleServerSave = () => {
    try {
      const url = new URL(serverUrl);
      if (!url.hostname) throw new Error("Missing hostname");
      setApiUrl(serverUrl);
      setShowServerConfig(false);
      setError('');
      setSuccessMsg('Server endpoint updated. Retry connection.');
    } catch (e) {
      setError('Invalid URL format. Example: http://192.168.1.1:3000/api');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error('Passcodes do not match.');
        }
        if (password.length < 4) {
          throw new Error('Passcode too short (min 4 chars).');
        }
        
        const success = await onRegister(username, password);
        if (success) {
          setSuccessMsg('Identity Established. Please Authenticate.');
          setIsRegister(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        await onLogin(username, password, keepLoggedIn);
      }
    } catch (err: any) {
      const msg = err.message || 'Unknown Error';
      setError(msg);
      if (
          msg.includes("Invalid Server URL") || 
          msg.includes("Cannot connect") || 
          msg.includes("Failed to fetch")
      ) {
          setShowServerConfig(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-red-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Iron Man / War Machine / Vision Gradients */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-700 via-yellow-500 to-blue-600"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-yellow-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-red-900/50 p-8 shadow-2xl shadow-red-900/20 clip-path-tech">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-tech text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-600 tracking-wider drop-shadow-lg">
            JARVIS
          </h1>
          <p className="text-red-400/80 text-xs tracking-[0.3em] uppercase mt-2 font-mono">
            {isRegister ? 'New User Protocol' : 'Stark Industries Secure Login'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border-l-2 border-red-500 text-red-400 text-xs font-mono animate-fade-in-down">
            <div className="font-bold">CONNECTION ERROR</div>
            <div className="opacity-80 mt-1">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-950/50 border-l-2 border-green-500 text-green-400 text-xs font-mono animate-fade-in-down">
            {successMsg}
          </div>
        )}

        {!showServerConfig ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-red-500/80 text-[10px] font-bold tracking-widest uppercase mb-1">Identity</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 text-red-100 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono tracking-wide placeholder-slate-700 transition-all text-sm"
                placeholder="USERNAME"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-red-500/80 text-[10px] font-bold tracking-widest uppercase mb-1">Passcode</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 text-red-100 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono tracking-wide placeholder-slate-700 transition-all text-sm"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {isRegister && (
              <div className="animate-fade-in-down">
                <label className="block text-red-500/80 text-[10px] font-bold tracking-widest uppercase mb-1">Confirm Passcode</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 text-red-100 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono tracking-wide placeholder-slate-700 transition-all text-sm"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {!isRegister && (
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="accent-red-600 w-3 h-3 cursor-pointer"
                  />
                  <label htmlFor="keepLoggedIn" className="text-[10px] text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-red-400">
                    Keep me logged in
                  </label>
               </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(153,27,27,0.4)] hover:shadow-[0_0_30px_rgba(153,27,27,0.6)] border border-red-600/50 clip-path-button mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : (isRegister ? 'Initialize Protocol' : 'Authenticate')}
            </button>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
               <button 
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(''); setSuccessMsg(''); }}
                className="text-slate-500 hover:text-yellow-500 text-[10px] uppercase tracking-widest transition-colors"
               >
                 {isRegister ? 'Return to Login' : 'Create New Identity'}
               </button>

               <button
                 type="button"
                 onClick={() => setShowServerConfig(true)}
                 className="text-slate-600 hover:text-blue-400 text-[10px] uppercase tracking-widest transition-colors font-mono"
               >
                 [ SERVER CONFIG ]
               </button>
            </div>
          </form>
        ) : (
          <div className="animate-fade-in">
             <h3 className="text-blue-400 font-bold font-mono text-xs uppercase tracking-widest mb-4 border-b border-blue-900/50 pb-2">
               Network Configuration
             </h3>
             <div className="mb-4">
                <label className="block text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">Server Endpoint</label>
                <input 
                  type="text" 
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full bg-slate-950/50 border border-blue-900/50 text-blue-100 px-4 py-3 focus:border-blue-500 focus:outline-none font-mono text-xs tracking-wide"
                  placeholder="http://localhost:3000/api"
                />
                <div className="mt-2 text-[10px] text-slate-500 font-mono space-y-1">
                  <p>1. Ensure backend is running: <span className="text-white bg-slate-800 px-1">node server.js</span></p>
                  <p>2. Default Local: <span className="text-blue-400">http://localhost:3000/api</span></p>
                </div>
             </div>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowServerConfig(false)}
                 className="flex-1 py-2 bg-slate-800 text-slate-400 text-xs font-bold uppercase hover:bg-slate-700"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleServerSave}
                 className="flex-1 py-2 bg-blue-900 text-blue-200 text-xs font-bold uppercase hover:bg-blue-800 border border-blue-700"
               >
                 Save
               </button>
             </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 text-[10px] text-slate-600 font-mono">
        STARK INDUSTRIES SECURE SERVER CONNECTION
      </div>
    </div>
  );
};

export default AuthScreen;
