
import Groq from "groq-sdk";
import { Task, CalendarEvent } from '../types';

export const generateDailyBriefing = async (
    apiKey: string,
    model: string,
    username: string,
    tasks: Task[],
    events: CalendarEvent[],
    memory: string[],
    weather: string
): Promise<string> => {
    
    if (!apiKey) return "Authentication credentials missing. Please configure Groq API Key in Settings.";

    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    
    // Default to a high-reasoning model if none selected, utilizing Groq's Llama options
    const activeModel = model || 'llama-3.3-70b-versatile';

    const systemPrompt = `
    You are VISION, a highly advanced AI synthesizer for Stark Industries.
    Your goal is to provide a tactical Morning Briefing for ${username}.
    
    INPUT DATA:
    - Time: ${new Date().toLocaleString()}
    - Weather: ${weather}
    - Active Protocols: ${tasks.length} tasks
    - Calendar Events: ${events.length} events
    - Memory Context: ${memory.slice(-5).join('; ')}

    INSTRUCTIONS:
    1. Analyze the schedule and tasks.
    2. Prioritize critical items (High Priority).
    3. Synthesize weather data with schedule (e.g., "Rain expected during your 2pm travel").
    4. Provide a strategic recommendation for the day.
    
    FORMAT:
    - Use technical, concise, yet elegant language (Jarvis/Vision style).
    - Use Markdown for bolding key terms.
    - Keep it under 200 words.
    `;

    const userContent = `
    ACTIVE TASKS:
    ${tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} ${t.dueTime ? '@ ' + t.dueTime : ''}`).join('\n')}

    CALENDAR:
    ${events.map(e => `- ${e.title} (${new Date(e.start).toLocaleTimeString()})`).join('\n')}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            model: activeModel,
            temperature: 0.6,
            max_completion_tokens: 1024,
        });
        
        return completion.choices[0]?.message?.content || "Systems nominal. No briefing data generated.";
    } catch (e: any) {
        console.error("Groq Briefing Error", e);
        return `Briefing Error: ${e.message}. Ensure API Key is valid.`;
    }
};
