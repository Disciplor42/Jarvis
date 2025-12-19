
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
  isClass?: boolean;
  isEvent?: boolean; 
  completedAt?: string;
  timeLogged?: number; 
}

export interface Subtopic {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    notes?: string;
    taskId?: string; 
    timeRequired?: number; 
    timeSpent?: number;
    // Cognitive Decay & Mastery
    lastStudied?: number; // Timestamp
    mastery?: number; // 1-10 scale (10 is mastered)
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Chapter {
    id: string;
    title: string;
    subtopics: Subtopic[];
    progress: number; 
}

export interface Project {
    id: string;
    title: string; 
    chapters: Chapter[];
    metadata?: {
        difficulty?: string;
        weight?: number;
        priority?: 'low' | 'medium' | 'high';
        deadline?: string;
        tags?: string[];
    };
}

export interface StudySessionLog {
    id: string;
    timestamp: number;
    duration: number; // seconds
    taskId?: string;
    projectId?: string;
    focusRating: number; // 1-10
    interferences: string[]; // e.g. ["Phone", "Noise"]
    notes?: string;
}

export interface WindowState {
    id: string;
    type: WindowType;
    title: string;
    isOpen: boolean;
    width?: number; 
    position?: 'left' | 'center' | 'right';
    contextData?: any; // For "Zooming" into specific chapters/projects
}

export interface AppSettings {
  groqApiKey: string;
  models: {
    jarvis: string;
    transcription: string;
  };
  audioInputDeviceId?: string;
  layoutMacros: { name: string; windows: WindowState[] }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'event' | 'task' | 'ghost';
  priority: 'low' | 'medium' | 'high';
  recurrence?: RecurrenceRule;
  isGolden?: boolean;
}

export interface ActiveProtocol {
    taskId: string;
    projectId?: string;
    startTime: number;
}

export interface UserData {
  tasks: Task[];
  events: CalendarEvent[];
  memory: string[];
  projects: Project[]; 
  sessionLogs: StudySessionLog[]; // New Data Store
  settings?: AppSettings;
}

export interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
  isDay: boolean;
  locationName?: string;
  humidity?: number;
  feelsLike?: number;
  precipitation?: number;
  uvIndex?: number;
  uvIndexMax?: number;
  hourly?: any;
}

export type WindowType = 'TASKS' | 'CALENDAR' | 'COMMAND' | 'CHAT' | 'MEMORY' | 'SETTINGS' | 'BRIEFING' | 'WEATHER' | 'PROJECTS' | 'CHRONO' | 'PLANNER';

export type HUDTheme = 'cyan' | 'red' | 'amber' | 'green';

export interface WindowInstruction {
    target: WindowType;
    action: 'OPEN' | 'CLOSE' | 'RESIZE' | 'FOCUS';
    size?: number; 
    title?: string;
    data?: any; // To pass context (e.g. which chapter to zoom)
}

export interface AiParseResult {
  action: 'CREATE_TASK' | 'CREATE_EVENT' | 'UPDATE_TASK' | 'DELETE_TASK' | 'QUERY' | 'UNKNOWN' | 'UPDATE_MEMORY' | 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'START_TIMER' | 'MANAGE_WINDOW' | 'UPDATE_THEME' | 'CREATE_NOTE' | 'CREATE_FOLDER' | 'NAVIGATE_SYLLABUS';
  taskData?: Partial<Task>;
  eventData?: any;
  memoryData?: { fact: string; operation: 'add' | 'remove' };
  noteData?: { title: string; content: string };
  folderData?: { name: string };
  projectData?: any;
  timerData?: { duration?: number; taskId?: string; mode: 'POMODORO' | 'STOPWATCH' };
  windowData?: { 
      instructions: WindowInstruction[];
      clearHUD?: boolean;
  };
  navigationData?: { projectId: string; chapterId?: string }; // For Context Zoom
  uiData?: {
      theme?: HUDTheme;
  };
  queryResponse?: string;
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
