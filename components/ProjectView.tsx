
import React, { useState, useRef } from 'react';
import { Project, Subtopic } from '../types';

interface ProjectViewProps {
    projects: Project[];
    onUpdateProject: (p: Project) => void;
    onInitializeTask?: (topic: Subtopic, project: Project) => void;
    activeProtocolId?: string;
    onImportSyllabus: (json: any) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projects, onUpdateProject, onInitializeTask, activeProtocolId, onImportSyllabus }) => {
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleChapter = (id: string) => {
        const newSet = new Set(expandedChapters);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedChapters(newSet);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                onImportSyllabus(json);
            } catch (err) {
                alert("Invalid Syllabus JSON Format");
            }
        };
        reader.readAsText(file);
    };

    // COGNITIVE DECAY LOGIC
    const getDecayColor = (topic: Subtopic) => {
        if (topic.status === 'completed') return 'bg-green-600 shadow-[0_0_5px_green]';
        
        if (!topic.lastStudied) return 'bg-slate-700';

        const daysSince = (Date.now() - topic.lastStudied) / (1000 * 60 * 60 * 24);
        
        // Decay thresholds
        if (daysSince < 3) return 'bg-cyan-500 shadow-[0_0_5px_cyan]'; // Fresh
        if (daysSince < 7) return 'bg-yellow-500 shadow-[0_0_5px_yellow]'; // Fading
        return 'bg-red-600 animate-pulse shadow-[0_0_5px_red]'; // Decayed (Critical)
    };

    return (
        <div className="h-full flex flex-col bg-black/20">
            <div className="p-2 border-b border-white/5 flex justify-end">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleFileUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[9px] font-bold uppercase tracking-widest text-cyan-500 border border-cyan-900 px-2 py-1 hover:bg-cyan-900/30 transition-colors"
                >
                    + Import Syllabus (JSON)
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                {projects.length === 0 && (
                    <div className="text-center py-10 text-slate-600 font-mono text-[10px]">
                        NO SYLLABUS DATA. IMPORT JSON OR GENERATE.
                    </div>
                )}

                {projects.map(project => {
                    const totalTopics = project.chapters.reduce((sum, c) => sum + c.subtopics.length, 0);
                    const totalCompleted = project.chapters.reduce((sum, c) => sum + c.subtopics.filter(s => s.status === 'completed').length, 0);
                    const progress = totalTopics > 0 ? (totalCompleted / totalTopics) * 100 : 0;

                    return (
                        <div key={project.id} className="border border-white/5 bg-slate-900/10 rounded overflow-hidden">
                            <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-800" />
                                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={87.9} strokeDashoffset={87.9 * (1 - progress / 100)} className="text-cyan-500 transition-all duration-1000" />
                                    </svg>
                                    <span className="text-[8px] font-bold font-mono text-cyan-400">{Math.round(progress)}%</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold font-tech text-white tracking-widest uppercase truncate">{project.title}</h3>
                                    <div className="text-[8px] text-slate-500 font-mono flex gap-3 mt-0.5">
                                        <span>TOPICS: {totalCompleted}/{totalTopics}</span>
                                        {project.metadata?.deadline && <span className="text-red-400">DUE: {project.metadata.deadline}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-2 space-y-1">
                                {project.chapters.map(chapter => (
                                    <div key={chapter.id} className="border border-white/5 rounded-sm overflow-hidden">
                                        <button 
                                            onClick={() => toggleChapter(chapter.id)}
                                            className="w-full p-2 flex justify-between items-center text-[9px] font-mono hover:bg-white/5 transition-colors"
                                        >
                                            <span className={chapter.progress === 100 ? 'text-green-500' : 'text-slate-300'}>
                                                {chapter.title}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-600" style={{ width: `${chapter.progress}%` }}></div>
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform ${expandedChapters.has(chapter.id) ? 'rotate-180' : ''}`}>
                                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.04 1.08l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </button>

                                        {expandedChapters.has(chapter.id) && (
                                            <div className="px-2 pb-2 space-y-1 animate-fade-in">
                                                {chapter.subtopics.map(topic => (
                                                    <div key={topic.id} className="flex items-center justify-between p-1.5 hover:bg-white/[0.03] rounded-sm group/topic">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {/* Decay Indicator */}
                                                            <div 
                                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDecayColor(topic)}`}
                                                                title={topic.lastStudied ? `Last studied: ${new Date(topic.lastStudied).toLocaleDateString()}` : 'Not studied'}
                                                            ></div>
                                                            <span className={`text-[9px] font-mono truncate ${topic.status === 'completed' ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                                                                {topic.title}
                                                            </span>
                                                        </div>
                                                        {onInitializeTask && topic.status !== 'completed' && (
                                                            <button 
                                                                onClick={() => onInitializeTask(topic, project)}
                                                                className={`text-[7px] font-bold px-1.5 py-0.5 border rounded uppercase transition-all ${topic.taskId === activeProtocolId ? 'bg-red-900 border-red-500 text-red-500 animate-pulse' : 'border-slate-700 text-slate-500 hover:border-cyan-500 hover:text-cyan-400'}`}
                                                            >
                                                                {topic.taskId === activeProtocolId ? 'ACTIVE' : 'ENGAGE'}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectView;
