
import Groq from "groq-sdk";
import { AiParseResult, Task, AppSettings, Folder, Note } from '../types';
import { fetchWeather } from './openMeteoService';

const SYSTEM_PROMPT_BASE = `
You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant for Stark Industries.
Your primary function is to manage the user's life operations including Tasks, Projects, Calendar, and Information.

OPERATIONAL PARAMETERS:
1. EFFICIENCY: Be concise, precise, and actionable.
2. CONTEXT: You are aware of the current time, weather, and active protocols (tasks).
3. UI CONTROL: You have full control over the HUD interface.
   - Use 'manage_window' for single window actions.
   - Use 'save_macro' to save the CURRENT view layout with a name (e.g. "Study Mode").
   - Use 'activate_macro' to switch to a named preset.
   - Use 'lock_focus' to preventing opening new windows (Deep Work).
   - Use 'revert_view' to undo the last layout change.

PERSONA OVERRIDES:
- FRIDAY: Tactical, immediate, short responses. Focus on next steps.
- JARVIS: Professional, witty, insightful. The standard interface.
- VISION: Analytical, philosophical, detailed. Focus on synthesis of data.
`;

const tools = [
    {
        type: "function",
        function: {
            name: "create_task",
            description: "Create a new task or reminder.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "The main task description" },
                    priority: { type: "string", enum: ["low", "medium", "high"], description: "Urgency level" },
                    project: { type: "string", description: "Project name or category" },
                    dueDate: { type: "string", description: "ISO Date YYYY-MM-DD" },
                    dueTime: { type: "string", description: "Time HH:MM (24hr)" },
                    endTime: { type: "string", description: "End Time HH:MM (24hr)" },
                    details: { type: "string", description: "Additional context or sub-steps" },
                    subtasks: { type: "array", items: { type: "string" }, description: "List of sub-steps" },
                    labels: { type: "array", items: { type: "string" }, description: "Tags" }
                },
                required: ["title"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_event",
            description: "Create a calendar event with a specific start and end time.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Event title" },
                    startTime: { type: "string", description: "ISO 8601 Start Time" },
                    endTime: { type: "string", description: "ISO 8601 End Time" }
                },
                required: ["title", "startTime", "endTime"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manage_window",
            description: "Open, close, or resize interface windows.",
            parameters: {
                type: "object",
                properties: {
                    target: { type: "string", enum: ["TASKS", "CALENDAR", "WEATHER", "MEMORY", "BRIEFING", "CHAT", "COMMAND"] },
                    action: { type: "string", enum: ["OPEN", "CLOSE", "RESIZE"] },
                    size: { type: "number", description: "Percentage width (1-100) for RESIZE action" }
                },
                required: ["target", "action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "save_macro",
            description: "Save the current window layout as a named macro (e.g., 'Study Mode', 'Morning View').",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Name of the macro" }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "activate_macro",
            description: "Activate a saved window layout macro.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Name of the macro to activate" }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "lock_focus",
            description: "Enable Focus Lock to prevent opening new windows.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    {
        type: "function",
        function: {
            name: "unlock_focus",
            description: "Disable Focus Lock.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    {
        type: "function",
        function: {
            name: "revert_view",
            description: "Undo the last layout change (Attention Stack).",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_task",
            description: "Modify an existing task.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "The Task ID to update" },
                    title: { type: "string" },
                    completed: { type: "boolean" },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    dueDate: { type: "string" },
                    dueTime: { type: "string" },
                    endTime: { type: "string" }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_task",
            description: "Permanently remove a task.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Task ID to remove" }
                },
                required: ["id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "save_memory",
            description: "Save a fact to memory.",
            parameters: {
                type: "object",
                properties: {
                    fact: { type: "string", description: "The information to store" }
                },
                required: ["fact"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get current weather.",
            parameters: {
                type: "object",
                properties: {
                    location: { type: "string", description: "City name" }
                }
            }
        }
    }
];

export const fetchAvailableModels = async (apiKey: string): Promise<string[]> => {
    if (!apiKey) return [];
    try {
        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
        const list = await groq.models.list();
        return list.data.map(m => m.id);
    } catch (e) {
        console.error("Failed to fetch models", e);
        return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
    }
};

export const parseUserCommand = async (
    userText: string,
    apiKey: string,
    modelConfig: AppSettings['models'],
    activePersona: 'FRIDAY' | 'JARVIS' | 'VISION',
    memory: string[],
    activeTasks: Task[],
    folders?: Folder[],
    notes?: Note[],
    weatherContext?: string,
    contextTaskId?: string
): Promise<AiParseResult[]> => {
    
    if (!apiKey) {
        return [{ action: 'QUERY', queryResponse: "Authorization failed. Please access Settings and input a valid Groq API Key." }];
    }

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    let modelName = modelConfig.jarvis || 'llama-3.3-70b-versatile';
    if (activePersona === 'VISION') modelName = modelConfig.vision || 'llama-3.3-70b-versatile';
    if (activePersona === 'FRIDAY') modelName = modelConfig.friday || 'llama-3.1-8b-instant';

    let systemMsg = SYSTEM_PROMPT_BASE;
    systemMsg += `\nCURRENT PERSONA: ${activePersona}`;
    systemMsg += `\nCURRENT TIME: ${new Date().toLocaleString()}`;
    if (weatherContext) systemMsg += `\nATMOSPHERICS: ${weatherContext}`;
    
    const taskSummary = activeTasks.slice(0, 50).map(t => 
        `ID:${t.id} | ${t.title} | ${t.dueDate || 'No Date'}`
    ).join('\n');
    systemMsg += `\n\nACTIVE PROTOCOLS:\n${taskSummary}`;

    if (contextTaskId) {
        const t = activeTasks.find(task => task.id === contextTaskId);
        if (t) systemMsg += `\n\nFOCUS CONTEXT: Discussing Task "${t.title}" (ID: ${t.id}). Details: ${t.details}`;
    }

    try {
        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemMsg },
                { role: "user", content: userText }
            ],
            tools: tools as any,
            tool_choice: "auto",
            temperature: 0.3,
            max_completion_tokens: 1024
        });

        const results: AiParseResult[] = [];
        const choice = completion.choices[0];
        const message = choice.message;

        if (message.tool_calls && message.tool_calls.length > 0) {
             for (const toolCall of message.tool_calls) {
                 const fnName = toolCall.function.name;
                 const args = JSON.parse(toolCall.function.arguments);

                 const baseResult = { usedModel: activePersona };

                 if (fnName === 'create_task') {
                     results.push({ ...baseResult, action: 'CREATE_TASK', taskData: args });
                 } else if (fnName === 'create_event') {
                     results.push({ ...baseResult, action: 'CREATE_EVENT', eventData: args });
                 } else if (fnName === 'update_task') {
                     results.push({ ...baseResult, action: 'UPDATE_TASK', taskData: { id: args.id, ...args } });
                 } else if (fnName === 'delete_task') {
                     results.push({ ...baseResult, action: 'DELETE_TASK', taskData: { id: args.id } });
                 } else if (fnName === 'save_memory') {
                     results.push({ ...baseResult, action: 'UPDATE_MEMORY', memoryData: { operation: 'add', fact: args.fact } });
                 } else if (fnName === 'manage_window') {
                     results.push({ ...baseResult, action: 'MANAGE_WINDOW', windowData: args });
                 } else if (fnName === 'save_macro') {
                     results.push({ ...baseResult, action: 'MACRO', macroData: { action: 'SAVE', name: args.name } });
                 } else if (fnName === 'activate_macro') {
                     results.push({ ...baseResult, action: 'MACRO', macroData: { action: 'ACTIVATE', name: args.name } });
                 } else if (fnName === 'lock_focus') {
                     results.push({ ...baseResult, action: 'FOCUS', focusData: { action: 'LOCK' } });
                 } else if (fnName === 'unlock_focus') {
                     results.push({ ...baseResult, action: 'FOCUS', focusData: { action: 'UNLOCK' } });
                 } else if (fnName === 'revert_view') {
                     results.push({ ...baseResult, action: 'VIEW', viewData: { action: 'REVERT' } });
                 } else if (fnName === 'get_weather') {
                     const w = await fetchWeather();
                     results.push({ ...baseResult, action: 'QUERY', queryResponse: `Current weather: ${w.temp}C, ${w.condition}.` });
                 }
             }
        } 
        
        if (message.content) {
             results.push({ action: 'QUERY', queryResponse: message.content, usedModel: activePersona });
        }

        return results;

    } catch (e: any) {
        console.error("Groq API Error", e);
        return [{ action: 'QUERY', queryResponse: `System Error: ${e.message}` }];
    }
};
