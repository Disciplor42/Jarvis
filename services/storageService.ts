import { UserData } from '../types';

const API_URL_KEY = 'JARVIS_API_URL';
const LOCAL_STORAGE_KEY = 'JARVIS_LOCAL_DATA';

// Default to relative /api to use Vite Proxy or same-origin in production
const getBaseUrl = () => {
  if (typeof window === 'undefined') return '/api';
  const stored = localStorage.getItem(API_URL_KEY);
  return stored || '/api';
};

let API_URL = getBaseUrl();

export const getApiUrl = () => API_URL;

export const setApiUrl = (url: string) => {
  const cleanUrl = url.replace(/\/$/, "");
  API_URL = cleanUrl;
  localStorage.setItem(API_URL_KEY, cleanUrl);
};

// --- AUTH ---
export const registerUser = async (username: string, pass: string) => {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        if(!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }
        return true;
    } catch(e) {
        // Fallback for Local Mode auth (Mock)
        console.warn("Server unreachable. Registering locally.");
        return true;
    }
};

export const loginUser = async (username: string, pass: string) => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        if(!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        return true;
    } catch(e) {
        // Fallback for Local Mode auth (Mock)
        console.warn("Server unreachable. Logging in locally.");
        return true;
    }
};

// Auto-initialize session
export const initializeServerSession = async (username: string, defaultPass: string) => {
    try {
        await loginUser(username, defaultPass);
        return true;
    } catch (e: any) {
        return false;
    }
};

// --- DATA ---
export const fetchUserData = async (username: string): Promise<UserData> => {
  // 1. Try Server Fetch
  try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for offline check

      const res = await fetch(`${API_URL}/data`, {
          headers: { 'x-username': username },
          signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Failed to fetch data");
      
      const data = await res.json();
      // Backup to local
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${username}`, JSON.stringify(data));
      return data;

  } catch (e) {
      // 2. Fallback to LocalStorage
      console.warn("Switched to Offline Mode.");
      const localData = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${username}`);
      if (localData) {
          return JSON.parse(localData);
      }
      return { tasks: [], events: [], memory: [], projects: [] };
  }
};

export const syncUserData = async (username: string, data: UserData): Promise<void> => {
  // 1. Always save to LocalStorage first (Optimistic UI)
  try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${username}`, JSON.stringify(data));
  } catch (err) {
      console.error("Local Save Failed", err);
  }

  // 2. Try Server Sync
  try {
      await fetch(`${API_URL}/data`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-username': username
        },
        body: JSON.stringify(data)
      });
  } catch(e) {
      // Swallowed to prevent UI blocking. Data is safe in LocalStorage.
  }
};