
import { useState, useRef } from 'react';
import { WindowState, WindowType } from '../types';

export const useWindowManager = () => {
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [isFocusLocked, setIsFocusLocked] = useState(false);
    
    // Attention Stack for Undo
    const historyStack = useRef<WindowState[][]>([]);

    const pushSnapshot = () => {
        // Deep copy windows to history
        const snapshot = windows.map(w => ({ ...w }));
        historyStack.current.push(snapshot);
        // Limit stack size
        if (historyStack.current.length > 10) historyStack.current.shift();
    };

    const revertView = () => {
        const previousState = historyStack.current.pop();
        if (previousState) {
            setWindows(previousState);
            return true;
        }
        return false;
    };

    const canModifyWindows = () => {
        if (isFocusLocked) return false;
        return true;
    };

    const toggleWindow = (type: WindowType, title: string) => {
        if (!canModifyWindows() && !windows.find(w => w.type === type)) {
            // If locked, prevent opening new windows
            return false;
        }

        setWindows(prev => {
            const exists = prev.find(w => w.type === type);
            if (exists) {
                return prev.filter(w => w.type !== type);
            }
            // Add new window with default flex weight of 1
            return [...prev, { id: type, type, title, isOpen: true, width: 1 }];
        });
        return true;
    };

    const openWindow = (type: WindowType, title: string) => {
        if (!canModifyWindows() && !windows.find(w => w.type === type)) {
            return false;
        }

        setWindows(prev => {
            if (prev.find(w => w.type === type)) return prev;
            return [...prev, { id: type, type, title, isOpen: true, width: 1 }];
        });
        return true;
    };

    const closeWindow = (id: string) => {
        // Closing is usually allowed even in focus lock to remove distractions, 
        // unless strictly interpreted. We'll allow closing.
        setWindows(prev => prev.filter(w => w.id !== id));
    };

    // Manual Resize (ID based, flex weight)
    const resizeWindow = (id: string, width: number) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, width } : w));
    };

    // AI / Preset Resize (Type based, percentage 1-100)
    const setWindowSize = (type: WindowType, percent: number) => {
         setWindows(prev => {
             const othersCount = prev.filter(w => w.type !== type).length;
             if (othersCount === 0) return prev.map(w => w.type === type ? { ...w, width: 100 } : w);
             
             const remaining = 100 - percent;
             const otherWidth = Math.max(0.1, remaining / othersCount);
             
             return prev.map(w => {
                 if (w.type === type) return { ...w, width: percent };
                 return { ...w, width: otherWidth };
             });
         });
    };
    
    const restoreLayout = (savedWindows: WindowState[]) => {
        setWindows(savedWindows);
    };

    return {
        windows,
        toggleWindow,
        openWindow,
        closeWindow,
        resizeWindow,
        setWindowSize,
        pushSnapshot,
        revertView,
        isFocusLocked,
        setIsFocusLocked,
        restoreLayout
    };
};
