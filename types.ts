
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  endDate?: string;
  excludedDates?: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  startTime?: string; 
  endTime?: string;   
  projectId?: string; 
  chapterId?: string; 
  subtopicId?: string;
  priority: 'low' | 'medium' | 'high';
  recurrence?: RecurrenceRule;
  details?: string;
  subtasks?: Subtask[];
  labels?: string[];
  isEvent?: boolean;
  timeLogged?: number; // Total seconds tracked
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'event';
  priority?: 'low' | 'medium' | 'high';
  isGolden?: boolean;
  recurrence?: RecurrenceRule;
}

export interface Project {
    id: string;
    title: string;
    chapters: Chapter[];
    metadata?: {
        priority?: 'low' | 'medium' | 'high';
        deadline?: string;
        tags?: string[];
    }
}

export interface Chapter {
    id: string;
    title: string;
    progress: number;
    subtopics: Subtopic[];
}

export interface Subtopic {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    taskId?: string; // Link to active task
    lastStudied?: number; // Timestamp
}

export interface StudySessionLog {
    id: string;
    timestamp: number;
    duration: number; // seconds
    taskId: string;
    focusRating?: number; // 1-10
    interferences?: string[];
    notes?: string;
}

export interface ActiveProtocol {
    taskId: string;
    projectId?: string;
    startTime: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
  isDay: boolean;
  locationName: string;
  humidity?: number;
  feelsLike?: number;
  precipitation?: number;
  uvIndex?: number;
  uvIndexMax?: number;
  hourly?: {
      time: string[];
      temperature_2m: number[];
      uv_index: number[];
      precipitation_probability: number[];
      relative_humidity_2m: number[];
      apparent_temperature: number[];
      wind_speed_10m: number[];
      weather_code: number[];
  };
}

export type WindowType = 'TASKS' | 'PROJECTS' | 'CALENDAR' | 'CHRONO' | 'MEMORY' | 'BRIEFING' | 'CHAT' | 'COMMAND' | 'WEATHER' | 'DASHBOARD';

export interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  isOpen: boolean;
  width: number; // 1 (full), 0.5 (half), etc. relative to flex container
}

export interface WindowInstruction {
    target: WindowType;
    action: 'OPEN' | 'CLOSE' | 'FOCUS' | 'RESIZE';
    size?: number; // Flex grow value
    title?: string;
}

export interface AppSettings {
  groqApiKey: string;
  audioInputDeviceId?: string;
  models: {
      jarvis: string;
      transcription: string;
  };
  layoutMacros: any[];
}

export interface UserData {
    tasks: Task[];
    events: CalendarEvent[];
    memory: string[];
    projects: Project[];
    settings: AppSettings;
    sessionLogs: StudySessionLog[];
}

export type AppMode = 'EXECUTE' | 'PLAN' | 'INTEL';

export type HUDTheme = 'cyan' | 'red' | 'amber' | 'green';

// AI Types
export interface AiParseResult {
    reasoning?: string; // Chain of Thought field
    action: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 
            'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT' |
            'CREATE_PROJECT' | 'UPDATE_PROJECT' |
            'UPDATE_MEMORY' | 
            'START_TIMER' | 'STOP_TIMER' |
            'QUERY' | 'UNKNOWN' | 'MANAGE_WINDOW' | 'UPDATE_THEME' |
            'CREATE_NOTE' | 'CREATE_FOLDER' | 'NAVIGATE_SYLLABUS' | 'SWITCH_MODE' |
            'BREAK_DOWN_TASK'; // Added BREAK_DOWN_TASK
    taskData?: Partial<Task>;
    eventData?: Partial<CalendarEvent>;
    projectData?: Partial<Project>;
    memoryData?: { operation: 'add' | 'remove', fact: string };
    timerData?: { duration?: number, mode?: 'POMODORO' | 'STOPWATCH' };
    windowData?: { instructions: WindowInstruction[], clearHUD?: boolean };
    queryResponse?: string;
    uiData?: { theme: HUDTheme };
    noteData?: { title: string, content: string };
    folderData?: { name: string };
    navigationData?: { projectId: string, chapterId?: string };
    modeData?: { mode: AppMode };
    breakdownData?: { parentTaskId: string, subtasks: string[] }; // For breakdown
    usedModel?: string;
}

export interface PendingAction {
    id: string;
    result: AiParseResult;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: number;
}
