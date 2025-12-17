
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, Subtask, WindowType, AiParseResult } from './types';

// Components
import ManualEntryModal from './components/ManualEntryModal';
import SettingsModal from './components/SettingsModal';
import LaunchScreen from './components/LaunchScreen';
import HUDContainer from './components/HUDContainer';
import ApprovalModal from './components/ApprovalModal';
import SystemDock from './components/SystemDock';
import HUDWindow from './components/HUDWindow';
import WindowContent from './components/WindowContent';

// Hooks & Services
import { useWindowManager } from './hooks/useWindowManager';
import { useAppData } from './hooks/useAppData';
import { useActionProcessor } from './hooks/useActionProcessor';
import { generateDailyBriefing } from './services/briefingService';
import { parseUserCommand } from './services/aiService';
import { useVoiceInput } from './hooks/useVoiceInput';

export default function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [thanatosisMode, setThanatosisMode] = useState(false); // Red Combat Mode
  const [notification, setNotification] = useState<string | null>(null);

  // Custom Hooks
  const { 
      windows, toggleWindow, closeWindow, openWindow, resizeWindow, setWindowSize, 
      pushSnapshot, revertView, isFocusLocked, setIsFocusLocked, restoreLayout 
  } = useWindowManager();

  const { tasks, setTasks, memory, setMemory, settings, setSettings, weatherData, events, isOfflineMode, loadData, projects, setProjects } = useAppData();
  
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const { pendingActions, setPendingActions, handleCommandResults: processAIResults, executeAction } = useActionProcessor(
      setTasks, 
      setMemory, 
      showNotification, 
      toggleWindow
  );

  // UI State
  const [briefingContent, setBriefingContent] = useState('');
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDraftEdit, setIsDraftEdit] = useState(false);

  // --- RESIZING LOGIC (Horizontal & Vertical) ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [horizontalResizing, setHorizontalResizing] = useState<{
      index: number;
      startX: number;
      startLeftWidth: number;
      startRightWidth: number;
  } | null>(null);

  const [terminalHeight, setTerminalHeight] = useState(250); // Default px height
  const [verticalResizing, setVerticalResizing] = useState<{ startY: number; startHeight: number; } | null>(null);

  const activeWindows = windows.filter(w => w.type !== 'COMMAND');
  const isCommandOpen = windows.some(w => w.type === 'COMMAND');

  // Horizontal Resize Handlers
  const startResizeH = (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      const leftWin = activeWindows[index];
      const rightWin = activeWindows[index + 1];
      if (!leftWin || !rightWin) return;

      setHorizontalResizing({
          index,
          startX: e.clientX,
          startLeftWidth: leftWin.width || 1,
          startRightWidth: rightWin.width || 1
      });
  };

  // Vertical Resize Handlers (Terminal)
  const startResizeV = (e: React.MouseEvent) => {
      e.preventDefault();
      setVerticalResizing({ startY: e.clientY, startHeight: terminalHeight });
  };

  useEffect(() => {
      const handleMove = (e: MouseEvent) => {
          // Horizontal Resizing
          if (horizontalResizing && containerRef.current) {
              const { index, startX, startLeftWidth, startRightWidth } = horizontalResizing;
              const containerWidth = containerRef.current.clientWidth;
              const totalFlex = activeWindows.reduce((sum, w) => sum + (w.width || 1), 0);
              
              const deltaPixels = e.clientX - startX;
              const deltaFlex = deltaPixels * (totalFlex / containerWidth);

              const leftWin = activeWindows[index];
              const rightWin = activeWindows[index + 1];

              if (leftWin && rightWin) {
                  const newLeft = Math.max(0.2, startLeftWidth + deltaFlex);
                  const newRight = Math.max(0.2, startRightWidth - deltaFlex);
                  resizeWindow(leftWin.id, newLeft);
                  resizeWindow(rightWin.id, newRight);
              }
          }

          // Vertical Resizing
          if (verticalResizing) {
              const deltaY = verticalResizing.startY - e.clientY; // Pulling up increases height
              const newHeight = Math.max(100, Math.min(800, verticalResizing.startHeight + deltaY));
              setTerminalHeight(newHeight);
          }
      };

      const handleUp = () => {
          setHorizontalResizing(null);
          setVerticalResizing(null);
      };

      if (horizontalResizing || verticalResizing) {
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          document.body.style.cursor = horizontalResizing ? 'col-resize' : 'row-resize';
      } else {
          document.body.style.cursor = '';
      }

      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          document.body.style.cursor = '';
      };
  }, [horizontalResizing, verticalResizing, activeWindows, resizeWindow]);


  // Layout Logic for Voice Control
  const handleCommandResults = useCallback((results: AiParseResult[], bypassApproval: boolean) => {
      const normalActions: AiParseResult[] = [];
      let layoutChanged = false;

      results.forEach(res => {
          // --- WINDOW MANAGEMENT (Layout Stack) ---
          if (res.action === 'MANAGE_WINDOW' && res.windowData) {
              const { target, action, size } = res.windowData;
              const winTitleMap: Record<string, string> = {
                  TASKS: 'TACTICAL OVERVIEW',
                  CALENDAR: 'TEMPORAL GRID',
                  WEATHER: 'SENSORS',
                  MEMORY: 'CORE MEMORY',
                  BRIEFING: 'VISION',
                  CHAT: 'COMMS',
                  PROJECTS: 'SYLLABUS MATRIX',
                  LOGS: 'OPERATIONAL LOG'
              };
              
              if (!layoutChanged) { pushSnapshot(); layoutChanged = true; } // Save state before first change
              
              let success = false;
              if (action === 'OPEN') success = openWindow(target, winTitleMap[target] || target);
              if (action === 'CLOSE') { closeWindow(target); success = true; }
              if (action === 'RESIZE' && size) { setWindowSize(target, size); success = true; }

              if (success) {
                  showNotification(`Window Protocol: ${action} ${target}`);
              } else {
                  showNotification(`Action Blocked: Focus Lock Active`);
              }
          }
          // --- MACROS ---
          else if (res.action === 'MACRO' && res.macroData) {
              const { action, name } = res.macroData;
              if (action === 'SAVE') {
                  const newMacro = { name, windows: windows }; // Snapshot current windows
                  setSettings(prev => ({ ...prev, layoutMacros: [...prev.layoutMacros.filter(m => m.name !== name), newMacro] }));
                  showNotification(`Layout Saved: "${name}"`);
              } else if (action === 'ACTIVATE') {
                  const macro = settings.layoutMacros.find(m => m.name.toLowerCase() === name.toLowerCase());
                  if (macro) {
                      pushSnapshot(); // Save before switching
                      restoreLayout(macro.windows);
                      showNotification(`Macro Activated: ${macro.name}`);
                  } else {
                      showNotification(`Macro "${name}" not found.`);
                  }
              }
          }
          // --- FOCUS LOCK ---
          else if (res.action === 'FOCUS' && res.focusData) {
               if (res.focusData.action === 'LOCK') {
                   setIsFocusLocked(true);
                   showNotification("FOCUS LOCK ENGAGED");
               } else {
                   setIsFocusLocked(false);
                   showNotification("FOCUS LOCK DISENGAGED");
               }
          }
          // --- VIEW REVERT ---
          else if (res.action === 'VIEW' && res.viewData) {
               if (res.viewData.action === 'REVERT') {
                   const success = revertView();
                   showNotification(success ? "View Reverted" : "No History Available");
               }
          }
          else {
              normalActions.push(res);
          }
      });

      // Pass remaining logic actions to standard processor
      processAIResults(normalActions, bypassApproval);
  }, [windows, settings.layoutMacros, pushSnapshot, openWindow, closeWindow, setWindowSize, restoreLayout, revertView, setIsFocusLocked, processAIResults]);

  const handleVoiceCommand = useCallback(async (text: string) => {
      setIsProcessing(true);
      showNotification("Processing Directive...");
      try {
          const results = await parseUserCommand(
            text, 
            settings.groqApiKey, 
            settings.models, 
            'JARVIS',
            memory,
            tasks,
            [], [], 
            weatherData ? `Temp ${weatherData.temp}` : ''
          );
          
          handleCommandResults(results, thanatosisMode);
          
      } catch (e) {
          console.error(e);
          showNotification("Voice Processing Failed");
      } finally {
          setIsProcessing(false);
      }
  }, [settings.groqApiKey, settings.models, memory, tasks, weatherData, thanatosisMode, handleCommandResults]);


  // Initialize Voice Hook
  const { isListening, toggleListening, voiceError, transcript } = useVoiceInput(handleVoiceCommand);

  // Cursor Logic
  useEffect(() => {
    if (hasLaunched) {
        document.body.classList.add('jarvis-active');
    } else {
        document.body.classList.remove('jarvis-active');
    }
  }, [hasLaunched]);

  const handleGenerateBriefing = async () => {
    if (!settings.groqApiKey) {
        setBriefingContent("API Key Missing. Please configure Settings.");
        return;
    }
    setIsBriefingLoading(true);
    const text = await generateDailyBriefing(
        settings.groqApiKey,
        settings.models.vision,
        'Tony Stark',
        tasks.filter(t => !t.completed),
        events,
        memory,
        weatherData ? `${weatherData.temp}°C ${weatherData.condition}` : 'Unknown'
    );
    setBriefingContent(text);
    setIsBriefingLoading(false);
  };

  // --- Subtask Handlers ---
  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSub: Subtask = { id: Date.now().toString() + Math.random(), title, completed: false };
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      }
      return t;
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  const handleModifyAction = (index: number) => {
     const actionToModify = pendingActions[index];
     const res = actionToModify.result;
     
     if (res.action === 'CREATE_TASK' && res.taskData) {
         const tempTask: Task = {
             id: 'draft',
             title: res.taskData.title || '',
             completed: false,
             priority: res.taskData.priority || 'medium',
             dueDate: res.taskData.dueDate,
             dueTime: res.taskData.dueTime,
             project: res.taskData.project,
             details: res.taskData.details,
             labels: res.taskData.labels,
             isEvent: false
         };
         setEditingTask(tempTask);
         setIsDraftEdit(true);
         setIsModalOpen(true);
         setPendingActions(prev => prev.filter((_, i) => i !== index));
     }
     else if (res.action === 'CREATE_EVENT' && res.eventData) {
          const tempTask: Task = {
             id: 'draft',
             title: res.eventData.title || '',
             completed: false,
             priority: 'medium',
             startTime: res.eventData.startTime,
             endTime: res.eventData.endTime,
             isEvent: true
         };
         setEditingTask(tempTask);
         setIsDraftEdit(true);
         setIsModalOpen(true);
         setPendingActions(prev => prev.filter((_, i) => i !== index));
     }
  };

  // --- DOCK HANDLER ---
  const handleDockLaunch = (type: WindowType | 'MEMORY' | 'SETTINGS') => {
      if (type === 'SETTINGS') {
          setIsSettingsOpen(true);
      } else {
          switch (type) {
            case 'TASKS': toggleWindow('TASKS', 'TACTICAL OVERVIEW'); break;
            case 'CALENDAR': toggleWindow('CALENDAR', 'TEMPORAL GRID'); break;
            case 'MEMORY': toggleWindow('MEMORY', 'CORE MEMORY'); break;
            case 'BRIEFING': toggleWindow('BRIEFING', 'VISION PROTOCOL'); break;
            case 'CHAT': toggleWindow('CHAT', 'SECURE COMMS'); break;
            case 'COMMAND': toggleWindow('COMMAND', 'TERMINAL'); break;
            case 'WEATHER': toggleWindow('WEATHER', 'ENVIRONMENTAL SENSORS'); break;
            case 'PROJECTS': toggleWindow('PROJECTS', 'SYLLABUS MATRIX'); break;
            case 'LOGS': toggleWindow('LOGS', 'OPERATIONAL LOG'); break;
          }
      }
  };

  const themeColor = thanatosisMode ? 'red' : 'cyan';

  if (!hasLaunched) {
      return <LaunchScreen onLaunch={() => setHasLaunched(true)} />;
  }

  // Grouped data for window renderer
  const windowData = {
    tasks, events, memory, weatherData, settings, briefingContent, isBriefingLoading, isProcessing, thanatosisMode, projects
  };

  const windowActions = {
    setTasks, setMemory, setIsProcessing, handleCommandResults, handleGenerateBriefing, handleAddSubtask, handleToggleSubtask,
    setEditingTask, setIsDraftEdit, setIsModalOpen, toggleWindow, setProjects
  };
  
  return (
    <HUDContainer theme={thanatosisMode ? 'red' : 'cyan'}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={(s) => { 
            setSettings(s); 
            setIsSettingsOpen(false); 
            setTimeout(loadData, 500);
        }}
      />
      
      <ManualEntryModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); setIsDraftEdit(false); }}
        onAddTask={(t) => setTasks(prev => [...prev, { ...t, id: Date.now().toString(), completed: false } as Task])}
        onUpdateTask={(t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))}
        onAddEvent={(evt) => {
            const newEventTask: Task = {
                id: Date.now().toString(),
                title: evt.title,
                startTime: evt.start,
                endTime: evt.end,
                priority: 'medium',
                completed: false,
                isEvent: true,
                recurrence: evt.recurrence
            };
            setTasks(prev => [...prev, newEventTask]);
        }} 
        taskToEdit={editingTask}
        isDraft={isDraftEdit}
        apiKey=""
        groqApiKey={settings.groqApiKey}
        modelConfig={settings.models}
      />

      <ApprovalModal 
          isOpen={pendingActions.length > 0}
          results={pendingActions.map(pa => pa.result)}
          onClose={() => {}}
          onApprove={(index) => executeAction(pendingActions[index])}
          onReject={(index) => setPendingActions(prev => prev.filter((_, i) => i !== index))}
          onModify={handleModifyAction}
          onApproveAll={() => { pendingActions.forEach(pa => executeAction(pa)); setPendingActions([]); }}
          onRejectAll={() => setPendingActions([])}
          theme={thanatosisMode ? 'red' : 'cyan'}
      />

      {/* --- FLOATING DOCK --- */}
      <SystemDock 
          activeWindows={windows}
          onLaunch={handleDockLaunch}
          toggleThanatosis={() => setThanatosisMode(!thanatosisMode)}
          isThanatosisActive={thanatosisMode}
          isListening={isListening}
          isProcessing={isProcessing}
          onToggleVoice={toggleListening}
          voiceError={voiceError}
      />

      {/* --- MAIN CANVAS LAYER --- */}
      <div className="absolute inset-4 pl-24 flex flex-col pointer-events-none">
          
          <div className="flex-1 flex flex-col bg-black/40 border border-slate-700/50 backdrop-blur-sm overflow-hidden select-none pointer-events-auto relative">
              
              {/* FOCUS LOCK OVERLAY */}
              {isFocusLocked && (
                  <div className="absolute inset-0 pointer-events-none z-[60] border-4 border-amber-500/30 flex items-start justify-center pt-2">
                       <div className="bg-amber-500/20 text-amber-500 px-4 py-1 font-bold text-xs tracking-widest uppercase border border-amber-500/50 rounded-full animate-pulse backdrop-blur-md">
                           FOCUS LOCK ACTIVE
                       </div>
                  </div>
              )}

              {/* UPPER ROW: RESIZABLE WINDOWS */}
              <div ref={containerRef} className="flex-1 flex min-h-0 items-stretch overflow-hidden">
                  
                  {activeWindows.length === 0 && (
                      <div className="flex-1 flex items-center justify-center opacity-30 select-none">
                          <div className="text-center">
                              <h1 className="text-6xl font-tech font-bold tracking-[0.3em] text-white/20 animate-pulse">JARVIS</h1>
                              <p className="text-xl font-mono text-slate-500 mt-4 tracking-widest">AWAITING INPUT</p>
                          </div>
                      </div>
                  )}

                  {activeWindows.map((win, index) => (
                      <React.Fragment key={win.id}>
                        <div 
                            style={{ flex: win.width || 1 }}
                            className="relative transition-[flex] duration-75 ease-out min-w-[200px] h-full"
                        >
                            <HUDWindow
                                id={win.id}
                                title={win.title}
                                onClose={() => closeWindow(win.id)}
                                noFrame={true}
                            >
                                <WindowContent type={win.type} data={windowData} actions={windowActions} />
                            </HUDWindow>
                        </div>
                        {/* Resizer Handle */}
                        {index < activeWindows.length - 1 && (
                            <div 
                                className="w-1 cursor-col-resize bg-slate-800 hover:bg-cyan-500/50 hover:shadow-[0_0_10px_cyan] transition-colors relative z-50 flex flex-col justify-center items-center group shrink-0"
                                onMouseDown={(e) => startResizeH(index, e)}
                            >
                                <div className="h-4 w-0.5 bg-slate-600 group-hover:bg-white transition-colors rounded-full"></div>
                            </div>
                        )}
                      </React.Fragment>
                  ))}
              </div>

              {/* VERTICAL RESIZER FOR TERMINAL */}
              {isCommandOpen && (
                  <div 
                      className="h-1 cursor-row-resize bg-slate-800 hover:bg-cyan-500/50 hover:shadow-[0_0_10px_cyan] transition-colors relative z-50 flex items-center justify-center group shrink-0"
                      onMouseDown={startResizeV}
                  >
                      <div className="w-8 h-0.5 bg-slate-600 group-hover:bg-white transition-colors rounded-full"></div>
                  </div>
              )}

              {/* BOTTOM ROW: INTEGRATED TERMINAL */}
              {isCommandOpen && (
                  <div 
                      style={{ height: terminalHeight }}
                      className="shrink-0 relative border-t border-slate-700/50 bg-black/90 transition-height duration-75"
                  >
                      <HUDWindow
                        id="CMD"
                        title="TERMINAL"
                        onClose={() => closeWindow('COMMAND')}
                        noFrame={true}
                      >
                          <WindowContent type='COMMAND' data={windowData} actions={windowActions} />
                      </HUDWindow>
                  </div>
              )}
          </div>

      </div>

      {isOfflineMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-900/90 text-amber-100 text-xs font-bold font-mono py-1 px-8 clip-hud-panel shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-500/50">
            <span>⚡ LOCAL OPERATIONS MODE</span>
        </div>
      )}
      
      {notification && (
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[110] bg-black border border-${themeColor}-500 text-${themeColor}-400 px-8 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] clip-hud-panel flex items-center gap-4 animate-fade-in-down`}>
          <div className={`w-2 h-2 bg-${themeColor}-500 rounded-full animate-ping`}></div>
          <span className="font-mono text-sm tracking-widest uppercase">{notification}</span>
        </div>
      )}
    </HUDContainer>
  );
}
