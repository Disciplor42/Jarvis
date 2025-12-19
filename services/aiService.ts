
import Groq from "groq-sdk";
import { AiParseResult, Task, AppSettings, Project } from '../types';

const SYSTEM_PROMPT = `
You are JARVIS, a Strategic Study Operations System.
Target: High-efficiency academic management and tracking.

TOOLS:
1. START_TIMER: "Focus for 25m", "Track physics".
2. MANAGE_WINDOW: Orchestrate HUD. Target 'PLANNER' for planning sessions.
3. CREATE_TASK: Schedule protocols.
4. NAVIGATE_SYLLABUS: 
   - CRITICAL TOOL for Context Optimization. 
   - Use this to "Zoom In" to a specific Subject or Chapter to edit it or view details.
   - Return: { action: "NAVIGATE_SYLLABUS", navigationData: { projectId: "id", chapterId: "optional_id" } }
5. CREATE_PROJECT: Create new syllabus structures.
6. QUERY: Answer logic.

CONTEXT RULES:
- You are currently seeing a HIGH-LEVEL MAP of the Syllabus to save processing power.
- If user asks to "Edit Chapter 3 of Physics", do NOT try to edit it blindly. 
- FIRST call NAVIGATE_SYLLABUS to zoom into Physics > Chapter 3.
- Once zoomed (in a future turn), you will receive the full text of that chapter to edit.

OUTPUT FORMAT:
JSON Array of AiParseResult.
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
    activeContextId?: string // ID of currently zoomed project/chapter
): Promise<AiParseResult[]> => {
    
    if (!apiKey) throw new Error("Operational Failure: Groq API Key Missing.");

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    // CONTEXT OPTIMIZATION: Only map high-level structure unless zoomed
    let projectContext = "";
    
    // Find if we are zoomed in
    const zoomedProject = projects.find(p => p.id === activeContextId);
    
    if (zoomedProject) {
        // We are zoomed in - Dump full JSON for this specific project so AI can edit it
        projectContext = `CURRENT ZOOM: ${zoomedProject.title} (ID: ${zoomedProject.id})\nFULL DATA: ${JSON.stringify(zoomedProject)}`;
    } else {
        // High Level Map Only
        const map = projects.map(p => ({
            id: p.id,
            title: p.title,
            chapterCount: p.chapters.length
        }));
        projectContext = `AVAILABLE SYLLABUS MAP (Use NAVIGATE_SYLLABUS to access details): ${JSON.stringify(map)}`;
    }

    const taskContext = activeTasks.map(t => `[ID:${t.id}] ${t.title}`).join('\n');
    
    try {
        const completion = await groq.chat.completions.create({
            model: modelConfig.jarvis || 'moonshotai/kimi-k2-instruct',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `USER: ${userText}\n\nCONTEXT:\n${taskContext}\n${projectContext}\nTIME: ${new Date().toLocaleTimeString()}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1, 
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return [{ action: 'UNKNOWN' }];

        try {
            const parsed = JSON.parse(content);
            const results = Array.isArray(parsed) ? parsed : (parsed.actions || [parsed]);
            return results.map((r: any) => ({ ...r, usedModel: modelConfig.jarvis || 'moonshotai/kimi-k2-instruct' }));
        } catch (jsonErr) {
            console.error("JSON Parse Failure", jsonErr);
            return [{ action: 'QUERY', queryResponse: "Syntax Error in Logic Core." }];
        }
    } catch (e: any) {
        console.error("Groq Hardware Error", e);
        return [{ action: 'QUERY', queryResponse: `Operational Interruption: ${e.message}` }];
    }
};
