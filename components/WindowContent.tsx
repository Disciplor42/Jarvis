
import React from 'react';
import { WindowType, Task, CalendarEvent, WeatherData, AppSettings, AiParseResult, Project, Subtopic, StudySessionLog } from '../types';

// Components
import CommandBar from './CommandBar';
import TaskList from './TaskList';
import CalendarView from './CalendarView';
import WeatherWidget from './WeatherWidget';
import DailyBriefing from './DailyBriefing';
import ContextChat from './ContextChat';
import ProjectView from './ProjectView';
import ChronoMeter from './ChronoMeter';

interface WindowContentProps {
    type: WindowType;
    data: {
        tasks: Task[];
        events: CalendarEvent[];
        memory: string[];
        projects: Project[];
        weatherData: WeatherData | null;
        settings: AppSettings;
        briefingContent: string;
        isBriefingLoading: boolean;
        isProcessing: boolean;
        thanatosisMode: boolean;
    };
    actions: {
        setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
        setMemory: React.Dispatch<React.SetStateAction<string[]>>;
        setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
        setIsProcessing: (loading: boolean) => void;
        handleCommandResults: (results: AiParseResult[]) => void;
        handleGenerateBriefing: () => void;
        handleAddSubtask: (taskId: string, title: string) => void;
        handleToggleSubtask: (taskId: string, subtaskId: string) => void;
        setEditingTask: (task: Task | null) => void;
        setIsDraftEdit: (isDraft: boolean) => void;
        setIsModalOpen: (isOpen: boolean) => void;
        toggleWindow: (type: WindowType, title: string) => void;
        onInitializeTask?: (topic: Subtopic, project: Project) => void;
        onLogSession: (data: StudySessionLog) => void; // New prop
    };
    activeProtocolId?: string;
    timerState?: any;
    timerControls?: any;
}

const WindowContent: React.FC<WindowContentProps> = ({ type, data, actions, activeProtocolId, timerState, timerControls }) => {
    
    switch (type) {
        case 'TASKS':
            return (
                <div className="h-full bg-[#05050a] flex flex-col">
                    <TaskList
                        tasks={data.tasks}
                        viewMode='LIST'
                        onToggleTask={(id) => actions.setTasks(t => t.map(x => x.id === id ? { ...x, completed: !x.completed } : x))}
                        onEditTask={(task) => { actions.setEditingTask(task); actions.setIsModalOpen(true); }}
                        onDeleteTask={(id) => actions.setTasks(t => t.filter(x => x.id !== id))}
                        onUpdateTask={(updatedTask) => actions.setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
                        onAddSubtask={actions.handleAddSubtask}
                        onToggleSubtask={actions.handleToggleSubtask}
                    />
                </div>
            );
        case 'PROJECTS':
            return (
                <ProjectView 
                    projects={data.projects}
                    onUpdateProject={(p) => actions.setProjects(prev => prev.map(proj => proj.id === p.id ? p : proj))}
                    onInitializeTask={actions.onInitializeTask}
                    activeProtocolId={activeProtocolId}
                    onImportSyllabus={(json) => {
                        // Basic validation
                        if(Array.isArray(json) && json[0].chapters) {
                            actions.setProjects(prev => [...prev, ...json]);
                        } else if(json.chapters) {
                            actions.setProjects(prev => [...prev, json]);
                        }
                    }}
                />
            );
        case 'CALENDAR':
            return <CalendarView events={data.events} />;
        case 'CHRONO':
            return (
                <ChronoMeter 
                    tasks={data.tasks}
                    onLogTime={(tid, sec, logData) => {
                        // 1. Update Task Timer
                        actions.setTasks(prev => prev.map(t => t.id === tid ? { ...t, timeLogged: (t.timeLogged || 0) + sec } : t));
                        // 2. Log Session to Data Store
                        actions.onLogSession({
                            id: Date.now().toString(),
                            timestamp: Date.now(),
                            duration: sec,
                            taskId: tid,
                            ...logData
                        });
                        // 3. Update decay on related project topic if applicable
                        // (Requires looking up which topic corresponds to this task - logic handled in parent or complex)
                    }}
                    theme={data.thanatosisMode ? 'red' : 'cyan'}
                    timerState={timerState}
                    timerControls={timerControls}
                />
            );
        case 'MEMORY':
            return (
                <div className="h-full p-4 flex flex-col bg-slate-950">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {data.memory.map((m, i) => (
                            <div key={i} className="p-2 border border-slate-800 bg-slate-900 text-[10px] text-amber-100 font-mono">
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'BRIEFING':
            return (
                <DailyBriefing
                    briefing={data.briefingContent}
                    isLoading={data.isBriefingLoading}
                    onRefresh={actions.handleGenerateBriefing}
                    onChat={() => actions.toggleWindow('CHAT', 'SECURE COMMS')}
                />
            );
        case 'CHAT':
            return (
                <ContextChat
                    isOpen={true}
                    onClose={() => { }}
                    contextTask={null}
                    groqApiKey={data.settings.groqApiKey}
                    modelConfig={data.settings.models}
                    onCommandProcessed={actions.handleCommandResults}
                />
            );
        case 'COMMAND':
            return (
                <CommandBar
                    onCommandProcessed={actions.handleCommandResults}
                    isLoading={data.isProcessing}
                    setIsLoading={actions.setIsProcessing}
                    memory={data.memory}
                    activeTasks={data.tasks}
                    groqApiKey={data.settings.groqApiKey}
                    modelConfig={data.settings.models}
                    theme={data.thanatosisMode ? 'red' : 'cyan'}
                    weatherData={data.weatherData}
                />
            );
        case 'WEATHER':
            return <WeatherWidget data={data.weatherData} isLoading={!data.weatherData} />;
        default:
            return null;
    }
};

export default WindowContent;
