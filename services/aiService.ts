
import Groq from "groq-sdk";
import { AiParseResult, Task, AppSettings, Project, AppMode } from '../types';

const SYSTEM_PROMPT = `
You are JARVIS, a Strategic Study Operations System.
Your objective is HIGH-EFFICIENCY ACTION execution.

CORE PROTOCOLS (Chain of Thought):
1. ALWAYS analyze the user's intent in a "reasoning" field first.
2. Based on reasoning, select the specific tool.
3. Output strictly valid JSON.

AVAILABLE TOOLS (USE EXACT JSON STRUCTURE):

1. **DATA OPERATIONS**
   - CREATE_TASK: { "action": "CREATE_TASK", "taskData": { "title": "string", "priority": "low|medium|high", "dueDate": "YYYY-MM-DD", "details": "string" } }
   - UPDATE_TASK: { "action": "UPDATE_TASK", "taskData": { "id": "task_id", "completed": true } }
   - CREATE_EVENT: { "action": "CREATE_EVENT", "eventData": { "title": "string", "start": "ISO_STRING", "end": "ISO_STRING" } }
   - BREAK_DOWN_TASK: { "action": "BREAK_DOWN_TASK", "breakdownData": { "parentTaskId": "id_or_title", "subtasks": ["step 1", "step 2"] } }

2. **UI & SYSTEM CONTROL (ROBUST)**
   - SWITCH_MODE: Change the main dashboard layout.
     { "action": "SWITCH_MODE", "modeData": { "mode": "EXECUTE" | "PLAN" | "INTEL" } }
     - EXECUTE: Task execution, Timer, Chat.
     - PLAN: Calendar, Projects, Syllabus.
     - INTEL: Dashboard, Weather, Briefing.
   
   - MANAGE_WINDOW: Open/Close specific HUD panels.
     { "action": "MANAGE_WINDOW", "windowData": { "instructions": [{ "target": "TASKS"|"CALENDAR"|"PROJECTS"|"CHRONO"|"BRIEFING"|"CHAT", "action": "OPEN"|"CLOSE" }] } }
   
   - UPDATE_THEME: Change HUD color.
     { "action": "UPDATE_THEME", "uiData": { "theme": "cyan" | "red" | "amber" | "green" } }

3. **UTILITIES**
   - START_TIMER: { "action": "START_TIMER", "timerData": { "duration": seconds, "mode": "POMODORO"|"STOPWATCH" } }
   - UPDATE_MEMORY: { "action": "UPDATE_MEMORY", "memoryData": { "operation": "add"|"remove", "fact": "string" } }
   - QUERY: General knowledge. { "action": "QUERY", "queryResponse": "answer" }

CONTEXT RULES:
- You receive a MINIFIED map of tasks/projects.
- Current UI Mode is provided. If user wants to "see calendar", SWITCH_MODE to PLAN or OPEN_WINDOW CALENDAR.
- If user says "Focus", START_TIMER and SWITCH_MODE to EXECUTE.
`;

export const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
    if (!apiKey) return [];
    try {
        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
        const list = await groq.models.list();
        return list.data.map(m => m.id);
    } catch (e) {
        return ['moonshotai/kimi-k2-instruct', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    }
};

export const parseUserCommand = async (
    userText: string,
    apiKey: string, 
    modelConfig: AppSettings['models'],
    activePersona: string,
    memory: string[],
    activeTasks: Task[],
    projects: Project[],
    notes?: any,
    weatherContext?: string,
    activeContextId?: string,
    currentMode?: AppMode // New Param
): Promise<AiParseResult[]> => {
    
    if (!apiKey) throw new Error("Operational Failure: Groq API Key Missing.");

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    // Minify Task List
    const taskContext = activeTasks
        .filter(t => !t.completed)
        .map(t => `[${t.id}] ${t.title} (${t.priority})`)
        .join('\n');

    // Minify Project Map
    let projectContext = "";
    const zoomedProject = projects.find(p => p.id === activeContextId);
    
    if (zoomedProject) {
        projectContext = `FOCUSED PROJECT: ${JSON.stringify({
            id: zoomedProject.id,
            title: zoomedProject.title,
            chapters: zoomedProject.chapters.map(c => ({ 
                id: c.id, title: c.title, subtopics: c.subtopics.map(s => s.title) 
            }))
        })}`;
    } else {
        const map = projects.map(p => ({ id: p.id, title: p.title, count: p.chapters.length }));
        projectContext = `SYLLABUS MAP: ${JSON.stringify(map)}`;
    }

    const memoryContext = memory.slice(-10).join("; ");

    // Explicit date formatting for the AI
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString();

    try {
        const completion = await groq.chat.completions.create({
            model: modelConfig.jarvis || 'moonshotai/kimi-k2-instruct',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { 
                    role: 'user', 
                    content: `
USER INPUT: "${userText}"

SYSTEM STATUS:
- DATE: ${dateStr}
- TIME: ${timeStr}
- WEATHER: ${weatherContext || 'N/A'}
- CURRENT MODE: ${currentMode || 'UNKNOWN'}
- ACTIVE TASKS (Summary):
${taskContext}

- PROJECTS (Summary):
${projectContext}

- MEMORY:
${memoryContext}
` 
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1, 
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return [{ action: 'UNKNOWN' }];

        try {
            const parsed = JSON.parse(content);
            let results: AiParseResult[] = [];
            
            if (parsed.actions && Array.isArray(parsed.actions)) {
                results = parsed.actions.map((a: any) => ({
                    ...a,
                    reasoning: parsed.reasoning,
                    usedModel: modelConfig.jarvis
                }));
            } else if (Array.isArray(parsed)) {
                results = parsed;
            } else {
                results = [parsed];
            }

            return results;
        } catch (jsonErr) {
            console.error("JSON Parse Failure", jsonErr);
            return [{ action: 'QUERY', queryResponse: "Syntax Error in Logic Core. Re-calibrating." }];
        }
    } catch (e: any) {
        console.error("Groq Hardware Error", e);
        return [{ action: 'QUERY', queryResponse: `Operational Interruption: ${e.message}` }];
    }
};
