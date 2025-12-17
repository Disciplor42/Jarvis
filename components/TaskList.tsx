
import React, { useState } from 'react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  viewMode?: 'LIST' | 'BOARD';
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void; // Required for DnD
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  theme?: 'cyan' | 'red';
  onClearCompleted?: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  viewMode = 'LIST',
  onToggleTask, 
  onDeleteTask, 
  onEditTask,
  onUpdateTask,
  onAddSubtask,
  onToggleSubtask,
  theme = 'cyan',
  onClearCompleted
}) => {
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<{[key: string]: string}>({});

  const borderColor = theme === 'red' ? 'border-red-500/30' : 'border-cyan-500/30';
  const accentColor = theme === 'red' ? 'text-red-500' : 'text-cyan-500';

  const toggleExpand = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) {
        newSet.delete(taskId);
    } else {
        newSet.add(taskId);
    }
    setExpandedTasks(newSet);
  };

  const handleSubtaskSubmit = (taskId: string) => {
    const title = newSubtaskInputs[taskId];
    if (title && title.trim()) {
        onAddSubtask(taskId, title.trim());
        setNewSubtaskInputs(prev => ({...prev, [taskId]: ''}));
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverColumn !== category) {
        setDragOverColumn(category);
    }
  };

  const handleDragLeave = () => {
      // Optional: Debounce or check relatedTarget to prevent flickering
  };

  const handleDrop = (e: React.DragEvent, targetCategory: 'high' | 'medium' | 'low' | 'completed') => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      const updates: Partial<Task> = {};
      
      if (targetCategory === 'completed') {
        updates.completed = true;
      } else {
        updates.completed = false;
        updates.priority = targetCategory;
      }
      
      onUpdateTask({ ...task, ...updates });
    }
  };

  // --- RENDERERS ---

  const renderTaskCard = (task: Task, isCompact = false) => {
    const isExpanded = expandedTasks.has(task.id);
    
    return (
        <div 
            key={task.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className={`group flex flex-col border-l-2 ${borderColor} bg-black/40 hover:bg-white/5 transition-all mb-1 rounded-r-sm ${isExpanded ? 'bg-white/5' : ''}`}
        >
            <div className="flex items-center justify-between p-2 cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                        className={`w-3 h-3 border ${theme === 'red' ? 'border-red-600 hover:bg-red-600' : 'border-cyan-600 hover:bg-cyan-600'} transition-colors shrink-0`}
                    ></button>
                    <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(task.id)}>
                        <div className="flex items-center gap-2">
                             <span className={`text-xs font-bold font-mono ${accentColor} truncate tracking-wide ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                             {task.subtasks && task.subtasks.length > 0 && (
                                 <span className="text-[9px] text-slate-500 font-mono bg-slate-800 px-1 rounded flex items-center gap-0.5">
                                     {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                 </span>
                             )}
                        </div>
                        {!isCompact && (
                          <div className="flex gap-2 text-[9px] text-slate-500 font-mono">
                              {task.dueTime && <span>T-MINUS: {task.dueTime}</span>}
                              {task.priority && <span className="uppercase">PRIORITY: {task.priority}</span>}
                          </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     <button onClick={() => toggleExpand(task.id)} className="text-slate-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                             <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                     </button>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-1 rounded">
                        <button onClick={() => onEditTask(task)} className="text-[9px] text-slate-400 hover:text-white uppercase">Edit</button>
                        <button onClick={() => onDeleteTask(task.id)} className="text-[9px] text-red-500 hover:text-red-400 uppercase">X</button>
                    </div>
                </div>
            </div>

            {/* Subtasks Expansion */}
            {isExpanded && !isCompact && (
                <div className="pl-8 pr-2 pb-2 space-y-1 animate-fade-in">
                    {task.subtasks?.map(sub => (
                        <div key={sub.id} className="flex items-center gap-2 group/sub">
                             <button 
                                onClick={() => onToggleSubtask(task.id, sub.id)}
                                className={`w-2.5 h-2.5 border ${theme === 'red' ? 'border-red-800' : 'border-cyan-800'} flex items-center justify-center`}
                             >
                                 {sub.completed && <div className={`w-1.5 h-1.5 ${theme === 'red' ? 'bg-red-600' : 'bg-cyan-600'}`}></div>}
                             </button>
                             <span className={`text-[10px] font-mono text-slate-400 ${sub.completed ? 'line-through opacity-50' : ''}`}>{sub.title}</span>
                        </div>
                    ))}
                    
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-600">+</span>
                        <input 
                            type="text" 
                            value={newSubtaskInputs[task.id] || ''}
                            onChange={(e) => setNewSubtaskInputs({...newSubtaskInputs, [task.id]: e.target.value})}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubtaskSubmit(task.id); }}
                            placeholder="Add sub-protocol..."
                            className="bg-transparent border-none text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none flex-1 font-mono"
                        />
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderKanbanColumn = (title: string, category: 'high' | 'medium' | 'low' | 'completed', items: Task[], headerColor: string) => {
    const isOver = dragOverColumn === category;
    
    return (
        <div 
          className={`flex-1 min-w-[160px] flex flex-col border-r border-white/5 last:border-r-0 h-full transition-colors duration-200 ${isOver ? 'bg-white/5' : 'bg-slate-900/20'}`}
          onDragOver={(e) => handleDragOver(e, category)}
          onDrop={(e) => handleDrop(e, category)}
        >
            <div className={`p-2 border-b border-white/10 font-bold text-[10px] uppercase tracking-widest flex justify-between items-center ${headerColor} ${isOver ? 'bg-white/10' : ''}`}>
                <span>{title}</span>
                <span className="bg-white/10 px-1.5 rounded text-[9px]">{items.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                {items.map(task => renderTaskCard(task, true))}
                {items.length === 0 && (
                    <div className="h-full min-h-[50px] opacity-20 flex items-center justify-center text-[40px] font-mono select-none text-white/5">
                        {category === 'high' ? '!' : category === 'completed' ? '✓' : '•'}
                    </div>
                )}
            </div>
        </div>
    );
  };

  // --- MAIN RENDER ---

  if (viewMode === 'BOARD') {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-x-auto custom-scrollbar snap-x">
           {renderKanbanColumn('CRITICAL', 'high', activeTasks.filter(t => t.priority === 'high'), 'text-red-500')}
           {renderKanbanColumn('STANDARD', 'medium', activeTasks.filter(t => t.priority === 'medium'), 'text-cyan-500')}
           {renderKanbanColumn('LOW', 'low', activeTasks.filter(t => t.priority === 'low'), 'text-slate-400')}
           {renderKanbanColumn('ARCHIVE', 'completed', completedTasks, 'text-green-500')}
        </div>
        {onClearCompleted && completedTasks.length > 0 && (
             <div className="p-1 border-t border-white/10 flex justify-end bg-black/40">
                 <button onClick={onClearCompleted} className="text-[9px] text-red-500 hover:text-red-400 font-mono uppercase px-2 hover:bg-red-900/20 py-1 rounded">PURGE ARCHIVE</button>
             </div>
        )}
      </div>
    );
  }

  // DEFAULT LIST VIEW
  return (
    <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
            {activeTasks.map(task => renderTaskCard(task))}
            {activeTasks.length === 0 && (
                <div className="text-center py-10 text-slate-600 font-mono text-[10px] border border-dashed border-slate-800 rounded m-2">
                    NO ACTIVE PROTOCOLS
                </div>
            )}
        </div>

        {completedTasks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center mb-1 px-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase">ARCHIVE ({completedTasks.length})</span>
                    {onClearCompleted && (
                        <button onClick={onClearCompleted} className="text-[9px] text-red-500 hover:text-red-400 font-mono hover:bg-red-900/20 px-1 rounded">PURGE</button>
                    )}
                </div>
                <div className="space-y-1 opacity-50">
                    {completedTasks.slice(0, 3).map(task => (
                         <div key={task.id} className="text-[10px] text-slate-600 font-mono line-through pl-2 border-l border-slate-700">
                             {task.title}
                         </div>
                    ))}
                    {completedTasks.length > 3 && (
                        <div className="text-[9px] text-slate-700 italic pl-2">
                            + {completedTasks.length - 3} more...
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default TaskList;
