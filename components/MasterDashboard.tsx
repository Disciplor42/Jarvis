
import React from 'react';
import { Task, Project, CalendarEvent, StudySessionLog } from '../types';

interface MasterDashboardProps {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  timerState: any;
  activeProtocol: string | undefined;
  sessionLogs: StudySessionLog[];
  onNavigate: (view: string) => void;
}

const MasterDashboard: React.FC<MasterDashboardProps> = ({
  tasks, projects, events, timerState, activeProtocol, sessionLogs, onNavigate
}) => {
  // --- Derived Metrics ---
  const activeTask = tasks.find(t => t.id === activeProtocol);
  
  // Sort tasks: High priority first, then by due time
  const highPriorityTasks = tasks
    .filter(t => !t.completed && t.priority === 'high')
    .sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));

  const upcomingEvents = events
    .filter(e => new Date(e.start) > new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  // Calculate Global Syllabus Completion
  let totalSubtopics = 0;
  let completedSubtopics = 0;
  projects.forEach(p => {
      p.chapters.forEach(c => {
          totalSubtopics += c.subtopics.length;
          completedSubtopics += c.subtopics.filter(s => s.status === 'completed').length;
      });
  });
  const totalProgress = totalSubtopics > 0 ? (completedSubtopics / totalSubtopics) * 100 : 0;

  // Focus Graph Data (Last 7 sessions)
  const recentLogs = [...sessionLogs].sort((a, b) => a.timestamp - b.timestamp).slice(-7);
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-[#020617] flex flex-col p-4 gap-4 font-mono overflow-y-auto custom-scrollbar">
      
      {/* HEADER STATS ROW */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
          {/* Status / Active Timer */}
          <div className="col-span-1 bg-slate-900/50 border border-slate-800 p-3 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/10 rounded-bl-xl"></div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Protocol Status</span>
              <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold font-tech tracking-tighter ${timerState.isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                      {timerState.mode === 'POMODORO' ? formatTime(timerState.timeLeft) : formatTime(timerState.elapsed)}
                  </span>
                  <span className="text-[9px] text-slate-600 mb-1">{timerState.isActive ? 'RUNNING' : 'IDLE'}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-1">
                  {activeTask ? activeTask.title : "NO ACTIVE PROTOCOL"}
              </div>
          </div>

          {/* Project Completion */}
          <div className="col-span-1 bg-slate-900/50 border border-slate-800 p-3 flex flex-col justify-between cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => onNavigate('PROJECTS')}>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Global Syllabus</span>
              <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold font-tech text-white">{Math.round(totalProgress)}%</span>
                  <span className="text-[9px] text-slate-600 mb-1">COMPLETE</span>
              </div>
              <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${totalProgress}%` }}></div>
              </div>
          </div>

          {/* Priority Matrix */}
          <div className="col-span-1 bg-slate-900/50 border border-slate-800 p-3 flex flex-col justify-between cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => onNavigate('TASKS')}>
               <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Threat Levels</span>
               <div className="flex items-center gap-3 mt-1">
                   <div className="text-center">
                       <div className="text-lg font-bold text-red-500">{highPriorityTasks.length}</div>
                       <div className="text-[7px] text-red-900 uppercase">CRITICAL</div>
                   </div>
                   <div className="h-6 w-px bg-slate-800"></div>
                   <div className="text-center">
                       <div className="text-lg font-bold text-amber-500">{tasks.filter(t => !t.completed && t.priority === 'medium').length}</div>
                       <div className="text-[7px] text-amber-900 uppercase">STANDARD</div>
                   </div>
               </div>
          </div>

          {/* Next Event */}
          <div className="col-span-1 bg-slate-900/50 border border-slate-800 p-3 flex flex-col justify-between hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => onNavigate('CALENDAR')}>
               <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Next Event</span>
               {upcomingEvents.length > 0 ? (
                   <>
                     <div className="text-sm font-bold text-cyan-100 truncate">{upcomingEvents[0].title}</div>
                     <div className="text-[9px] text-cyan-500 font-bold">
                        {new Date(upcomingEvents[0].start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                   </>
               ) : (
                   <div className="text-xs text-slate-600 italic">No trajectory data</div>
               )}
          </div>
      </div>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 min-h-0 flex gap-4">
          
          {/* LEFT: CRITICAL TASKS & PROJECTS */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
              {/* Critical Tasks List */}
              <div className="flex-[2] border border-slate-800 bg-slate-900/30 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                      <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 13a1 1 0 112 0V6a1 1 0 11-2 0v7z" /></svg>
                  </div>
                  <div className="flex justify-between items-center mb-3 relative z-10">
                      <h3 className="text-xs font-bold font-tech text-red-400 uppercase tracking-widest">Immediate Directives</h3>
                      <button onClick={() => onNavigate('TASKS')} className="text-[9px] text-slate-500 hover:text-white uppercase">Expand Queue</button>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[200px] custom-scrollbar relative z-10">
                      {highPriorityTasks.length === 0 && (
                          <div className="text-[10px] text-slate-600 text-center py-4">ALL CRITICAL SYSTEMS NOMINAL</div>
                      )}
                      {highPriorityTasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-slate-950/50 border-l-2 border-red-500 hover:bg-red-900/10 transition-colors">
                              <span className="text-xs text-slate-300 font-bold truncate">{t.title}</span>
                              <span className="text-[9px] text-red-500 font-mono">{t.dueTime || 'ASAP'}</span>
                          </div>
                      ))}
                      {tasks.filter(t => !t.completed && t.priority === 'medium').slice(0, 3).map(t => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-slate-950/30 border-l-2 border-amber-500 hover:bg-amber-900/10 transition-colors opacity-80">
                              <span className="text-xs text-slate-400 truncate">{t.title}</span>
                              <span className="text-[9px] text-amber-500 font-mono">STD</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Projects List */}
              <div className="flex-[3] border border-slate-800 bg-slate-900/30 p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold font-tech text-cyan-400 uppercase tracking-widest">Active Operations</h3>
                      <button onClick={() => onNavigate('PROJECTS')} className="text-[9px] text-slate-500 hover:text-white uppercase">Syllabus Map</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                      {projects.map(p => {
                          const total = p.chapters.reduce((sum, c) => sum + c.subtopics.length, 0);
                          const done = p.chapters.reduce((sum, c) => sum + c.subtopics.filter(s => s.status === 'completed').length, 0);
                          const pct = total > 0 ? (done / total) * 100 : 0;
                          
                          return (
                              <div key={p.id} className="group">
                                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                      <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{p.title}</span>
                                      <span>{done}/{total}</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-cyan-600 group-hover:bg-cyan-400 transition-all" style={{ width: `${pct}%` }}></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>

          {/* RIGHT: TIMELINE & ANALYTICS */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
              
              {/* Timeline */}
              <div className="flex-[3] border border-slate-800 bg-slate-900/30 p-4 relative">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold font-tech text-amber-400 uppercase tracking-widest">Temporal Grid</h3>
                      <button onClick={() => onNavigate('CALENDAR')} className="text-[9px] text-slate-500 hover:text-white uppercase">Full Cal</button>
                  </div>
                  <div className="relative h-full overflow-hidden flex flex-col gap-3">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-800"></div>
                      {upcomingEvents.map((e, i) => (
                          <div key={e.id} className="relative ml-6 pl-4 border-l border-slate-700 py-1 hover:border-amber-500 transition-colors group">
                              <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#020617] border border-slate-600 rounded-full group-hover:border-amber-500 group-hover:bg-amber-500/20"></div>
                              <div className="text-xs text-slate-300 font-bold group-hover:text-amber-100">{e.title}</div>
                              <div className="text-[9px] text-slate-500 font-mono">
                                  {new Date(e.start).toLocaleTimeString([], {weekday: 'short', hour:'2-digit', minute:'2-digit'})}
                                  {' -> '} 
                                  {new Date(e.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </div>
                          </div>
                      ))}
                      {upcomingEvents.length === 0 && (
                          <div className="text-center text-[10px] text-slate-600 mt-10">NO IMMINENT EVENTS</div>
                      )}
                  </div>
              </div>

              {/* Performance Graph (Cognitive Efficiency) */}
              <div className="flex-[2] border border-slate-800 bg-slate-900/30 p-4 flex flex-col">
                  <h3 className="text-xs font-bold font-tech text-green-400 uppercase tracking-widest mb-2">Cognitive Efficiency</h3>
                  <div className="flex-1 relative flex items-end gap-1 px-2 border-b border-l border-slate-800">
                      {recentLogs.length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-700">NO DATA POINTS</div>
                      ) : (
                          recentLogs.map((log, i) => (
                              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                  <div 
                                      className="w-full bg-green-500/20 border-t border-green-500 hover:bg-green-500/40 transition-all min-h-[4px]"
                                      style={{ height: `${(log.focusRating || 0) * 10}%` }}
                                  ></div>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full mb-1 bg-black border border-green-500 text-[9px] text-green-400 px-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                      {log.focusRating}/10
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600 mt-1 font-mono uppercase">
                      <span>Past 7 Sessions</span>
                      <span>Avg: {recentLogs.length > 0 ? (recentLogs.reduce((a,b) => a + (b.focusRating || 0), 0) / recentLogs.length).toFixed(1) : 0}</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
