
import React, { useState } from 'react';
import { Project, Chapter, Subtopic } from '../types';

interface ProjectViewProps {
    projects: Project[];
    onUpdateProject: (p: Project) => void;
}

const ProjectView: React.FC<ProjectViewProps> = ({ projects, onUpdateProject }) => {
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

    const toggleChapter = (id: string) => {
        const newSet = new Set(expandedChapters);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedChapters(newSet);
    };

    const getStatusColor = (status: string) => {
        if (status === 'completed') return 'bg-green-500';
        if (status === 'in-progress') return 'bg-amber-500';
        return 'bg-slate-700';
    };

    if (projects.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs p-8 text-center border-2 border-dashed border-slate-800">
                NO ACTIVE SYLLABUS DATA.<br/>
                UPLOAD JSON OR INSTRUCT JARVIS TO INITIALIZE PROJECT STRUCTURE.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-6">
            {projects.map(project => (
                <div key={project.id} className="animate-fade-in-up">
                    {/* Project Header */}
                    <div className="flex items-center gap-3 mb-4 border-b border-cyan-900/50 pb-2">
                        <div className="w-2 h-8 bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                        <div>
                            <h2 className="text-xl font-tech font-bold text-white tracking-widest uppercase">{project.title}</h2>
                            <div className="flex gap-4 text-[9px] font-mono text-slate-400 mt-1">
                                {project.metadata?.difficulty && <span>DIFFICULTY: {project.metadata.difficulty}</span>}
                                {project.metadata?.priority && <span className="text-amber-400">PRIORITY: {project.metadata.priority}</span>}
                                <span>CHAPTERS: {project.chapters.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chapters Grid/List */}
                    <div className="space-y-2">
                        {project.chapters.map(chapter => {
                            const isExpanded = expandedChapters.has(chapter.id);
                            const completedCount = chapter.subtopics.filter(s => s.status === 'completed').length;
                            const totalCount = chapter.subtopics.length;
                            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                            return (
                                <div key={chapter.id} className="bg-slate-900/50 border border-slate-800 rounded-sm overflow-hidden transition-all duration-300">
                                    {/* Chapter Bar */}
                                    <div 
                                        onClick={() => toggleChapter(chapter.id)}
                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-mono text-xs text-cyan-400 font-bold">{chapter.title}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* Progress Bar */}
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-cyan-500 transition-all duration-500" 
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-500 w-8 text-right">
                                                {Math.round(progress)}%
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Subtopics */}
                                    {isExpanded && (
                                        <div className="bg-black/20 p-2 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-slate-800">
                                            {chapter.subtopics.map(topic => (
                                                <div key={topic.id} className="flex items-start gap-2 p-2 rounded hover:bg-white/5 group">
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getStatusColor(topic.status)}`}></div>
                                                    <div className="flex-1">
                                                        <div className={`text-xs font-mono text-slate-300 ${topic.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                                                            {topic.title}
                                                        </div>
                                                        {topic.notes && (
                                                            <div className="text-[9px] text-slate-500 mt-1 italic">
                                                                "{topic.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectView;
