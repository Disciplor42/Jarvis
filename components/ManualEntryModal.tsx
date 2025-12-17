
import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, RecurrenceRule, Subtask } from '../types';
import { parseUserCommand } from '../services/aiService';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (task: Task) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  taskToEdit?: Task | null;
  isDraft?: boolean; // New prop to indicate if editing a draft proposal
  apiKey: string;
  groqApiKey: string;
  modelConfig: { friday: string, jarvis: string, vision: string, transcription: string };
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddTask, 
  onUpdateTask,
  taskToEdit,
  isDraft = false,
  apiKey,
  groqApiKey,
  modelConfig
}) => {
  // Common State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [project, setProject] = useState('');
  const [details, setDetails] = useState('');
  
  // Recurrence
  const [recurrenceFreq, setRecurrenceFreq] = useState<string>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // Task/Event Unified State
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState(''); // Start Time
  const [endTime, setEndTime] = useState(''); // End Time (Optional - makes it a "Golden Event")
  
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Labels State
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');

  // AI Assist State
  const [aiInput, setAiInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAiInput(transcript);
          // Auto-submit on voice end for fluidity
          handleAiAssist(transcript);
          setIsListening(false);
        };
        recognitionInstance.onerror = () => setIsListening(false);
        recognitionInstance.onend = () => setIsListening(false);
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
        alert("Microphone not supported in this browser.");
        return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic Error:", e);
      }
    }
  };

  // Load task data when editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setPriority(taskToEdit.priority);
      setProject(taskToEdit.project || '');
      setDetails(taskToEdit.details || '');
      setSubtasks(taskToEdit.subtasks || []);
      setLabels(taskToEdit.labels || []);
      
      if (taskToEdit.dueDate) {
        setDueDate(taskToEdit.dueDate.split('T')[0]);
      } else {
        setDueDate('');
      }
      setDueTime(taskToEdit.dueTime || '');
      setEndTime(taskToEdit.endTime || '');

      if (taskToEdit.recurrence) {
        setRecurrenceFreq(taskToEdit.recurrence.frequency);
        setRecurrenceEndDate(taskToEdit.recurrence.endDate || '');
      } else {
        setRecurrenceFreq('none');
        setRecurrenceEndDate('');
      }
    } else {
      resetForm();
    }
  }, [taskToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setPriority('medium');
    setProject('');
    setDetails('');
    setDueDate('');
    setDueTime('');
    setEndTime('');
    setRecurrenceFreq('none');
    setRecurrenceEndDate('');
    setSubtasks([]);
    setNewSubtaskTitle('');
    setLabels([]);
    setNewLabel('');
    setAiInput('');
  };

  if (!isOpen) return null;

  const handleAiAssist = async (overrideInput?: string) => {
    const text = overrideInput || aiInput;
    if (!text.trim()) return;

    if (!apiKey && !groqApiKey) {
      alert("Please configure API Keys in Settings first.");
      return;
    }

    setIsAiProcessing(true);
    try {
        // Just send empty context for the modal helper
        const results = await parseUserCommand(text, groqApiKey, modelConfig, 'JARVIS', [], []);
        
        // Use the first result to populate the modal
        const result = results[0];

        // Map AI result to Form State
        if (result.action === 'CREATE_TASK' && result.taskData) {
            if (result.taskData.title) setTitle(result.taskData.title);
            if (result.taskData.priority) setPriority(result.taskData.priority);
            if (result.taskData.project) setProject(result.taskData.project);
            if (result.taskData.details) setDetails(result.taskData.details);
            if (result.taskData.dueDate) {
                 const d = new Date(result.taskData.dueDate);
                 setDueDate(d.toISOString().split('T')[0]);
            }
            if (result.taskData.dueTime) setDueTime(result.taskData.dueTime);
            if (result.taskData.endTime) setEndTime(result.taskData.endTime);
            
            if (result.taskData.recurrence) {
                setRecurrenceFreq(result.taskData.recurrence.frequency);
                if (result.taskData.recurrence.endDate) setRecurrenceEndDate(result.taskData.recurrence.endDate);
            }
            if (result.taskData.labels) {
                setLabels(prev => Array.from(new Set([...prev, ...(result.taskData?.labels || [])])));
            }
        }

        setAiInput('');
    } catch (e) {
        console.error("AI Assist Error", e);
    } finally {
        setIsAiProcessing(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleAddLabel = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    
    if (newLabel.trim()) {
        const cleanLabel = newLabel.trim().toLowerCase();
        if (!labels.includes(cleanLabel)) {
            setLabels([...labels, cleanLabel]);
        }
        setNewLabel('');
    }
  };

  const handleRemoveLabel = (tag: string) => {
      setLabels(labels.filter(l => l !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recurrence: RecurrenceRule | undefined = recurrenceFreq !== 'none' 
      ? { 
          frequency: recurrenceFreq as 'daily' | 'weekly' | 'monthly',
          endDate: recurrenceEndDate || undefined,
          interval: 1 
        } 
      : undefined;

    let finalDate = undefined;
    if (dueDate) {
       // Ensure valid ISO string
       finalDate = new Date(`${dueDate}T00:00:00`).toISOString();
    }
    
    const taskPayload = {
      title,
      priority,
      project: project || 'General',
      dueDate: finalDate,
      dueTime: dueTime || undefined,
      endTime: endTime || undefined,
      recurrence,
      details,
      subtasks,
      labels
    };

    if (taskToEdit && !isDraft) {
      onUpdateTask({ ...taskToEdit, ...taskPayload });
    } else {
      onAddTask(taskPayload);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex border-b border-slate-700 shrink-0 bg-red-900/10">
          <div className="flex-1 py-3 text-center">
            <h2 className="text-xs font-bold tracking-widest uppercase text-red-500">
                {isDraft ? 'Modify Draft Protocol' : (taskToEdit ? 'Modify Protocol' : 'New Task Protocol')}
            </h2>
          </div>
        </div>

        {/* AI Assist Bar */}
        <div className="bg-slate-950/50 border-b border-slate-800 p-2 flex gap-2 items-center">
             <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAiAssist(); }}
                    disabled={isAiProcessing}
                    placeholder={isAiProcessing ? "Processing..." : isListening ? "Listening..." : "JARVIS: 'Clean cycle tomorrow 12pm to 1pm'"}
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-400 text-xs px-3 py-2 focus:border-cyan-500 focus:outline-none placeholder-slate-600 font-mono rounded-none"
                />
                {isAiProcessing && (
                    <div className="absolute right-2 top-2 w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                )}
             </div>
             <button 
                onClick={toggleListening}
                className={`p-2 border border-slate-700 hover:border-cyan-500 transition-colors ${isListening ? 'bg-red-900/30 text-red-500 animate-pulse border-red-500' : 'text-cyan-600 hover:text-cyan-400'}`}
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
             </button>
             <button 
                onClick={() => handleAiAssist()}
                className="px-3 py-2 bg-cyan-900/20 border border-cyan-900 text-cyan-500 hover:bg-cyan-900/40 text-[10px] font-bold font-tech uppercase tracking-wider transition-colors"
             >
                ENGAGE
             </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Operational Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Calibrate Sensors"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono placeholder-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Project Sector</label>
              <input 
                type="text" 
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="MARK-85"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono placeholder-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Cycle</label>
              <select 
                value={recurrenceFreq}
                onChange={e => setRecurrenceFreq(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none appearance-none text-sm cursor-pointer font-mono"
              >
                <option value="none">Single Instance</option>
                <option value="daily">Daily Cycle</option>
                <option value="weekly">Weekly Cycle</option>
                <option value="monthly">Monthly Cycle</option>
              </select>
            </div>
          </div>

          {recurrenceFreq !== 'none' && (
              <div className="animate-fade-in-down">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Cycle End Date</label>
                <input 
                  type="date" 
                  value={recurrenceEndDate}
                  onChange={e => setRecurrenceEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono"
                />
              </div>
          )}

          {/* TIME CONFIGURATION */}
            <div className="grid grid-cols-4 gap-3 bg-slate-900/30 p-2 border border-slate-800">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Target Date</label>
                    <input 
                    type="date" 
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono"
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Start Time</label>
                    <input 
                    type="time" 
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono"
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-amber-500 uppercase mb-1 tracking-wider" title="Fill to Create Golden Event">End Time</label>
                    <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-700 text-amber-200 focus:border-amber-500 outline-none text-sm font-mono"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Alert Level</label>
                      <select 
                        value={priority}
                        onChange={e => setPriority(e.target.value as any)}
                        className={`w-full px-2 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono uppercase font-bold ${priority === 'high' ? 'text-red-500' : priority === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">Critical</option>
                      </select>
                  </div>
            </div>
            
            {/* LABELS / TAGS INPUT */}
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Labels / Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {labels.map(label => (
                        <span key={label} className="bg-slate-800 text-slate-300 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1 border border-slate-700">
                            {label}
                            <button type="button" onClick={() => handleRemoveLabel(label)} className="text-slate-500 hover:text-red-500">&times;</button>
                        </span>
                    ))}
                </div>
                <input 
                    type="text"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={handleAddLabel}
                    placeholder="Type tag and press Enter..."
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm font-mono placeholder-slate-700"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Mission Brief / Details</label>
                <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Input operational parameters..."
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 text-slate-200 focus:border-red-500 outline-none text-sm resize-none font-mono placeholder-slate-700"
                />
            </div>
            
            {/* Subtasks Section */}
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">Sub-Protocols</label>
                <div className="space-y-2 mb-2">
                {subtasks.map(s => (
                    <div key={s.id} className="flex items-center gap-2 group">
                        <div className="flex-1 text-sm text-slate-300 bg-slate-950 px-3 py-1.5 border border-slate-800 flex justify-between items-center font-mono">
                        <span>{s.title}</span>
                        <button 
                            type="button" 
                            onClick={() => handleRemoveSubtask(s.id)}
                            className="text-slate-600 hover:text-red-500"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                        </div>
                    </div>
                ))}
                </div>
                <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                    placeholder="Add step..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-300 focus:border-red-500 outline-none text-sm font-mono placeholder-slate-700"
                />
                <button 
                    type="button" 
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 font-medium text-sm transition-colors uppercase font-bold"
                >
                    +
                </button>
                </div>
            </div>

          <div className="pt-4 flex gap-3">
             <button 
               type="button" 
               onClick={onClose}
               className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white bg-transparent border border-transparent hover:border-slate-600 transition-colors"
             >
               Abort
             </button>
             <button 
               type="submit" 
               className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white border transition-all transform active:scale-95 shadow-lg bg-red-900/80 border-red-600 hover:bg-red-800 shadow-red-900/20"
             >
               {isDraft ? 'Confirm & Initialize' : (taskToEdit ? 'Update Protocol' : 'Initialize Protocol')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
