
import { useState, useRef, useEffect, useCallback } from 'react';

export const useVoiceInput = (onCommand: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState(''); // Live transcript
    
    const callbackRef = useRef(onCommand);
    const recognitionRef = useRef<any>(null);
    const isStartPending = useRef(false);

    useEffect(() => {
        callbackRef.current = onCommand;
    }, [onCommand]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors on stop
            }
        }
        setIsListening(false);
    }, []);

    const start = useCallback(() => {
        if (isStartPending.current) return;
        
        setVoiceError(null);
        setTranscript(''); // Clear previous
        
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch(e){}
            recognitionRef.current = null;
        }

        if (typeof window === 'undefined') return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setVoiceError("NOT SUPPORTED");
            return;
        }

        isStartPending.current = true;
        setIsListening(true); 

        const recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.interimResults = true; // CHANGED: Enable live text feedback
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isStartPending.current = false;
            setIsListening(true);
            setVoiceError(null);
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Update live view
            setTranscript(finalTranscript || interimTranscript);

            if (finalTranscript && finalTranscript.trim()) {
                callbackRef.current(finalTranscript);
                // We typically stop after one command, or you can keep it open
                // For this implementation, we rely on the stop() call in onend or manual
            }
        };

        recognition.onerror = (event: any) => {
            isStartPending.current = false;
            console.warn("Voice Error:", event.error);
            if (event.error === 'no-speech') {
                // Ignorable
            } else if (event.error === 'network') {
                setVoiceError("NET ERROR");
            } else if (event.error === 'not-allowed') {
                setVoiceError("BLOCKED");
            } else {
                setVoiceError(event.error.toUpperCase());
            }
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            isStartPending.current = false;
            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Start Error:", e);
            isStartPending.current = false;
            setVoiceError("START FAIL");
            setIsListening(false);
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening || isStartPending.current) {
            stop();
        } else {
            start();
        }
    }, [isListening, start, stop]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch(e){}
            }
        };
    }, []);

    return { isListening, toggleListening, voiceError, transcript };
};
