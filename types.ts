
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
  startTime?: string; // Unified Field
  endTime?: string;   // Unified Field
  project?: string;
  priority: 'low' | 'medium' | 'high';
  recurrence?: RecurrenceRule;
  details?: string;
  subtasks?: Subtask[];
  labels?: string[];
  isClass?: boolean;
  isEvent?: boolean; // Distinction flag
  completedAt?: string; // Timestamp for logs
}

// --- SYLLABUS / PROJECT STRUCTURE ---
export interface Subtopic {
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed';
    notes?: string;
}

export interface Chapter {
    id: string;
    title: string;
    subtopics: Subtopic[];
    progress: number; // 0-100
}

export interface Project {
    id: string;
    title: string; // Subject Name
    chapters: Chapter[];
    metadata?: {
        difficulty?: string;
        weight?: number;
        priority?: string;
    };
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'block' | 'meeting' | 'study' | 'class' | 'task' | 'event';
  description?: string;
  recurrence?: RecurrenceRule;
  isGolden?: boolean; 
  priority?: 'low' | 'medium' | 'high';
}

export interface WindowState {
    id: string;
    type: WindowType;
    title: string;
    isOpen: boolean;
    width?: number; // Percentage or Flex Weight (e.g. 30, 60)
}

export interface AppSettings {
  groqApiKey: string;
  models: {
    friday: string;
    jarvis: string;
    vision: string;
    transcription: string;
  };
  audioInputDeviceId?: string;
  layoutMacros: { name: string; windows: WindowState[] }[];
}

export interface UserData {
  tasks: Task[];
  events: CalendarEvent[];
  memory: string[];
  projects: Project[]; // Added Projects
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

export type WindowType = 'TASKS' | 'CALENDAR' | 'COMMAND' | 'CHAT' | 'MEMORY' | 'SETTINGS' | 'BRIEFING' | 'WEATHER' | 'PROJECTS' | 'LOGS';

export interface AiParseResult {
  action: 'CREATE_TASK' | 'CREATE_EVENT' | 'UPDATE_TASK' | 'DELETE_TASK' | 'QUERY' | 'UNKNOWN' | 'UPDATE_MEMORY' | 'CREATE_NOTE' | 'CREATE_FOLDER' | 'MANAGE_WINDOW' | 'MACRO' | 'FOCUS' | 'VIEW' | 'CREATE_PROJECT';
  taskData?: {
    id?: string; 
    title?: string;
    dueDate?: string;
    dueTime?: string;
    endTime?: string; 
    project?: string;
    priority?: 'low' | 'medium' | 'high';
    recurrence?: RecurrenceRule;
    details?: string;
    subtasks?: string[]; 
    labels?: string[];
    isClass?: boolean;
    completed?: boolean;
  };
  eventData?: {
      title: string;
      startTime: string;
      endTime: string;
      recurrence?: RecurrenceRule;
  };
  memoryData?: {
    fact: string;
    operation: 'add' | 'remove';
  };
  noteData?: {
    title: string;
    content: string;
  };
  folderData?: {
    name: string;
  };
  projectData?: {
      title: string;
      structure?: any; // JSON Syllabus
  };
  windowData?: {
      target: WindowType;
      action: 'OPEN' | 'CLOSE' | 'RESIZE';
      size?: number; // 1-100
  };
  macroData?: {
      action: 'SAVE' | 'ACTIVATE';
      name: string;
  };
  focusData?: {
      action: 'LOCK' | 'UNLOCK';
  };
  viewData?: {
      action: 'REVERT';
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
