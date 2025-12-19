
import { useState, useRef } from 'react';
import { WindowState, WindowType, WindowInstruction } from '../types';

export const useWindowManager = () => {
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [isFocusLocked, setIsFocusLocked] = useState(false);
    const historyStack = useRef<WindowState[][]>([]);

    const toggleWindow = (type: WindowType, title: string) => {
        setWindows(prev => {
            const exists = prev.find(w => w.type === type);
            if (exists) return prev.filter(w => w.type !== type);
            return [...prev, { id: type, type, title, isOpen: true, width: 1 }];
        });
        return true;
    };

    const openWindow = (type: WindowType, title: string) => {
        setWindows(prev => {
            if (prev.find(w => w.type === type)) return prev;
            return [...prev, { id: type, type, title, isOpen: true, width: 1 }];
        });
        return true;
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
    };

    const batchUpdate = (instructions: WindowInstruction[], clearHUD?: boolean) => {
        setWindows(prev => {
            let next = clearHUD ? [] : [...prev];
            
            instructions.forEach(ins => {
                if (ins.action === 'CLOSE') {
                    next = next.filter(w => w.type !== ins.target);
                } else if (ins.action === 'OPEN' || ins.action === 'FOCUS') {
                    const exists = next.find(w => w.type === ins.target);
                    if (!exists) {
                        next.push({ id: ins.target, type: ins.target, title: ins.title || ins.target, isOpen: true, width: ins.size || 1 });
                    } else if (ins.size) {
                        exists.width = ins.size;
                    }
                } else if (ins.action === 'RESIZE') {
                    const exists = next.find(w => w.type === ins.target);
                    if (exists) exists.width = ins.size || exists.width;
                }
            });
            
            return [...next];
        });
    };

    return {
        windows,
        toggleWindow,
        openWindow,
        closeWindow,
        batchUpdate,
        isFocusLocked,
        setIsFocusLocked
    };
};
