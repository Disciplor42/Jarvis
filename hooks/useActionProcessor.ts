
import React, { useState, useCallback } from 'react';
import { PendingAction, Task, AiParseResult, Project, WindowInstruction, HUDTheme } from '../types';

export const useActionProcessor = (
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    setMemory: React.Dispatch<React.SetStateAction<string[]>>,
    showNotification: (msg: string) => void,
    onOpenWindow: (type: any, title: string) => void,
    setProjects?: React.Dispatch<React.SetStateAction<Project[]>>,
    onBatchWindowUpdate?: (instructions: WindowInstruction[], clearHUD?: boolean) => void,
    setHUDTheme?: (theme: HUDTheme) => void,
    timerControls?: any // Injected timer controls
) => {
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    
    const executeAction = useCallback((action: PendingAction | AiParseResult) => {
        try {
            const res = 'result' in action ? action.result : action;
            const id = 'id' in action ? action.id : Date.now().toString();
            
            // 1. DATA MANIPULATION (HIGH PRIORITY)
            if ((res.action === 'CREATE_TASK' && res.taskData) || (res.action === 'CREATE_EVENT' && res.eventData)) {
                let newTask: Task;
                if (res.action === 'CREATE_TASK' && res.taskData) {
                    newTask = {
                        id: Date.now().toString(),
                        title: res.taskData.title || "UNTITLED PROTOCOL",
                        completed: false,
                        dueDate: res.taskData.dueDate,
                        dueTime: res.taskData.dueTime,
                        projectId: res.taskData.projectId,
                        priority: res.taskData.priority || 'medium',
                        recurrence: res.taskData.recurrence,
                        details: res.taskData.details,
                        subtasks: (res.taskData.subtasks as any)?.map((t: string) => ({id: Math.random().toString(), title: t, completed: false})) || [],
                        labels: res.taskData.labels || [],
                        isEvent: false
                    };
                } else {
                    const evt = res.eventData!;
                    newTask = {
                        id: Date.now().toString(),
                        title: evt.title || "LOGGED EVENT",
                        completed: false,
                        startTime: evt.startTime,
                        endTime: evt.endTime,
                        priority: 'medium',
                        recurrence: evt.recurrence,
                        isEvent: true
                    };
                }
                setTasks(prev => [...prev, newTask]);
                showNotification(newTask.isEvent ? "Event Logged" : "Task Synchronized");
            } 
            
            // 2. PROJECT MANAGEMENT
            else if (res.action === 'CREATE_PROJECT' && res.projectData && setProjects) {
                const newProject: Project = {
                    id: res.projectData.id || `p-${Date.now()}`,
                    title: res.projectData.title || 'UNNAMED PROJECT',
                    chapters: (res.projectData.chapters || []).map((c: any, i: number) => ({
                      id: `c-${i}`,
                      title: c.title,
                      progress: 0,
                      subtopics: (c.subtopics || []).map((s: any, j: number) => ({
                        id: `s-${i}-${j}`,
                        title: s.title,
                        status: 'pending'
                      }))
                    })),
                    metadata: res.projectData.metadata
                };
                setProjects(prev => [...prev, newProject]);
                showNotification(`Syllabus Generated`);
            }

            // 3. HUD ORCHESTRATION (AUTO-EXEC)
            else if (res.action === 'MANAGE_WINDOW' && res.windowData && onBatchWindowUpdate) {
                onBatchWindowUpdate(res.windowData.instructions, res.windowData.clearHUD);
                showNotification("HUD Reconfigured");
            }
            else if (res.action === 'UPDATE_THEME' && res.uiData?.theme && setHUDTheme) {
                setHUDTheme(res.uiData.theme);
                showNotification(`Color Shift: ${res.uiData.theme.toUpperCase()}`);
            }

            // 4. MEMORY & TIMER (ENHANCED)
            else if (res.action === 'UPDATE_MEMORY' && res.memoryData) {
                if (res.memoryData.operation === 'add') {
                    setMemory(prev => [...prev, res.memoryData!.fact]);
                } else {
                    setMemory(prev => prev.filter(m => m !== res.memoryData!.fact));
                }
                showNotification("Memory Bank Updated");
            }
            else if (res.action === 'START_TIMER') {
                if (timerControls) {
                    if (res.timerData?.mode === 'STOPWATCH') {
                        timerControls.startStopwatch();
                        showNotification("Stopwatch Engaged");
                    } else {
                        // Default to 25 mins (1500s) if duration missing
                        const duration = res.timerData?.duration || 1500;
                        timerControls.startTimer(duration);
                        showNotification(`Focus Session: ${Math.floor(duration/60)}m`);
                    }
                }
                if (onBatchWindowUpdate) {
                    onBatchWindowUpdate([{ target: 'CHRONO', action: 'OPEN', size: 1.5 }]);
                }
            }

            // 5. QUERY RESPONSES
            else if (res.action === 'QUERY' && res.queryResponse) {
                if (onBatchWindowUpdate) onBatchWindowUpdate([{ target: 'CHAT', action: 'OPEN', size: 1.2 }]);
                showNotification("Transmission Received");
            }

             // 6. SYLLABUS NAVIGATION
             else if (res.action === 'NAVIGATE_SYLLABUS' && res.navigationData && onBatchWindowUpdate) {
                onBatchWindowUpdate([{ target: 'PROJECTS', action: 'OPEN', size: 2 }]);
                showNotification(`ZOOMING: ${res.navigationData.projectId}`);
             }

            setPendingActions(prev => prev.filter(pa => pa.id !== id));
        } catch (err) {
            console.error("Action Execution Crash Blocked", err);
            showNotification("Logic Conflicted: Protocol Aborted");
        }
    }, [setTasks, setMemory, showNotification, onBatchWindowUpdate, setProjects, setHUDTheme, timerControls]);

    const handleCommandResults = useCallback((results: AiParseResult[], bypassApproval: boolean = false) => {
        const newPendingActions: PendingAction[] = [];
        
        results.forEach(result => {
            // STRATEGIC TRUST: Auto-authorize operational/UI directives including Timer & Navigation
            const isOperational = [
                'QUERY', 
                'MANAGE_WINDOW', 
                'START_TIMER', 
                'UPDATE_THEME',
                'UPDATE_MEMORY',
                'NAVIGATE_SYLLABUS'
            ].includes(result.action);

            if (isOperational || bypassApproval) {
                executeAction(result);
            } else {
                newPendingActions.push({ 
                    id: Date.now().toString() + Math.random(), 
                    result: result 
                });
            }
        });

        if (newPendingActions.length > 0) {
            setPendingActions(prev => [...prev, ...newPendingActions]);
        }
    }, [executeAction]);

    return {
        pendingActions,
        setPendingActions,
        handleCommandResults,
        executeAction
    };
};
