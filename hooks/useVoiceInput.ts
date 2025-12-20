
import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioRecorder, transcribeAudio } from '../services/groqService';

/**
 * useVoiceInput Hook
 * Consistently uses Groq Whisper for all voice-to-text operations.
 */
export const useVoiceInput = (
  onCommand: (text: string) => void,
  apiKey: string,
  model: string
) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const onCommandRef = useRef(onCommand);

  // Keep onCommand fresh to avoid closure staleness
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const stop = useCallback(async () => {
    if (!recorderRef.current || !isListening) return;

    setIsListening(false);
    setIsProcessing(true);
    setVoiceError(null);

    try {
      const audioBlob = await recorderRef.current.stop();
      if (audioBlob && audioBlob.size > 0) {
        const text = await transcribeAudio(apiKey, model, audioBlob);
        setTranscript(text);
        if (text.trim()) {
          onCommandRef.current(text);
        }
      } else {
        setVoiceError("NO AUDIO");
      }
    } catch (err: any) {
      console.error("Transcription failed:", err);
      setVoiceError("TRANSCRIPTION FAIL");
    } finally {
      setIsProcessing(false);
    }
  }, [isListening, apiKey, model]);

  const start = useCallback(async () => {
    if (isListening || isProcessing) return;

    setVoiceError(null);
    setTranscript('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError("INSECURE CONTEXT");
      return;
    }

    try {
      if (!apiKey) {
        setVoiceError("NO API KEY");
        return;
      }

      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }

      await recorderRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Voice start failed:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVoiceError("MIC BLOCKED");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setVoiceError("NO MIC FOUND");
      } else {
        setVoiceError("INIT FAIL");
      }
      setIsListening(false);
    }
  }, [isListening, isProcessing, apiKey]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && isListening) {
        recorderRef.current.stop().catch(() => {});
      }
    };
  }, [isListening]);

  return { 
    isListening, 
    isProcessing, 
    toggleListening, 
    voiceError, 
    transcript 
  };
};
