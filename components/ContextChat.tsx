
import React, { useState, useEffect, useRef } from 'react';
import { Task, AiParseResult, ChatMessage, AppMode } from '../types';
import { parseUserCommand } from '../services/aiService';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface ContextChatProps {
    isOpen: boolean;
    onClose: () => void;
    contextTask: Task | null;
    groqApiKey: string;
    modelConfig: { jarvis: string; transcription: string };
    onCommandProcessed: (results: AiParseResult[]) => void;
    currentMode?: AppMode;
}

const ContextChat: React.FC<ContextChatProps> = ({ 
    isOpen, onClose, contextTask, groqApiKey, modelConfig, onCommandProcessed, currentMode
}) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Voice Input Hook (Consistently using Groq Whisper)
    const { 
      isListening, 
      isProcessing: isTranscribing, 
      toggleListening, 
      transcript 
    } = useVoiceInput(
      (text) => {
        setInput(text);
        // Note: We don't auto-send here to allow the user to review the transcript in Chat mode
      }, 
      groqApiKey, 
      modelConfig.transcription
    );

    // Initialize chat when context changes
    useEffect(() => {
        if (contextTask) {
            setMessages([{
                id: 'init',
                sender: 'ai',
                text: `Context Established: Protocol "${contextTask.title}". Awaiting directives.`,
                timestamp: Date.now()
            }]);
        } else {
            // Only reset if empty to avoid wiping history on simple re-renders
            if (messages.length === 0) {
                setMessages([{
                    id: 'init',
                    sender: 'ai',
                    text: `Secure Channel Open. I am ready to process scheduling, memory, or tactical data.`,
                    timestamp: Date.now()
                }]);
            }
        }
    }, [contextTask]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !groqApiKey) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Pass contextTask.id to the service so the LLM knows what we are talking about
            const results = await parseUserCommand(
                userMsg.text, 
                groqApiKey, 
                modelConfig, 
                'JARVIS', 
                [], 
                contextTask ? [contextTask] : [], // Pass active task as context
                [], 
                [], 
                "Standard Atmosphere",
                contextTask?.id,
                currentMode // Pass mode
            );

            // Execute actions immediately if valid
            if (results.length > 0) {
                onCommandProcessed(results);
            }

            // Only show text response if it's a Query or if the AI decided to talk
            const queryRes = results.find(r => r.action === 'QUERY');
            const toolCount = results.filter(r => r.action !== 'QUERY' && r.action !== 'UNKNOWN').length;
            
            let responseText = "";
            if (queryRes && queryRes.queryResponse) {
                responseText = queryRes.queryResponse;
            } else if (toolCount > 0) {
                responseText = `Acknowledged. ${toolCount} protocols initialized. Check Approval Queue.`;
            } else {
                responseText = "Processing complete. No actions required.";
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'ai',
                text: responseText,
                timestamp: Date.now()
            }]);

        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: "Connection interruption.", timestamp: Date.now() }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full w-full bg-[#0b1120] relative">
            {/* Header - Optional inside window, but useful for context display */}
            <div className="p-3 border-b border-cyan-900/30 flex justify-between items-center bg-cyan-950/10 shrink-0">
                <div>
                    <h3 className="text-cyan-400 font-tech font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                        {contextTask ? 'Protocol Analysis' : 'Secure Comms'}
                    </h3>
                    {contextTask && <p className="text-[9px] text-slate-500 font-mono truncate max-w-[200px]">{contextTask.title}</p>}
                </div>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-2.5 text-xs font-mono rounded-sm border shadow-md ${
                            msg.sender === 'user' 
                            ? 'bg-slate-800/80 border-slate-600 text-slate-200' 
                            : 'bg-cyan-950/40 border-cyan-800/40 text-cyan-100'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {(isTyping || isTranscribing) && (
                    <div className="flex justify-start">
                        <div className="bg-cyan-950/20 border border-cyan-800/20 p-2 rounded-sm flex gap-1 items-center">
                            <span className="text-[9px] text-cyan-600 font-mono uppercase mr-2">
                              {isTranscribing ? 'Hearing...' : 'Thinking...'}
                            </span>
                            <div className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-1 bg-cyan-600 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-2 border-t border-cyan-900/30 bg-slate-900/90 shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening... (Press to stop)" : isTranscribing ? "Transcribing..." : "Transmit orders..."}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 pr-8 focus:outline-none focus:border-cyan-700 font-mono rounded-none transition-colors"
                            autoFocus
                            disabled={isTranscribing || isTyping}
                        />
                        <button 
                            type="button"
                            onClick={toggleListening}
                            disabled={isTyping}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500 animate-pulse' : isTranscribing ? 'text-cyan-400 animate-spin' : 'text-slate-500 hover:text-cyan-400'}`}
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
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTranscribing || isTyping}
                        className="bg-cyan-900/20 border border-cyan-800 text-cyan-500 p-2 hover:bg-cyan-900/40 hover:text-cyan-300 transition-colors disabled:opacity-30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContextChat;
