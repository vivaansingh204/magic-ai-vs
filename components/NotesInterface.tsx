
import React, { useState, useMemo } from 'react';
import { Note } from '../types';

interface NotesInterfaceProps {
  notes: Note[];
  onUpdateNotes: (notes: Note[]) => void;
}

const NotesInterface: React.FC<NotesInterfaceProps> = ({ notes, onUpdateNotes }) => {
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: Date.now(),
      source: 'manual'
    };
    onUpdateNotes([note, ...notes]);
    setNewNote('');
  };

  const handleDeleteNote = (id: string) => {
    onUpdateNotes(notes.filter(n => n.id !== id));
  };

  const handleCopyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopyingId(id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => n.content.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  return (
    <div className="h-full w-full p-4 md:p-10 flex flex-col space-y-8 animate-in fade-in zoom-in duration-500 overflow-hidden bg-white dark:bg-transparent">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-8 overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl hero-font font-black italic text-slate-900 dark:text-white tracking-tighter uppercase glow-text leading-none">
              NEURAL <span className="text-lime-500">NOTES</span>
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-3">
              <span className="w-2 h-2 bg-lime-500 rounded-full animate-ping"></span>
              Syncing: {notes.length} Active Memories
            </p>
          </div>

          <div className="w-full md:w-96 relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH NEURAL BRAIN..."
              className="w-full bg-slate-100 dark:bg-[#101025] border-2 border-purple-500/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-black hero-font text-xs outline-none focus:border-lime-500 transition-all shadow-xl"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-slate-50 dark:bg-[#101025] border-4 border-purple-500/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-6 relative shrink-0">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Inject manual directive or observation..."
            className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white text-lg md:text-2xl font-black placeholder-slate-300 dark:placeholder-white/5 resize-none h-32 md:h-40 leading-relaxed"
          />
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/5">
            <span className="text-[10px] font-black hero-font text-slate-400 dark:text-white/20 uppercase tracking-[0.4em]">Auth: Persistent Brain Link</span>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-8 py-4 bg-lime-500 text-black font-black hero-font text-sm uppercase italic rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl disabled:opacity-30"
            >
              COMMIT LOG ⚡
            </button>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
                <span className="text-8xl mb-4">🧠</span>
                <p className="hero-font font-black uppercase text-xl tracking-[0.5em]">No Data Found</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div key={note.id} className="bg-white dark:bg-[#151525] border-2 border-slate-100 dark:border-white/5 p-6 rounded-[2rem] relative group hover:border-lime-500/50 hover:shadow-[0_0_30px_rgba(162,255,0,0.1)] transition-all animate-in slide-in-from-bottom-4 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${note.source === 'chat' ? 'bg-blue-500/10 text-blue-500' : 'bg-lime-500/10 text-lime-600 dark:text-lime-400'}`}>
                      {note.source === 'chat' ? 'CHAT SYNC' : 'MANUAL INJECT'}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopyToClipboard(note.content, note.id)}
                        className={`p-2 rounded-xl transition-all border ${copyingId === note.id ? 'bg-blue-500 text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 border-transparent'}`}
                        title="Copy to Clipboard"
                      >
                        {copyingId === note.id ? '✓' : '📋'}
                      </button>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 bg-red-500/5 dark:bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity border border-transparent hover:border-red-500/20"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-800 dark:text-white text-base md:text-lg font-black leading-snug tracking-tight">
                    {note.content}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div className="text-[8px] text-slate-400 hero-font font-black uppercase tracking-widest">
                      ID: {note.id.slice(-6)}
                    </div>
                    <div className="text-[8px] text-slate-400 hero-font font-black uppercase tracking-widest">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesInterface;
