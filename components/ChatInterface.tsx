import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Icons } from '../constants.tsx';
import { ChatMessage, ChatSession, UserAccount, GroundingSource, Note } from '../types.ts';

interface ChatInterfaceProps {
  account: UserAccount;
  onUpdateSessions: (sessions: ChatSession[]) => void;
  onUpdateNotes: (notes: Note[]) => void;
  onError?: (err: any) => void;
  activeSessionId?: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ account, onUpdateSessions, onUpdateNotes, onError, activeSessionId: externalSessionId }) => {
  const [internalSessionId, setInternalSessionId] = useState(externalSessionId || account.sessions[0]?.id || '');
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [timezoneShort, setTimezoneShort] = useState('');
  const [committingId, setCommittingId] = useState<string | null>(null);
  
  const [streamedText, setStreamedText] = useState('');
  const [streamedSources, setStreamedSources] = useState<GroundingSource[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalSessionId) setInternalSessionId(externalSessionId);
  }, [externalSessionId]);

  const activeSession = account.sessions.find(s => s.id === internalSessionId) || account.sessions[0];

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const time = now.toLocaleTimeString([], { 
          timeZone: account.settings.timezone,
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        setCurrentTime(time);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: account.settings.timezone,
          timeZoneName: 'short'
        }).formatToParts(now);
        const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
        setTimezoneShort(tzPart);
      } catch (e) {
        setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setTimezoneShort('LOC');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [account.settings.timezone]);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      if (bottomAnchorRef.current) bottomAnchorRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [streamedText, isGenerating, internalSessionId, activeSession?.messages.length]);

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const filtered = account.sessions.filter(s => s.id !== sessionId);
    onUpdateSessions(filtered);
    if (internalSessionId === sessionId && filtered.length > 0) {
      window.location.hash = `#/chat/${filtered[0].id}`;
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeSession) return;
    const updatedMessages = activeSession.messages.filter(m => m.id !== messageId);
    onUpdateSessions(account.sessions.map(s => s.id === activeSession.id ? { ...s, messages: updatedMessages } : s));
  };

  const handleSaveToNotebook = (msg: ChatMessage) => {
    const text = msg.parts.find(p => p.text)?.text;
    if (!text) return;
    setCommittingId(msg.id);
    const newNote: Note = { id: `note-${Date.now()}`, content: `COMMITTED FROM CHAT: ${text}`, timestamp: Date.now(), source: 'chat' };
    setTimeout(() => {
      onUpdateNotes([newNote, ...account.notes]);
      setCommittingId(null);
    }, 800);
  };

  const handleSendMessage = async () => {
    const textToSend = input.trim();
    if ((!textToSend && !attachedImage) || isGenerating || !activeSession) return;
    const currentSessionId = activeSession.id;
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      parts: [
        ...(attachedImage ? [{ inlineData: { mimeType: imageMime, data: attachedImage.split(',')[1] } }] : []),
        { text: textToSend }
      ],
      timestamp: new Date()
    };
    const history = activeSession.messages.map(m => ({ role: m.role, parts: m.parts }));
    const updatedMessages = [...activeSession.messages, userMessage];
    onUpdateSessions(account.sessions.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, lastTimestamp: Date.now() } : s));
    setInput('');
    setAttachedImage(null);
    setStreamedText('');
    setStreamedSources([]);
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const now = new Date();
      const timezone = account.settings.timezone;
      const timeStr = now.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const brainContext = account.notes.length > 0 
        ? `### NEURAL BRAIN PROTOCOL ###\n${account.notes.map((n, i) => `[SYSTEM_RULE_${i+1}]: ${n.content}`).join('\n')}`
        : "NEURAL BRAIN: UNCONFIGURED.";
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: userMessage.parts }],
        config: {
          systemInstruction: `You are MAGIC AI. Hyper-intelligent assistant. ${brainContext}\n\nTime: ${timeStr}\nLocation: ${account.settings.location}\nLanguage: ${account.settings.language}. Be detailed and precise. Use Google Search for facts.`,
          tools: [{ googleSearch: {} }],
        }
      });
      let fullText = '';
      let collectedSources: GroundingSource[] = [];
      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullText += chunkText;
        setStreamedText(fullText);
        const groundings = (chunk as GenerateContentResponse).candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundings) {
          const newSources = groundings.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
          collectedSources = [...new Map([...collectedSources, ...newSources].map(item => [item.uri, item])).values()];
          setStreamedSources(collectedSources);
        }
      }
      const modelMessage: ChatMessage = { id: `m-${Date.now()}`, role: 'model', parts: [{ text: fullText }], timestamp: new Date(), sources: collectedSources, isGenerating: false };
      onUpdateSessions(account.sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, modelMessage] } : s));
    } catch (error: any) {
      if (onError) onError(error);
      const isQuota = JSON.stringify(error).toLowerCase().includes('quota') || error.status === 429;
      const errorMsg = isQuota ? "CRITICAL: NEURAL QUOTA DEPLETED." : "FATAL: LINK INTERRUPTED.";
      const errorModelMsg: ChatMessage = { id: `e-${Date.now()}`, role: 'model', parts: [{ text: errorMsg }], timestamp: new Date() };
      onUpdateSessions(account.sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...updatedMessages, errorModelMsg] } : s));
    } finally {
      setIsGenerating(false);
      setStreamedText('');
      setStreamedSources([]);
    }
  };

  const createNewSession = () => {
    const newId = `s-${Date.now()}`;
    onUpdateSessions([{ id: newId, title: 'NEW SESSION', messages: [], lastTimestamp: Date.now() }, ...account.sessions]);
    window.location.hash = `#/chat/${newId}`;
  };

  return (
    <div className="flex h-full w-full bg-[#050510] relative overflow-hidden flex-row font-sans selection:bg-lime-500 selection:text-black">
      <div className={`md:hidden fixed inset-0 bg-black/90 backdrop-blur-2xl z-[400] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      <div className={`fixed md:relative z-[410] h-full transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0a0a20] flex flex-col overflow-hidden ${isSidebarOpen ? 'w-72 p-6' : 'w-0 md:w-0 p-0 overflow-hidden border-none'}`}>
        <div className="flex flex-col space-y-6 h-full min-w-[240px]">
          <button onClick={createNewSession} className="w-full py-5 bg-lime-500 text-black font-black hero-font text-[10px] uppercase italic rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shrink-0">➕ NEW CHAT LINK</button>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {account.sessions.map(session => (
              <div key={session.id} className="group relative">
                <a href={`#/chat/${session.id}`} onClick={() => { if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`block w-full p-4 pr-12 rounded-2xl text-left transition-all border-2 ${internalSessionId === session.id ? 'bg-purple-600 border-white text-white shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-400 hover:border-lime-500/50'}`}>
                  <div className="font-bold truncate text-[10px] uppercase tracking-widest leading-none">{session.title}</div>
                  <div className="text-[8px] opacity-40 uppercase mt-2 font-black">{new Date(session.lastTimestamp).toLocaleTimeString()}</div>
                </a>
                <button onClick={(e) => handleDeleteSession(e, session.id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Icons.Trash /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 flex items-center px-4 md:px-8 border-b border-white/5 shrink-0 bg-[#050510]/80 backdrop-blur-xl z-20 justify-between">
          <div className="flex items-center overflow-hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl mr-4 text-lime-500 border border-white/10 transition-colors"><Icons.Sidebar /></button>
            <div className="flex flex-col min-w-0">
               <h2 className="text-[11px] font-black hero-font text-lime-500 uppercase tracking-[0.2em] truncate">{activeSession?.title}</h2>
               <span className="text-[7px] text-white/30 uppercase font-black tracking-widest">NEURAL LINK: SECURE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <div className="text-[7px] font-black text-lime-500/50 tracking-tighter uppercase whitespace-nowrap bg-black/20 px-2 py-0.5 rounded border border-white/5">
                {currentTime} <span className="text-white/30">{timezoneShort}</span> • {account.settings.location}
              </div>
            </div>
          </div>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scrollbar-thin scroll-smooth">
           {(activeSession?.messages.length === 0 || !activeSession) && !isGenerating ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40 animate-in zoom-in duration-700">
               <span className="text-8xl mb-6 filter drop-shadow-[0_0_20px_rgba(162,255,0,0.5)]">🪄</span>
               <p className="hero-font font-black uppercase text-2xl tracking-[0.4em] text-white">Neural Engine Ready</p>
               <p className="text-[10px] uppercase font-bold text-lime-500 mt-4 tracking-[0.3em]">Inject directive to begin processing</p>
             </div>
           ) : (
             <div className="max-w-4xl mx-auto w-full space-y-12 pb-20">
               {activeSession?.messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-6 duration-500 group/msg`}>
                   <div className="max-w-[95%] md:max-w-[85%] relative">
                     <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -top-4 -right-4 md:-right-6 p-2 bg-red-600/90 text-white rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity z-10 shadow-lg hover:scale-110 active:scale-90"><Icons.Trash /></button>
                     <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none ring-4 ring-white/10' : 'bg-[#0f0f2a] border-2 border-white/5 text-white rounded-bl-none'}`}>
                       <div className="flex justify-between items-start mb-6">
                        <span className="text-[8px] hero-font font-black uppercase tracking-[0.4em] opacity-40">{msg.role === 'user' ? 'AUTH: HUMAN_USER' : 'AUTH: MAGIC_AI'}</span>
                        {msg.role === 'model' && <button onClick={() => handleSaveToNotebook(msg)} className={`p-2 rounded-xl transition-all ${committingId === msg.id ? 'bg-lime-500 text-black animate-ping' : 'bg-white/5 text-lime-500 hover:bg-lime-500 hover:text-black'} border border-white/10`}><Icons.Sparkles /></button>}
                       </div>
                       {msg.parts.map((part, i) => (
                         <div key={i} className="space-y-6">
                           {part.inlineData && <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="rounded-3xl max-h-[500px] border-4 border-white/10 w-full object-contain bg-black shadow-2xl mb-8" alt="Visual Telemetry" />}
                           {part.text && <div className="text-base md:text-xl font-bold whitespace-pre-wrap leading-relaxed tracking-tight text-white">{part.text}</div>}
                         </div>
                       ))}
                       {msg.sources && msg.sources.length > 0 && (
                         <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {msg.sources.map((s, idx) => (
                             <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-transparent hover:border-lime-500 hover:bg-white/10 transition-all group">
                               <div className="w-8 h-8 shrink-0 bg-lime-500 rounded-xl flex items-center justify-center text-black font-black text-xs shadow-lg">{idx+1}</div>
                               <div className="min-w-0">
                                 <div className="text-[10px] font-black uppercase truncate text-slate-100">{s.title}</div>
                                 <div className="text-[8px] font-bold opacity-30 truncate group-hover:opacity-60 transition-opacity">{s.uri}</div>
                               </div>
                             </a>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
               {isGenerating && (
                 <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                   <div className="max-w-[95%] md:max-w-[85%]">
                     <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-[#0f0f2a] border-2 border-lime-500/20 text-white rounded-bl-none shadow-2xl shadow-lime-500/10">
                        <span className="block text-[8px] hero-font font-black uppercase tracking-[0.4em] mb-6 text-lime-500 animate-pulse">PROCESSING_REALTIME_STREAM</span>
                        {streamedText ? <div className="text-base md:text-xl font-bold whitespace-pre-wrap leading-relaxed tracking-tight text-white">{streamedText}<span className="inline-block w-2 h-5 ml-2 bg-lime-500 animate-pulse shadow-[0_0_10px_#a2ff00] align-middle" /></div> : <div className="flex gap-2 py-4"><div className="w-3 h-3 bg-lime-500 rounded-full animate-bounce"></div><div className="w-3 h-3 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-3 h-3 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div></div>}
                     </div>
                   </div>
                 </div>
               )}
               <div ref={bottomAnchorRef} className="h-20 w-full" />
             </div>
           )}
        </div>
        <div className="p-4 md:p-10 bg-gradient-to-t from-[#050510] via-[#050510]/95 to-transparent z-10 border-t border-white/5">
           <div className="max-w-4xl mx-auto w-full bg-[#10102a] border-2 border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-3 flex items-center gap-2 md:gap-4 focus-within:border-lime-500 transition-all shadow-2xl ring-1 ring-white/5 backdrop-blur-3xl">
             <button onClick={() => fileInputRef.current?.click()} className="p-4 md:p-6 text-slate-400 hover:text-lime-500 hover:scale-110 active:scale-90 transition-all rounded-[1.5rem] bg-white/5 border border-white/5"><Icons.Paperclip /></button>
             <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setAttachedImage(ev.target?.result as string); setImageMime(file.type); }; reader.readAsDataURL(file); } }} />
             <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Enter high-priority directive..." className="flex-1 bg-transparent border-none focus:ring-0 text-white font-black text-base md:text-2xl py-4 resize-none max-h-40 placeholder-white/10" rows={1} />
             <button onClick={handleSendMessage} disabled={isGenerating || (!input.trim() && !attachedImage)} className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] transition-all flex items-center justify-center min-w-[60px] md:min-w-[80px] ${isGenerating || (!input.trim() && !attachedImage) ? 'bg-white/5 text-white/10' : 'bg-lime-500 text-black hover:scale-[1.05] active:scale-90 shadow-[0_0_40px_rgba(162,255,0,0.5)]'}`}>{isGenerating ? <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div> : <Icons.Send />}</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;