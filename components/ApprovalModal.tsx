
import React from 'react';
import { AiParseResult } from '../types';

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: AiParseResult[];
    onApprove: (index: number) => void;
    onReject: (index: number) => void;
    onModify: (index: number) => void;
    onApproveAll: () => void;
    onRejectAll: () => void;
    theme?: 'cyan' | 'red';
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
    isOpen, onClose, results, onApprove, onReject, onModify, onApproveAll, onRejectAll, theme = 'cyan'
}) => {
    if (!isOpen || results.length === 0) return null;

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'border-cyan-500/30 bg-cyan-950/20';
        if (action.includes('DELETE')) return 'border-red-500/30 bg-red-950/20';
        if (action.includes('UPDATE')) return 'border-amber-500/30 bg-amber-950/20';
        return 'border-slate-800 bg-slate-900';
    };

    const renderDetails = (result: AiParseResult) => {
        if (result.action === 'CREATE_TASK' && result.taskData) {
            return (
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                    <div className="font-bold text-white text-sm">"{result.taskData.title}"</div>
                    <div className="flex gap-4 opacity-80">
                         {result.taskData.dueDate && <span>📅 {result.taskData.dueDate} {result.taskData.dueTime}</span>}
                         {result.taskData.priority && <span className="uppercase text-amber-400">⚠ {result.taskData.priority}</span>}
                    </div>
                    {/* Corrected project to projectId */}
                    {result.taskData.projectId && <div className="text-cyan-400">PRJ: {result.taskData.projectId}</div>}
                    {result.taskData.details && <div className="italic text-slate-500">"{result.taskData.details}"</div>}
                </div>
            );
        }
        if (result.action === 'CREATE_EVENT' && result.eventData) {
            return (
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                    <div className="font-bold text-yellow-400 text-sm">EVENT: "{result.eventData.title}"</div>
                    <div className="opacity-80">
                         start: {new Date(result.eventData.startTime).toLocaleString()}<br/>
                         end: {new Date(result.eventData.endTime).toLocaleString()}
                    </div>
                </div>
            );
        }
        if (result.action === 'UPDATE_MEMORY' && result.memoryData) {
             return (
                 <div className="text-xs text-slate-300 font-mono">
                     <span className={result.memoryData.operation === 'add' ? 'text-green-400' : 'text-red-400 uppercase font-bold'}>
                         {result.memoryData.operation.toUpperCase()}
                     </span>: "{result.memoryData.fact}"
                 </div>
             );
        }
        // Added noteData handling
        if (result.action === 'CREATE_NOTE' && result.noteData) {
             return (
                 <div className="text-xs text-slate-300 font-mono">
                     <div className="font-bold text-white">Note: {result.noteData.title}</div>
                     <div className="italic opacity-70 truncate">{result.noteData.content}</div>
                 </div>
             );
        }
        // Added folderData handling
        if (result.action === 'CREATE_FOLDER' && result.folderData) {
            return <div className="text-xs text-slate-300 font-mono">Folder: {result.folderData.name}</div>;
        }
        if (result.action === 'DELETE_TASK') {
            return <div className="text-xs text-red-300 font-mono">Delete Protocol ID: {result.taskData?.id}</div>;
        }
        if (result.action === 'UPDATE_TASK') {
            return <div className="text-xs text-amber-300 font-mono">Update Protocol ID: {result.taskData?.id}</div>;
        }
        return <div className="text-xs text-slate-500 italic">Data payload ready.</div>;
    };

    const borderColor = theme === 'red' ? 'border-red-500' : 'border-green-500';
    const textColor = theme === 'red' ? 'text-red-500' : 'text-green-500';
    const bgColor = theme === 'red' ? 'bg-red-950/30' : 'bg-green-950/20';
    const pulseColor = theme === 'red' ? 'bg-red-500' : 'bg-green-500';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className={`bg-slate-950 border-2 ${borderColor} w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col max-h-[85vh] animate-fade-in-up clip-hud-corner`}>
                
                {/* Header */}
                <div className={`p-4 border-b ${borderColor} ${bgColor} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${pulseColor} rounded-full animate-pulse`}></div>
                        <h2 className={`${textColor} font-tech font-bold tracking-[0.2em] text-lg uppercase`}>
                            Protocol Authorization
                        </h2>
                    </div>
                    <div className={`text-[10px] ${textColor} font-mono uppercase tracking-widest`}>
                        {results.length} Pending Directive{results.length > 1 ? 's' : ''}
                    </div>
                </div>

                {/* Content List */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-3 flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {results.map((res, idx) => (
                        <div key={idx} className={`p-3 border rounded-sm flex gap-4 ${getActionColor(res.action)}`}>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-black ${res.action.includes('DELETE') ? 'bg-red-500' : 'bg-cyan-500'}`}>
                                            {res.action.replace('_', ' ')}
                                        </span>
                                        {res.usedModel && (
                                            <span className="text-[9px] font-mono text-slate-500 border border-slate-700 px-1 rounded">
                                                SRC: {res.usedModel}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {renderDetails(res)}
                            </div>
                            
                            <div className="flex flex-col gap-2 shrink-0 justify-center border-l border-white/10 pl-3">
                                <button 
                                    onClick={() => onApprove(idx)}
                                    className="px-3 py-1.5 bg-green-900/40 hover:bg-green-500 hover:text-black text-green-400 border border-green-700 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Authorize
                                </button>
                                {(res.action === 'CREATE_TASK' || res.action === 'CREATE_EVENT') && (
                                    <button 
                                        onClick={() => onModify(idx)}
                                        className="px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-700 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Modify
                                    </button>
                                )}
                                <button 
                                    onClick={() => onReject(idx)}
                                    className="px-3 py-1.5 bg-red-900/40 hover:bg-red-500 hover:text-black text-red-400 border border-red-700 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Global Actions */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-between items-center gap-4">
                     <button 
                        onClick={onRejectAll}
                        className="flex-1 py-3 border border-red-900/50 text-red-500 hover:bg-red-950/50 text-xs font-bold uppercase tracking-widest transition-colors clip-hud-panel"
                     >
                        Abort All Sequences
                     </button>
                     <button 
                        onClick={onApproveAll}
                        className={`flex-1 py-3 ${theme === 'red' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-black text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)] clip-hud-panel`}
                     >
                        Execute All
                     </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;
