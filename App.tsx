
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, Subtask, WindowType, AiParseResult, Subtopic, Project, HUDTheme, StudySessionLog, AppMode } from './types';

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
import CommandBar from './components/CommandBar';

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
  const [currentMode, setCurrentMode] = useState<AppMode>('EXECUTE'); 
  const [notification, setNotification] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<{ transcript: string; intent: string } | null>(null);

  const { 
      windows, toggleWindow, closeWindow, openWindow, batchUpdate
  } = useWindowManager();

  const { timerState, timerControls } = useTimer();

  const { tasks, setTasks, memory, setMemory, settings, setSettings, weatherData, events, projects, setProjects, activeProtocol, startProtocol, endProtocol, sessionLogs, setSessionLogs, loadData } = useAppData();
  
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const { pendingActions, setPendingActions, handleCommandResults: processAIResults, executeAction } = useActionProcessor(
      setTasks, setMemory, showNotification, toggleWindow, setProjects, batchUpdate, setCurrentTheme, timerControls, setCurrentMode
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
        settings.models.jarvis,
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

  const handleCommandResults = useCallback((results: AiParseResult[], bypassApproval: boolean = false) => {
      results.forEach(res => {
          if (res.action === 'SWITCH_MODE' && res.modeData) {
              setCurrentMode(res.modeData.mode);
              showNotification(`MODE SHIFT: ${res.modeData.mode}`);
          }
          if (res.action === 'NAVIGATE_SYLLABUS') {
              setCurrentMode('PLAN');
          }
          if (res.action === 'START_TIMER') {
              setCurrentMode('EXECUTE');
          }
      });
      processAIResults(results, bypassApproval);
  }, [processAIResults]);

  const handleVoiceCommand = useCallback(async (text: string) => {
      setIsAILoading(true);
      try {
          const results = await parseUserCommand(text, settings.groqApiKey, settings.models, 'JARVIS', memory, tasks, projects, [], "", undefined, currentMode);
          if (results.length > 0) {
              setActiveFeedback({ transcript: text, intent: results[0]?.action || 'ANALYZING' });
              handleCommandResults(results, thanatosisMode);
          }
      } catch (e) {
          showNotification("Voice Engine Interrupted");
      } finally {
          setIsAILoading(false);
      }
  }, [settings.groqApiKey, settings.models, memory, tasks, projects, thanatosisMode, handleCommandResults, currentMode]);

  const { isListening, isProcessing: isTranscribing, toggleListening, voiceError } = useVoiceInput(handleVoiceCommand, settings.groqApiKey, settings.models.transcription);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).matches('input, textarea, select');
      
      const isModeModifier = (e.altKey && !e.ctrlKey && !e.shiftKey) || (!e.altKey && e.ctrlKey && !e.metaKey && !e.shiftKey);

      if (isModeModifier) {
        if (e.code === 'Digit1') { e.preventDefault(); setCurrentMode('EXECUTE'); showNotification("MODE: EXECUTE"); }
        if (e.code === 'Digit2') { e.preventDefault(); setCurrentMode('PLAN'); showNotification("MODE: PLAN"); }
        if (e.code === 'Digit3') { e.preventDefault(); setCurrentMode('INTEL'); showNotification("MODE: INTEL"); }
      }

      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
          e.preventDefault();
          toggleListening();
          showNotification(isListening ? "VOICE TERMINATED" : "VOICE PROTOCOL ENGAGED");
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyX') {
          e.preventDefault();
          setThanatosisMode(prev => !prev);
          showNotification(thanatosisMode ? "SAFETY DISENGAGED" : "THANATOS PROTOCOL");
      }

      if (e.code === 'Escape') {
          if (isModalOpen) setIsModalOpen(false);
          if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isListening, toggleListening, isModalOpen, isSettingsOpen, thanatosisMode]);


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
    setCurrentMode('EXECUTE'); 
  };

  const handleLogSession = (log: StudySessionLog) => {
      setSessionLogs(prev => [...prev, log]);
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

  const renderModeContent = () => {
      const commonProps = {
          data: { tasks, events, memory, projects, weatherData, settings, briefingContent, isBriefingLoading, isProcessing: isAILoading, thanatosisMode, sessionLogs },
          actions: { setTasks, setMemory, setProjects, setIsProcessing: setIsAILoading, handleCommandResults, handleGenerateBriefing, handleAddSubtask: (tid:string, t:string) => {}, handleToggleSubtask: (tid:string, sid:string) => {}, setEditingTask, setIsDraftEdit, setIsModalOpen, toggleWindow, onInitializeTask: handleInitializeTaskFromProject, onLogSession: handleLogSession },
          activeProtocolId: activeProtocol?.taskId,
          timerState,
          timerControls,
          currentMode // Passed down
      };

      if (currentMode === 'EXECUTE') {
          return (
              <div className="flex gap-4 h-full">
                  <div className="flex-[2] h-full flex flex-col gap-4">
                      <div className="flex-[2] min-h-0">
                          <HUDWindow id="CHRONO" title="ACTIVE PROTOCOL" onClose={() => {}}>
                              <WindowContent type="CHRONO" {...commonProps} />
                          </HUDWindow>
                      </div>
                      <div className="flex-1 min-h-0">
                          <HUDWindow id="TASKS" title="TASK QUEUE" onClose={() => {}}>
                              <WindowContent type="TASKS" {...commonProps} />
                          </HUDWindow>
                      </div>
                  </div>
                  <div className="flex-1 h-full min-w-[300px]">
                      <HUDWindow id="CHAT" title="OPERATIONAL COMMS" onClose={() => {}}>
                          <WindowContent type="CHAT" {...commonProps} />
                      </HUDWindow>
                  </div>
              </div>
          );
      }

      if (currentMode === 'PLAN') {
          return (
              <div className="flex gap-4 h-full">
                  <div className="flex-[2] h-full">
                      <HUDWindow id="PROJECTS" title="SYLLABUS MAP" onClose={() => {}}>
                          <WindowContent type="PROJECTS" {...commonProps} />
                      </HUDWindow>
                  </div>
                  <div className="flex-[2] h-full">
                      <HUDWindow id="CALENDAR" title="TEMPORAL GRID" onClose={() => {}}>
                          <WindowContent type="CALENDAR" {...commonProps} />
                      </HUDWindow>
                  </div>
              </div>
          );
      }

      // Updated INTEL mode to act as the All-In-One Dashboard
      if (currentMode === 'INTEL') {
          return (
              <div className="flex gap-4 h-full">
                  <div className="flex-[3] h-full">
                      <HUDWindow id="DASHBOARD" title="MASTER CONTROL // OVERWATCH" onClose={() => {}}>
                          <WindowContent type="DASHBOARD" {...commonProps} />
                      </HUDWindow>
                  </div>
                  <div className="flex-1 h-full flex flex-col gap-4">
                       <div className="h-48 shrink-0">
                          <HUDWindow id="BRIEFING" title="DAILY INTEL" onClose={() => {}}>
                              <WindowContent type="BRIEFING" {...commonProps} />
                          </HUDWindow>
                       </div>
                       <div className="flex-1">
                          <HUDWindow id="CHAT_INTEL" title="SECURE CHANNEL" onClose={() => {}}>
                              <WindowContent type="CHAT" {...commonProps} />
                          </HUDWindow>
                       </div>
                  </div>
              </div>
          );
      }
  };

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
        currentMode={currentMode}
        onSwitchMode={setCurrentMode}
        onSettings={() => setIsSettingsOpen(true)}
        toggleThanatosis={() => setThanatosisMode(!thanatosisMode)} 
        isThanatosisActive={thanatosisMode}
        weatherString={weatherData ? `${Math.round(weatherData.temp)}° ${weatherData.condition}` : undefined}
      />
      
      {activeFeedback && <HolographicFeedback transcript={activeFeedback.transcript} intent={activeFeedback.intent} onComplete={() => setActiveFeedback(null)} theme={effectiveTheme === 'cyan' ? 'cyan' : 'red'} />}

      <div className="absolute inset-0 pt-14 pb-20 px-4 pointer-events-none">
          <div className="w-full h-full pointer-events-auto transition-all duration-500">
              {renderModeContent()}
          </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-3xl z-[120] pointer-events-auto">
          <CommandBar
                onCommandProcessed={handleCommandResults}
                isLoading={isAILoading}
                setIsLoading={setIsAILoading}
                memory={memory}
                activeTasks={tasks}
                groqApiKey={settings.groqApiKey}
                modelConfig={settings.models}
                theme={effectiveTheme === 'cyan' ? 'cyan' : 'red'}
                weatherData={weatherData}
                currentMode={currentMode}
          />
      </div>

      {notification && <div className={`absolute top-16 right-4 z-[110] bg-black border border-cyan-500 text-cyan-400 px-6 py-2 clip-hud-panel animate-fade-in-down shadow-[0_0_20px_rgba(6,182,212,0.3)]`}><span className="font-mono text-xs tracking-widest uppercase">{notification}</span></div>}
    </HUDContainer>
  );
}
