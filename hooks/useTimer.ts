
import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerState {
    mode: 'POMODORO' | 'STOPWATCH';
    timeLeft: number; // in seconds
    elapsed: number; // in seconds
    isActive: boolean;
    duration: number; // original duration for progress calc
}

export const useTimer = () => {
    const [mode, setMode] = useState<'POMODORO' | 'STOPWATCH'>('POMODORO');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [duration, setDuration] = useState(25 * 60);
    const [elapsed, setElapsed] = useState(0);
    const [isActive, setIsActive] = useState(false);
    
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                if (mode === 'POMODORO') {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(intervalRef.current);
                            setIsActive(false);
                            // Optional: Play alarm sound here
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setElapsed((prev) => prev + 1);
                }
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, mode]);

    const startTimer = useCallback((seconds: number) => {
        setMode('POMODORO');
        setDuration(seconds);
        setTimeLeft(seconds);
        setElapsed(0);
        setIsActive(true);
    }, []);

    const startStopwatch = useCallback(() => {
        setMode('STOPWATCH');
        setElapsed(0);
        setIsActive(true);
    }, []);

    const toggleTimer = useCallback(() => setIsActive(prev => !prev), []);
    
    const resetTimer = useCallback(() => {
        setIsActive(false);
        if (mode === 'POMODORO') {
            setTimeLeft(duration);
        } else {
            setElapsed(0);
        }
    }, [mode, duration]);

    return {
        timerState: { mode, timeLeft, elapsed, isActive, duration },
        timerControls: { startTimer, startStopwatch, toggleTimer, resetTimer, setMode }
    };
};
