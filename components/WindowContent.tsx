
import React from 'react';
import { WindowType, Task, CalendarEvent, WeatherData, AppSettings, AiParseResult, Project } from '../types';

// Components
import CommandBar from './CommandBar';
import TaskList from './TaskList';
import CalendarView from './CalendarView';
import WeatherWidget from './WeatherWidget';
import DailyBriefing from './DailyBriefing';
import ContextChat from './ContextChat';
import ProjectView from './ProjectView';

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
    };
}

const WindowContent: React.FC<WindowContentProps> = ({ type, data, actions }) => {
    switch (type) {
        case 'TASKS':
            return (
                <div className="h-full bg-[#05050a] flex flex-col">
                    <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Active Protocols: {data.tasks.filter(t => !t.completed).length}</span>
                        <button 
                            onClick={() => { actions.setEditingTask(null); actions.setIsDraftEdit(false); actions.setIsModalOpen(true); }} 
                            className="text-[10px] bg-cyan-900/20 text-cyan-400 border border-cyan-800 px-2 rounded hover:bg-cyan-900/40 uppercase"
                        >
                            + NEW
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <TaskList
                            tasks={data.tasks}
                            viewMode='LIST'
                            onToggleTask={(id) => actions.setTasks(t => t.map(x => x.id === id ? { ...x, completed: !x.completed, completedAt: !x.completed ? new Date().toISOString() : undefined } : x))}
                            onEditTask={(task) => { actions.setEditingTask(task); actions.setIsDraftEdit(false); actions.setIsModalOpen(true); }}
                            onDeleteTask={(id) => actions.setTasks(t => t.filter(x => x.id !== id))}
                            onUpdateTask={(updatedTask) => actions.setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
                            onAddSubtask={actions.handleAddSubtask}
                            onToggleSubtask={actions.handleToggleSubtask}
                            onClearCompleted={() => actions.setTasks(t => t.filter(x => !x.completed))}
                        />
                    </div>
                </div>
            );
        case 'PROJECTS':
            return (
                <div className="h-full bg-[#05050a] flex flex-col">
                     <ProjectView 
                        projects={data.projects}
                        onUpdateProject={(p) => actions.setProjects(prev => prev.map(proj => proj.id === p.id ? p : proj))}
                     />
                </div>
            );
        case 'LOGS':
            // Filter tasks completed yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            
            const logs = data.tasks.filter(t => t.completed); // Simple log of all completed for now, or filter by completedAt if accurate
            
            return (
                <div className="h-full bg-slate-950 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                    <h3 className="text-amber-500 font-bold mb-4 uppercase tracking-widest border-b border-amber-900/30 pb-2">Previous Operational Log</h3>
                    {logs.length === 0 ? (
                        <div className="text-slate-600">No logs recorded.</div>
                    ) : (
                        <ul className="space-y-3">
                            {logs.map(log => (
                                <li key={log.id} className="flex gap-3 text-slate-400">
                                    <span className="text-slate-600">[{log.completedAt ? new Date(log.completedAt).toLocaleTimeString() : 'ARCHIVED'}]</span>
                                    <span className="text-white line-through opacity-50">{log.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        case 'CALENDAR':
            return (
                <div className="h-full w-full">
                    <CalendarView
                        events={data.events}
                        onTaskDrop={() => { }}
                    />
                </div>
            );
        case 'MEMORY':
            return (
                <div className="h-full p-4 flex flex-col bg-slate-950">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {data.memory.map((m, i) => (
                            <div key={i} className="p-2 border border-slate-800 bg-slate-900 text-xs text-amber-100 font-mono flex justify-between">
                                {m}
                                <button 
                                    onClick={() => actions.setMemory(prev => prev.filter((_, idx) => idx !== i))} 
                                    className="text-slate-600 hover:text-red-500"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'BRIEFING':
            return (
                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                    <DailyBriefing
                        briefing={data.briefingContent}
                        isLoading={data.isBriefingLoading}
                        onRefresh={actions.handleGenerateBriefing}
                        onChat={() => { actions.toggleWindow('CHAT', 'SECURE COMMS'); }}
                    />
                </div>
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
                <div className="h-full flex items-center p-2 bg-black/90 border-t border-slate-800">
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
                </div>
            );
        case 'WEATHER':
            return (
                <div className="h-full bg-slate-950 flex flex-col">
                     <WeatherWidget data={data.weatherData} isLoading={!data.weatherData} />
                     <div className="p-4 text-[10px] text-slate-500 font-mono flex-1 border-t border-slate-900">
                         <div className="grid grid-cols-2 gap-2 opacity-70">
                             <div>SAT.UPLINK</div><div className="text-right text-green-500">ACTIVE</div>
                             <div>TELEMETRY</div><div className="text-right text-green-500">NOMINAL</div>
                             <div>SCAN CYCLE</div><div className="text-right">300ms</div>
                         </div>
                     </div>
                </div>
            );
        default:
            return null;
    }
};

export default WindowContent;
