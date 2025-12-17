
import React, { useState } from 'react';
import { PendingAction, Task, AiParseResult } from '../types';

export const useActionProcessor = (
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    setMemory: React.Dispatch<React.SetStateAction<string[]>>,
    showNotification: (msg: string) => void,
    onOpenWindow: (type: any, title: string, w?: number, h?: number) => void
) => {
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    
    // Execute a single action immediately
    const executeAction = (action: PendingAction | AiParseResult) => {
        // Handle both wrapped PendingAction and direct AiParseResult
        const res = 'result' in action ? action.result : action;
        const id = 'id' in action ? action.id : Date.now().toString();
        
        if ((res.action === 'CREATE_TASK' && res.taskData) || (res.action === 'CREATE_EVENT' && res.eventData)) {
          let newTask: Task;
          if (res.action === 'CREATE_TASK' && res.taskData) {
              newTask = {
                  id: Date.now().toString(),
                  title: res.taskData.title!,
                  completed: false,
                  dueDate: res.taskData.dueDate,
                  dueTime: res.taskData.dueTime,
                  project: res.taskData.project,
                  priority: res.taskData.priority || 'medium',
                  recurrence: res.taskData.recurrence,
                  details: res.taskData.details,
                  subtasks: res.taskData.subtasks?.map(t => ({id: Math.random().toString(), title: t, completed: false})),
                  labels: res.taskData.labels,
                  isEvent: false
              };
          } else {
               const evt = res.eventData!;
               newTask = {
                   id: Date.now().toString(),
                   title: evt.title,
                   completed: false,
                   startTime: evt.startTime,
                   endTime: evt.endTime,
                   priority: 'medium',
                   recurrence: evt.recurrence,
                   isEvent: true
               };
          }
          setTasks(prev => [...prev, newTask]);
          showNotification(newTask.isEvent ? "Event Logged" : "Task Created");
        } 
        else if (res.action === 'UPDATE_TASK' && res.taskData?.id) {
            setTasks(prev => prev.map(t => {
                if (t.id === res.taskData?.id) {
                    return {
                        ...t,
                        title: res.taskData?.title || t.title,
                        priority: res.taskData?.priority || t.priority,
                        completed: res.taskData?.completed !== undefined ? res.taskData.completed : t.completed
                    } as Task;
                }
                return t;
            }));
            showNotification("Task Updated");
        }
        else if (res.action === 'DELETE_TASK' && res.taskData?.id) {
            setTasks(prev => prev.filter(t => t.id !== res.taskData?.id));
            showNotification("Task Deleted");
        }
        else if (res.action === 'UPDATE_MEMORY' && res.memoryData) {
           if (res.memoryData.operation === 'add') {
               setMemory(prev => [...prev, res.memoryData!.fact]);
           } else {
               setMemory(prev => prev.filter(m => m !== res.memoryData!.fact));
           }
           showNotification("Memory Updated");
        }
        else if (res.action === 'QUERY' && res.queryResponse) {
             // Queries don't usually go through Pending, but if they do, show them
             showNotification(res.queryResponse.substring(0, 50) + "...");
             onOpenWindow('CHAT', 'SECURE COMMS');
        }

        // Remove from pending if it was pending
        setPendingActions(prev => prev.filter(pa => pa.id !== id));
    };

    // Process raw AI results into pending actions or execute immediately
    const handleCommandResults = (results: AiParseResult[], bypassApproval: boolean = false) => {
        const newPendingActions: PendingAction[] = [];
        
        results.forEach(result => {
            // Queries and Unknowns always processed immediately/separately
            if (result.action === 'QUERY') {
               if (result.queryResponse) showNotification(result.queryResponse.substring(0, 100) + "...");
               onOpenWindow('CHAT', 'SECURE COMMS', 400, 600);
               return;
            } 
            
            if (result.action === 'UNKNOWN') {
               showNotification("Command Unknown");
               return;
            }

            // For state-modifying actions
            if (bypassApproval) {
                // Immediate Execution (Thanatosis Mode)
                executeAction(result);
            } else {
                // Queue for Approval (Normal Mode)
                newPendingActions.push({ id: Date.now().toString() + Math.random(), result: result });
            }
        });

        if (newPendingActions.length > 0) {
            setPendingActions(prev => [...prev, ...newPendingActions]);
        }
    };

    return {
        pendingActions,
        setPendingActions,
        handleCommandResults,
        executeAction
    };
};
