
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, AppSettings, WeatherData, CalendarEvent, Project, ActiveProtocol, StudySessionLog } from '../types';
import { fetchUserData, syncUserData } from '../services/storageService';
import { fetchWeather } from '../services/openMeteoService';

export const useAppData = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [memory, setMemory] = useState<string[]>([]);
    const [sessionLogs, setSessionLogs] = useState<StudySessionLog[]>([]);
    const [activeProtocol, setActiveProtocol] = useState<ActiveProtocol | null>(null);
    const [settings, setSettings] = useState<AppSettings>({
        groqApiKey: '',
        models: { 
            jarvis: 'moonshotai/kimi-k2-instruct', 
            transcription: 'whisper-large-v3-turbo'
        },
        layoutMacros: []
    });
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

    useEffect(() => {
        loadData();
        fetchWeather().then(setWeatherData);
        const weatherInterval = setInterval(() => {
            fetchWeather().then(setWeatherData);
        }, 60000 * 30);
        return () => clearInterval(weatherInterval);
    }, []);

    const loadData = async () => {
        const data = await fetchUserData('Tony Stark');
        if (data && (data.tasks?.length > 0 || data.projects?.length > 0)) {
            if(data.tasks) setTasks(data.tasks);
            if(data.projects) setProjects(data.projects);
            if(data.memory) setMemory(data.memory);
            if(data.settings) {
                // Ensure models object matches new structure if loading old data
                const loadedSettings = data.settings;
                if (!loadedSettings.models.jarvis) loadedSettings.models.jarvis = 'moonshotai/kimi-k2-instruct';
                if (!loadedSettings.models.transcription) loadedSettings.models.transcription = 'whisper-large-v3-turbo';
                // Remove deprecated models if present in local state
                const { friday, vision, ...newModels } = loadedSettings.models as any;
                setSettings({ ...loadedSettings, models: newModels });
            }
            if(data.sessionLogs) setSessionLogs(data.sessionLogs);
        } else {
            setProjects([{
                id: 'p-mark85',
                title: 'MARK-85 ASSEMBLY',
                chapters: [{
                    id: 'c-1',
                    title: 'NANO-BONDING',
                    progress: 0,
                    subtopics: [
                        { id: 's-1', title: 'MOLECULAR ALIGNMENT', status: 'pending' },
                        { id: 's-2', title: 'INTEGRITY TEST', status: 'pending' }
                    ]
                }]
            }]);
        }
    };

    useEffect(() => {
        setProjects(prev => prev.map(project => {
            const updatedChapters = project.chapters.map(chapter => {
                const updatedSubtopics = chapter.subtopics.map(topic => {
                    if (topic.taskId) {
                        const task = tasks.find(t => t.id === topic.taskId);
                        if (task?.completed) return { ...topic, status: 'completed' as const };
                        if (task) return { ...topic, status: 'in-progress' as const };
                    }
                    return topic;
                });
                const completed = updatedSubtopics.filter(s => s.status === 'completed').length;
                const progress = updatedSubtopics.length > 0 ? (completed / updatedSubtopics.length) * 100 : 0;
                return { ...chapter, subtopics: updatedSubtopics, progress };
            });
            return { ...project, chapters: updatedChapters };
        }));
    }, [tasks]);

    // Enhanced Event Memo with Recurrence Expansion
    const events: CalendarEvent[] = useMemo(() => {
        const expanded: CalendarEvent[] = [];
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + 60); // View 2 months ahead for recurrence

        tasks.forEach(t => {
            if (t.completed) return;
            const baseStart = t.startTime || (t.dueDate ? `${t.dueDate}T${t.dueTime || '12:00'}` : null);
            if (!baseStart) return;

            const startDate = new Date(baseStart);
            
            // 1. Initial Occurrence
            expanded.push({
                id: t.id,
                title: t.title,
                start: startDate.toISOString(),
                end: t.endTime || (new Date(startDate.getTime() + 3600000).toISOString()),
                type: t.isEvent ? 'event' : 'task',
                priority: t.priority,
                isGolden: t.priority === 'high',
                recurrence: t.recurrence
            });

            // 2. Expand Recurrence
            if (t.recurrence && t.recurrence.frequency !== 'none' as any) {
                const recurrenceEnd = t.recurrence.endDate ? new Date(t.recurrence.endDate) : horizon;
                const loopEnd = new Date(Math.min(recurrenceEnd.getTime(), horizon.getTime()));
                
                let current = new Date(startDate);
                while (true) {
                    if (t.recurrence.frequency === 'daily') {
                        current.setDate(current.getDate() + 1);
                    } else if (t.recurrence.frequency === 'weekly') {
                        current.setDate(current.getDate() + 7);
                    } else if (t.recurrence.frequency === 'monthly') {
                        current.setMonth(current.getMonth() + 1);
                    } else break;

                    if (current > loopEnd) break;

                    expanded.push({
                        id: `${t.id}-${current.getTime()}`,
                        title: t.title,
                        start: current.toISOString(),
                        end: (new Date(current.getTime() + (new Date(expanded[0].end).getTime() - startDate.getTime()))).toISOString(),
                        type: t.isEvent ? 'event' : 'task',
                        priority: t.priority,
                        isGolden: t.priority === 'high',
                        recurrence: t.recurrence
                    });
                }
            }
        });

        return expanded;
    }, [tasks]);

    useEffect(() => {
        syncUserData('Tony Stark', { tasks, events: [], memory, settings, projects, sessionLogs });
    }, [tasks, memory, settings, projects, sessionLogs]);

    const startProtocol = useCallback((taskId: string, projectId?: string) => {
        setActiveProtocol({ taskId, projectId, startTime: Date.now() });
    }, []);

    const endProtocol = useCallback(() => {
        if (!activeProtocol) return;
        const duration = Math.floor((Date.now() - activeProtocol.startTime) / 1000);
        setTasks(prev => prev.map(t => t.id === activeProtocol.taskId ? { ...t, timeLogged: (t.timeLogged || 0) + duration } : t));
        setActiveProtocol(null);
    }, [activeProtocol]);

    return {
        tasks, setTasks,
        projects, setProjects,
        memory, setMemory,
        settings, setSettings,
        weatherData, events,
        activeProtocol, startProtocol, endProtocol,
        sessionLogs, setSessionLogs,
        loadData
    };
};
