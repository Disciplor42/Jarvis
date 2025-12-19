
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, Subtask, WindowType, AiParseResult, Subtopic, Project, HUDTheme, StudySessionLog } from './types';

// Components
import ManualEntryModal from './components/ManualEntryModal';
import SettingsModal from './components/SettingsModal';
import LaunchScreen from './components/LaunchScreen';
import HUDContainer from './components/HUDContainer';
import ApprovalModal from './components/ApprovalModal';
import SystemDock from './components/SystemDock';
import HUDWindow from './components/HUDWindow';
import WindowContent from './components/WindowContent';
import HolographicFeedback from './components/HolographicFeedback';

// Hooks
import { useWindowManager } from './hooks/useWindowManager';
import { useAppData } from './hooks/useAppData';
import { useActionProcessor } from './hooks/useActionProcessor';
import { generateDailyBriefing } from './services/briefingService';
import { parseUserCommand } from './services/aiService';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useTimer } from './hooks/useTimer';

export default function App() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [thanatosisMode, setThanatosisMode] = useState(false); 
  const [currentTheme, setCurrentTheme] = useState<HUDTheme>('cyan');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<{ transcript: string; intent: string } | null>(null);

  const { 
      windows, toggleWindow, closeWindow, openWindow, batchUpdate,
      isFocusLocked, setIsFocusLocked 
  } = useWindowManager();

  const { timerState, timerControls } = useTimer();

  const { tasks, setTasks, memory, setMemory, settings, setSettings, weatherData, events, projects, setProjects, activeProtocol, startProtocol, endProtocol, sessionLogs, setSessionLogs, loadData } = useAppData();
  
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const { pendingActions, setPendingActions, handleCommandResults: processAIResults, executeAction } = useActionProcessor(
      setTasks, setMemory, showNotification, toggleWindow, setProjects, batchUpdate, setCurrentTheme, timerControls
  );

  const [briefingContent, setBriefingContent] = useState('');
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  
  const handleGenerateBriefing = useCallback(async () => {
    if (!settings.groqApiKey) {
      showNotification("Groq API Key Required");
      return;
    }
    setIsBriefingLoading(true);
    try {
      const content = await generateDailyBriefing(
        settings.groqApiKey,
        settings.models.jarvis, // Use JARVIS for briefing
        'Tony Stark',
        tasks,
        events,
        memory,
        weatherData ? `${weatherData.temp}°C, ${weatherData.condition}` : "Unknown"
      );
      setBriefingContent(content);
    } catch (e) {
      console.error(e);
      showNotification("Briefing Generation Failed");
    } finally {
      setIsBriefingLoading(false);
    }
  }, [settings.groqApiKey, settings.models.jarvis, tasks, events, memory, weatherData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDraftEdit, setIsDraftEdit] = useState(false);

  const activeWindows = windows.filter(w => w.type !== 'COMMAND');
  const isCommandOpen = windows.some(w => w.type === 'COMMAND');

  const handleCommandResults = useCallback((results: AiParseResult[], bypassApproval: boolean = false) => {
      // Intercept NAVIGATE_SYLLABUS commands to perform immediate UI update
      results.forEach(res => {
          if (res.action === 'NAVIGATE_SYLLABUS' && res.navigationData) {
              batchUpdate([{ target: 'PROJECTS', action: 'OPEN', size: 2 }]);
              showNotification(`ZOOMING: ${res.navigationData.projectId}`);
              // In a real app, we would set a "ZoomContext" state here that ProjectView reads.
              // For now, it just opens the window.
          }
      });
      processAIResults(results, bypassApproval);
  }, [processAIResults, batchUpdate]);

  const handleVoiceCommand = useCallback(async (text: string) => {
      setIsAILoading(true);
      try {
          const results = await parseUserCommand(text, settings.groqApiKey, settings.models, 'JARVIS', memory, tasks, projects);
          if (results.length > 0) {
              setActiveFeedback({ transcript: text, intent: results[0]?.action || 'ANALYZING' });
              handleCommandResults(results, thanatosisMode);
          }
      } catch (e) {
          showNotification("Voice Engine Interrupted");
      } finally {
          setIsAILoading(false);
      }
  }, [settings.groqApiKey, settings.models, memory, tasks, projects, thanatosisMode, handleCommandResults]);

  const { isListening, isProcessing: isTranscribing, toggleListening, voiceError } = useVoiceInput(handleVoiceCommand, settings.groqApiKey, settings.models.transcription);

  const handleInitializeTaskFromProject = (topic: Subtopic, project: Project) => {
    if (topic.taskId === activeProtocol?.taskId) {
        endProtocol();
        return;
    }

    const taskId = topic.taskId || `task-${Date.now()}`;
    if (!topic.taskId) {
        const newTask: Task = {
            id: taskId,
            title: `${project.title}: ${topic.title}`,
            completed: false,
            projectId: project.id,
            priority: project.metadata?.priority || 'medium',
            details: `Operational tracking for Project "${project.title}".`,
        };
        setTasks(prev => [...prev, newTask]);
        setProjects(prev => prev.map(p => p.id === project.id ? {
            ...p,
            chapters: p.chapters.map(c => ({
                ...c,
                subtopics: c.subtopics.map(s => s.id === topic.id ? { ...s, taskId } : s)
            }))
        } : p));
    }

    startProtocol(taskId, project.id);
    batchUpdate([
        { target: 'CHRONO', action: 'OPEN', size: 1 },
        { target: 'PROJECTS', action: 'OPEN', size: 1.5 }
    ]);
  };

  const handleLogSession = (log: StudySessionLog) => {
      setSessionLogs(prev => [...prev, log]);
      
      // Update decay timer for related subtopics
      if (log.taskId) {
          const task = tasks.find(t => t.id === log.taskId);
          if (task && task.projectId) {
              setProjects(prev => prev.map(p => {
                  if (p.id !== task.projectId) return p;
                  return {
                      ...p,
                      chapters: p.chapters.map(c => ({
                          ...c,
                          subtopics: c.subtopics.map(s => {
                              // Rough match by taskId
                              if (s.taskId === log.taskId) {
                                  return { ...s, lastStudied: Date.now() };
                              }
                              return s;
                          })
                      }))
                  }
              }));
          }
      }
  };

  const effectiveTheme = thanatosisMode ? 'red' : currentTheme;

  if (!hasLaunched) return <LaunchScreen onLaunch={() => setHasLaunched(true)} />;

  return (
    <HUDContainer theme={effectiveTheme}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSave={(s) => setSettings(s)}
        fullUserData={{ tasks, events, memory, projects, settings, sessionLogs }} 
      />
      <ManualEntryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTask={(t) => setTasks(prev => [...prev, { ...t, id: Date.now().toString(), completed: false } as Task])} onUpdateTask={(t) => setTasks(prev => prev.map(p => p.id === t.id ? t : p))} onAddEvent={() => {}} taskToEdit={editingTask} apiKey="" groqApiKey={settings.groqApiKey} modelConfig={settings.models} />
      <ApprovalModal isOpen={pendingActions.length > 0} results={pendingActions.map(pa => pa.result)} onClose={() => {}} onApprove={(i) => executeAction(pendingActions[i])} onReject={(i) => setPendingActions(p => p.filter((_, idx) => idx !== i))} onModify={() => {}} onApproveAll={() => {}} onRejectAll={() => setPendingActions([])} theme={effectiveTheme === 'cyan' ? 'cyan' : 'red'} />
      
      <SystemDock 
        activeWindows={windows} 
        onLaunch={(type) => type === 'SETTINGS' ? setIsSettingsOpen(true) : toggleWindow(type as WindowType, type)} 
        toggleThanatosis={() => setThanatosisMode(!thanatosisMode)} 
        isThanatosisActive={thanatosisMode} 
        isListening={isListening} 
        isProcessing={isAILoading || isTranscribing} 
        onToggleVoice={toggleListening}
        voiceError={voiceError}
      />
      
      {activeFeedback && <HolographicFeedback transcript={activeFeedback.transcript} intent={activeFeedback.intent} onComplete={() => setActiveFeedback(null)} theme={effectiveTheme === 'cyan' ? 'cyan' : 'red'} />}

      <div className="absolute inset-4 pl-24 flex flex-col pointer-events-none">
          <div className="flex-1 flex flex-col bg-black/40 border border-slate-700/50 backdrop-blur-sm overflow-hidden pointer-events-auto relative">
              
              {activeProtocol && (
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center overflow-hidden">
                      <div className="w-[800px] h-[800px] border border-cyan-500/20 rounded-full animate-spin-slow flex items-center justify-center">
                          <div className="w-[600px] h-[600px] border border-cyan-500/10 rounded-full animate-spin-reverse"></div>
                      </div>
                      <div className="absolute bottom-10 left-10 flex flex-col">
                          <span className="text-4xl font-tech font-bold text-cyan-400">MISSION_ACTIVE</span>
                          <span className="text-xs font-mono text-slate-500 tracking-[0.5em]">OPERATIONAL_PROTOCOL_{activeProtocol.taskId.slice(-4)}</span>
                      </div>
                  </div>
              )}

              <div className="flex-1 flex min-h-0 items-stretch overflow-hidden">
                  {activeWindows.length === 0 && (
                      <div className="flex-1 flex items-center justify-center opacity-30 select-none text-center">
                          <div>
                            <h1 className="text-8xl font-tech font-bold tracking-[0.3em] text-white/10 animate-pulse uppercase">{effectiveTheme === 'red' ? 'THANATOS' : 'JARVIS'}</h1>
                            <p className="text-xl font-mono text-slate-500 mt-4 tracking-widest uppercase">Systems At Idle</p>
                          </div>
                      </div>
                  )}
                  {activeWindows.map((win, index) => (
                      <div key={win.id} style={{ flex: win.width || 1 }} className="relative min-w-[200px] h-full transition-all duration-500 ease-in-out border-r border-slate-800 last:border-0">
                          <HUDWindow id={win.id} title={win.title} onClose={() => closeWindow(win.id)} noFrame={true}>
                              <WindowContent 
                                type={win.type} 
                                data={{ tasks, events, memory, projects, weatherData, settings, briefingContent, isBriefingLoading, isProcessing: isAILoading, thanatosisMode }} 
                                actions={{ setTasks, setMemory, setProjects, setIsProcessing: setIsAILoading, handleCommandResults, handleGenerateBriefing, handleAddSubtask: (tid, title) => {}, handleToggleSubtask: (tid, sid) => {}, setEditingTask, setIsDraftEdit, setIsModalOpen, toggleWindow, onInitializeTask: handleInitializeTaskFromProject, onLogSession: handleLogSession }} 
                                activeProtocolId={activeProtocol?.taskId}
                                timerState={timerState}
                                timerControls={timerControls}
                              />
                          </HUDWindow>
                      </div>
                  ))}
              </div>
              {isCommandOpen && (
                  <div className="h-48 shrink-0 relative border-t border-slate-700/50 bg-black/90">
                      <HUDWindow id="CMD" title="TERMINAL" onClose={() => closeWindow('COMMAND')} noFrame={true}>
                          <WindowContent type='COMMAND' data={{ tasks, events, memory, projects, weatherData, settings, briefingContent, isBriefingLoading, isProcessing: isAILoading, thanatosisMode }} actions={{ setTasks, setMemory, setProjects, setIsProcessing: setIsAILoading, handleCommandResults, handleGenerateBriefing, handleAddSubtask: (tid, title) => {}, handleToggleSubtask: (tid, sid) => {}, setEditingTask, setIsDraftEdit, setIsModalOpen, toggleWindow, onLogSession: handleLogSession }} />
                      </HUDWindow>
                  </div>
              )}
          </div>
      </div>
      {notification && <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[110] bg-black border border-cyan-500 text-cyan-400 px-8 py-4 clip-hud-panel animate-fade-in-down shadow-[0_0_20px_rgba(6,182,212,0.3)]`}><span className="font-mono text-sm tracking-widest uppercase">{notification}</span></div>}
    </HUDContainer>
  );
}
