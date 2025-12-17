
import React, { useState, useEffect, useRef } from 'react';

interface DailyBriefingProps {
  briefing: string;
  onRefresh: () => void;
  isLoading: boolean;
  onChat: () => void; 
}

const DailyBriefing: React.FC<DailyBriefingProps> = ({ briefing, onRefresh, isLoading, onChat }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const textIndex = useRef(0);
  const typingInterval = useRef<any>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Reset typewriter when briefing changes
  useEffect(() => {
    setDisplayedText('');
    textIndex.current = 0;
    
    if (typingInterval.current) clearInterval(typingInterval.current);

    if (briefing) {
      typingInterval.current = setInterval(() => {
        if (textIndex.current < briefing.length) {
          setDisplayedText((prev) => prev + briefing.charAt(textIndex.current));
          textIndex.current++;
          
          if (textContainerRef.current) {
             textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
          }
        } else {
          if (typingInterval.current) clearInterval(typingInterval.current);
        }
      }, 5); 
    } else {
      setDisplayedText('');
    }

    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  }, [briefing]);

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(briefing || "No data to read.");
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="h-full relative flex flex-col">
      {/* Background Visuals */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-yellow-500/5 blur-[40px] animate-pulse pointer-events-none"></div>
      
      <div className="relative z-10 flex gap-4 items-center shrink-0 mb-4">
        {/* Avatar */}
        <div className="shrink-0 w-12 h-12 rounded-full border-2 border-yellow-500/50 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(234,179,8,0.3)]">
           <div className={`w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15] ${isLoading ? 'animate-ping' : ''}`}></div>
        </div>

        <div className="flex-1 flex justify-between items-center border-b border-yellow-500/20 pb-2">
            <div>
              <h2 className="text-sm font-bold tracking-[0.2em] text-yellow-500 uppercase font-tech flex items-center gap-2">
                Vision Protocol
              </h2>
              <div className="text-[9px] text-slate-500 font-mono">TACTICAL ANALYSIS</div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleSpeak} className={`p-1.5 rounded transition-colors ${isSpeaking ? 'text-yellow-400 bg-yellow-900/30' : 'text-slate-500 hover:text-yellow-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                   <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                </svg>
              </button>
              <button onClick={onChat} disabled={isLoading || !briefing} className="p-1.5 text-slate-500 hover:text-yellow-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                  </svg>
              </button>
              <button onClick={onRefresh} disabled={isLoading} className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
              </button>
            </div>
        </div>
      </div>
      
      <div 
         ref={textContainerRef}
         className="flex-1 overflow-y-auto custom-scrollbar pr-2"
      >
        <p className="text-sm leading-relaxed font-light text-slate-300 font-mono border-l-2 border-yellow-500/30 pl-3 whitespace-pre-line">
          {displayedText}
          {displayedText.length < briefing.length && (
            <span className="inline-block w-2 h-4 bg-yellow-500 align-middle ml-1 animate-pulse"></span>
          )}
          {!briefing && !isLoading && "Sensors calibrated. Awaiting daily protocol initialization."}
        </p>
      </div>
    </div>
  );
};

export default DailyBriefing;
