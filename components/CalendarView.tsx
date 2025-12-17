
import React, { useEffect, useRef, useState } from 'react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onTaskDrop?: (taskId: string, date: string, time: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onTaskDrop }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time line every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const hour = new Date().getHours();
      const scrollHour = Math.max(0, hour - 1);
      scrollContainerRef.current.scrollTop = scrollHour * 60;
    }
  }, []);

  // Helper to get week days based on currentDate state
  const getDaysInWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      return next;
    });
  };

  const days = getDaysInWeek(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'today') {
        setCurrentDate(new Date());
    } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  // Event Rendering Logic
  const getEventStyle = (event: CalendarEvent) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      let durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      
      // Min height for visibility
      if (durationMinutes < 15) durationMinutes = 15;

      // Styling based on type/priority
      let baseClasses = "absolute inset-x-1 rounded-sm border-l-2 p-1 text-[10px] overflow-hidden transition-all hover:z-50 hover:scale-[1.02] shadow-sm backdrop-blur-md cursor-pointer flex flex-col justify-start group/evt";
      
      if (event.isGolden) {
          return {
              style: { top: `${startMinutes}px`, height: `${durationMinutes}px` },
              className: `${baseClasses} bg-amber-500/10 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:bg-amber-500/20`
          };
      }
      if (event.priority === 'high') {
          return {
              style: { top: `${startMinutes}px`, height: `${durationMinutes}px` },
              className: `${baseClasses} bg-red-500/10 border-red-500 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-500/20`
          };
      }
      // Default / Task
      return {
          style: { top: `${startMinutes}px`, height: `${durationMinutes}px` },
          className: `${baseClasses} bg-cyan-500/10 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20`
      };
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      if (!onTaskDrop) return;
      
      const taskId = e.dataTransfer.getData("text/plain"); 
      if (!taskId) return;

      // Get Y position relative to the scroll container
      // e.currentTarget is the column div inside the grid
      const relativeY = e.nativeEvent.offsetY;
      
      const hour = Math.floor(relativeY / 60);
      const minute = Math.floor((relativeY % 60) / 15) * 15;
      
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const dateStr = date.toISOString().split('T')[0];
      
      onTaskDrop(taskId, dateStr, timeStr);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-300 font-mono select-none overflow-hidden relative">
        {/* Background Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05] pointer-events-none"></div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0b1120] shrink-0 z-10">
            <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold font-tech text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex border border-slate-700/50 rounded-sm overflow-hidden bg-slate-900/50">
                    <button onClick={() => navigateWeek('prev')} className="px-3 py-1 hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors border-r border-slate-700/50 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => navigateWeek('today')} className="px-4 py-1 hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors text-[10px] font-bold uppercase tracking-wider border-r border-slate-700/50">Today</button>
                    <button onClick={() => navigateWeek('next')} className="px-3 py-1 hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_green]"></div>
                 <span className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-bold">Grid Active</span>
            </div>
        </div>

        {/* DAYS HEADER */}
        <div className="grid grid-cols-8 border-b border-slate-800 bg-[#050914] shrink-0">
            <div className="col-span-1 border-r border-slate-800/50 p-2 flex flex-col justify-end items-center pb-2 bg-slate-950/50">
                <span className="text-[9px] text-slate-600 font-bold">UTC {new Date().getTimezoneOffset() / -60 >= 0 ? '+' : ''}{new Date().getTimezoneOffset() / -60}</span>
            </div>
            {days.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                    <div key={i} className={`col-span-1 py-3 text-center border-r border-slate-800/50 relative group ${isToday ? 'bg-cyan-950/10' : ''}`}>
                         <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {day.toLocaleString('default', { weekday: 'short' })}
                         </div>
                         <div className={`text-xl font-bold font-tech w-8 h-8 flex items-center justify-center mx-auto transition-all rounded-full ${isToday ? 'bg-cyan-500 text-black shadow-[0_0_15px_cyan]' : 'text-slate-400 group-hover:text-white'}`}>
                            {day.getDate()}
                         </div>
                    </div>
                );
            })}
        </div>

        {/* SCROLLABLE GRID */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="grid grid-cols-8 h-[1440px] relative">
                
                {/* TIME COLUMN */}
                <div className="col-span-1 border-r border-slate-800/50 bg-[#020617]/80 relative z-20">
                    {hours.map(h => (
                        <div key={h} className="absolute w-full text-right pr-4 text-[10px] font-bold text-slate-600 -mt-1.5 font-mono" style={{ top: `${h * 60}px` }}>
                            {h.toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* DAY COLUMNS */}
                {days.map((day, i) => {
                     const isToday = isSameDay(day, new Date());
                     const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));

                     return (
                        <div 
                            key={i} 
                            className={`col-span-1 border-r border-slate-800/30 relative h-full hover:bg-white/[0.02] transition-colors`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, day)}
                        >
                            {/* Horizontal Grid Lines for this column */}
                            {hours.map(h => (
                                <div key={h} className="absolute w-full border-t border-slate-800/20" style={{ top: `${h * 60}px` }}></div>
                            ))}

                            {/* Current Time Line */}
                            {isToday && (
                                <div 
                                    className="absolute w-full border-t-2 border-red-500/80 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                    style={{ top: `${currentTime.getHours() * 60 + currentTime.getMinutes()}px` }}
                                >
                                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_red]"></div>
                                </div>
                            )}

                            {/* Events */}
                            {dayEvents.map(event => {
                                const { style, className } = getEventStyle(event);
                                return (
                                    <div key={event.id} style={style} className={className} title={event.title}>
                                        <div className="font-bold truncate leading-none mb-0.5 text-shadow-sm">{event.title}</div>
                                        <div className="text-[9px] opacity-75 font-mono leading-none">
                                            {new Date(event.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     );
                })}
            </div>
        </div>
    </div>
  );
};

export default CalendarView;
