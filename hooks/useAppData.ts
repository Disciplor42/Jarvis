
import { useState, useEffect, useMemo } from 'react';
import { Task, AppSettings, WeatherData, CalendarEvent, Project } from '../types';
import { fetchUserData, syncUserData } from '../services/storageService';
import { fetchWeather } from '../services/openMeteoService';

export const useAppData = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [memory, setMemory] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        groqApiKey: '',
        models: { 
            friday: 'llama-3.1-8b-instant', 
            jarvis: 'llama-3.3-70b-versatile', 
            vision: 'llama-3.3-70b-versatile',
            transcription: 'whisper-large-v3'
        },
        layoutMacros: []
    });
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

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
        if (data && (data.tasks?.length > 0 || data.memory?.length > 0)) {
            if(data.tasks) setTasks(data.tasks);
            if(data.projects) setProjects(data.projects);
            if(data.memory) setMemory(data.memory);
            if(data.settings) setSettings({
                ...data.settings,
                layoutMacros: data.settings.layoutMacros || [] // ensure fallback
            });
        } else {
            // Default / Demo Data
            setTasks([
                {
                    id: 't-1',
                    title: 'Calibrate Orbit Stabilizers',
                    priority: 'high',
                    completed: false,
                    project: 'MARK-85',
                    dueDate: new Date().toISOString().split('T')[0],
                    details: 'Re-align thruster variance for atmospheric entry.',
                    subtasks: [
                        { id: 'st-1', title: 'Check fuel cells', completed: true },
                        { id: 'st-2', title: 'Run diagnostic alpha', completed: false }
                    ]
                }
            ]);
            setProjects([
                {
                    id: 'p-1',
                    title: 'Advanced Robotics',
                    chapters: [
                        {
                            id: 'c-1',
                            title: 'Kinematics',
                            progress: 50,
                            subtopics: [
                                { id: 's-1', title: 'Forward Kinematics', status: 'completed' },
                                { id: 's-2', title: 'Inverse Kinematics', status: 'in-progress' }
                            ]
                        }
                    ],
                    metadata: { difficulty: 'Hard', priority: 'High' }
                }
            ]);
            setMemory(['Jarvis System Online', 'Stark Tower Secure', 'Pepper Potts: Birthday next Tuesday']);
        }
    };

    // Sync on Change
    useEffect(() => {
        syncUserData('Tony Stark', { tasks, events: [], memory, settings, projects }).then(() => {
            setIsOfflineMode(false);
        }).catch(() => {
            setIsOfflineMode(true);
        });
    }, [tasks, memory, settings, projects]);

    // Derived Events
    const events: CalendarEvent[] = useMemo(() => {
        return tasks
        .filter(t => !t.completed) 
        .filter(t => (t.startTime && t.endTime) || (t.dueDate))
        .map(t => {
          const isEvent = !!(t.startTime && t.endTime);
          let start = '';
          let end = '';
    
          if (isEvent) {
              start = t.startTime!;
              end = t.endTime!;
          } else if (t.dueDate) {
              const time = t.dueTime || '12:00';
              start = `${t.dueDate.split('T')[0]}T${time}`;
              const startDate = new Date(start);
              end = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString(); 
          }
    
          return {
            id: t.id,
            title: t.title,
            start,
            end,
            type: isEvent ? 'event' : 'task',
            priority: t.priority,
            recurrence: t.recurrence
          };
        });
    }, [tasks]);

    return {
        tasks,
        setTasks,
        projects,
        setProjects,
        memory,
        setMemory,
        settings,
        setSettings,
        weatherData,
        events,
        isOfflineMode,
        loadData
    };
};
