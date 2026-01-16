import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Icons } from '../constants.tsx';
import { UserAccount, VoiceSession } from '../types.ts';

interface VoiceInterfaceProps {
  account: UserAccount;
  onUpdateVoiceSessions: (sessions: VoiceSession[]) => void;
  activeLogId?: string | null;
}

type VoicePersona = 'Vivaan' | 'Suchita';

interface LogEntry {
  role: 'ai' | 'user';
  text: string;
  isTyped?: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ account, onUpdateVoiceSessions, activeLogId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [persona, setPersona] = useState<VoicePersona>(account.settings.voice);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<VoiceSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLogId) {
      const log = account.voiceSessions?.find(s => s.id === activeLogId);
      if (log) {
        setSelectedSession(log);
        if (isActive) stopVoiceSession();
      }
    } else {
      setSelectedSession(null);
    }
  }, [activeLogId, account.voiceSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentLogs, isActive]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const startVoiceSession = async () => {
    if (isActive) { stopVoiceSession(); return; }
    window.location.hash = '#/voice';
    setIsConnecting(true);
    setError(null);
    setCurrentLogs([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const voiceName = persona === 'Vivaan' ? 'Charon' : 'Kore';
      const brainContext = account.notes.length > 0 
        ? `NEURAL BRAIN PROTOCOLS:\n${account.notes.map(n => `- ${n.content}`).join('\n')}`
        : "NEURAL BRAIN: EMPTY";

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setCurrentLogs(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'ai') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'ai', text }];
              });
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setCurrentLogs(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user' && !last.isTyped) {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'user', text }];
              });
            }
          },
          onerror: (e: any) => { 
            console.error(e); 
            setError("Link interrupted. Reconnecting might help.");
            stopVoiceSession(); 
          },
          onclose: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } } },
          systemInstruction: `You are MAGIC AI. Hyper-intelligent neural assistant. Persona: Analytical and efficient. Speak in ${account.settings.language}. ${brainContext}`,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { 
      setIsConnecting(false); 
      setError("Permissions denied or neural link failure.");
    }
  };

  const stopVoiceSession = () => {
    if (sessionRef.current) { try { sessionRef.current.close(); } catch(e) {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    
    if (currentLogs.length > 0) {
      const transcript = currentLogs.map(l => `[${l.role.toUpperCase()}]: ${l.text}`).join('\n');
      if (transcript.length > 20) {
        const newSession: VoiceSession = {
          id: Date.now().toString(),
          title: `Voice Log @ ${new Date().toLocaleTimeString()}`,
          transcript,
          timestamp: Date.now()
        };
        onUpdateVoiceSessions([newSession, ...(account.voiceSessions || [])]);
      }
    }

    sessionRef.current = null;
    setIsActive(false);
    setIsConnecting(false);
    setCurrentLogs([]);
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleSendText = () => {
    if (!textInput.trim() || !sessionRef.current) return;
    try {
      sessionRef.current.sendRealtimeInput({ text: textInput.trim() });
      setCurrentLogs(prev => [...prev, { role: 'user', text: textInput.trim(), isTyped: true }]);
      setTextInput('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#050510] relative overflow-hidden">
      <div className={`fixed md:relative z-[501] h-full w-72 border-r border-white/5 bg-[#0a0a20] p-6 flex flex-col space-y-6 transform transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-black hero-font text-purple-400 uppercase tracking-widest">Temporal Logs</h3>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-white/50">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {account.voiceSessions?.length === 0 ? (
            <div className="p-8 text-center opacity-20 hero-font text-[9px] uppercase italic">Memory Empty</div>
          ) : (
            account.voiceSessions?.map(session => (
              <a 
                key={session.id} 
                href={`#/voice/${session.id}`}
                onClick={() => { setIsSidebarOpen(false); if(isActive) stopVoiceSession(); }} 
                className={`block w-full p-4 rounded-2xl text-left transition-all border-2 ${selectedSession?.id === session.id ? 'bg-purple-600 border-white text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:border-lime-500/50'}`}
              >
                <div className="font-bold truncate text-[10px] uppercase tracking-wider">{session.title}</div>
                <div className="text-[8px] opacity-40 uppercase mt-1">{new Date(session.timestamp).toLocaleDateString()}</div>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">📜</button>
          <div className="flex gap-2">
             <button onClick={() => setPersona('Vivaan')} className={`px-4 py-2 rounded-xl text-[9px] font-black hero-font transition-all ${persona === 'Vivaan' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>👦 VIVAAN</button>
             <button onClick={() => setPersona('Suchita')} className={`px-4 py-2 rounded-xl text-[9px] font-black hero-font transition-all ${persona === 'Suchita' ? 'bg-pink-600 text-white' : 'text-slate-500'}`}>👧 SUCHITA</button>
          </div>
          {isActive ? (
            <button onClick={stopVoiceSession} className="px-4 py-2 bg-red-600 text-white font-black hero-font text-[9px] rounded-xl animate-pulse uppercase">DISCONNECT</button>
          ) : <div className="w-20"></div>}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scrollbar-thin pb-40">
          {selectedSession ? (
            <div className="max-w-4xl mx-auto w-full space-y-6 animate-in zoom-in duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black hero-font italic text-lime-500 uppercase">{selectedSession.title}</h2>
                  <a href="#/voice" className="text-[9px] hero-font font-black px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 uppercase transition-colors flex items-center justify-center">Close Log</a>
               </div>
               <div className="space-y-6">
                  {selectedSession.transcript.split('\n').map((line, idx) => {
                    const isAI = line.includes('[AI]');
                    return (
                      <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-6 rounded-[2rem] text-lg font-bold shadow-xl ${isAI ? 'bg-[#0f0f2a] text-white border border-white/5 rounded-bl-none' : 'bg-purple-600 text-white rounded-br-none'}`}>
                          <span className="block text-[8px] hero-font opacity-40 mb-2 uppercase tracking-widest">{isAI ? 'MAGIC AI' : 'USER'}</span>
                          {line.split(']:')[1]?.trim() || line}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : !isActive && !isConnecting ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-1000">
              <button onClick={startVoiceSession} className="group relative w-64 h-64 flex flex-col items-center justify-center">
                 <div className="absolute inset-0 bg-lime-500 rounded-[4rem] blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
                 <div className="w-full h-full rounded-[5rem] bg-[#0f0f2a] border-4 border-lime-500/20 flex items-center justify-center text-8xl shadow-2xl group-hover:scale-105 transition-transform duration-500">🎙️</div>
                 <p className="mt-8 hero-font font-black text-lime-500 uppercase tracking-[0.5em] text-sm animate-pulse">Initialize Link</p>
              </button>
              {error && <p className="text-red-500 font-black hero-font text-[10px] uppercase tracking-widest">{error}</p>}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6">
               {currentLogs.map((log, idx) => (
                 <div key={idx} className={`flex ${log.role === 'ai' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-4 duration-300`}>
                   <div className={`max-w-[85%] p-6 rounded-[2rem] text-lg font-bold shadow-2xl ${log.role === 'ai' ? 'bg-[#0f0f2a] border border-lime-500/20 text-white rounded-bl-none' : 'bg-purple-600 text-white rounded-br-none'}`}>
                     <span className="block text-[9px] hero-font opacity-40 mb-2 uppercase tracking-widest">{log.role === 'ai' ? 'STREAMING_AI' : 'USER_INPUT'}</span>
                     {log.text}
                   </div>
                 </div>
               ))}
               {isConnecting && (
                 <div className="flex flex-col items-center justify-center p-20 gap-4 animate-pulse">
                    <Icons.Loader />
                    <span className="hero-font text-[10px] font-black uppercase text-purple-500 tracking-[0.4em]">Bridging Synapses...</span>
                 </div>
               )}
            </div>
          )}
        </div>

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 bg-gradient-to-t from-[#050510] via-[#050510]/95 to-transparent z-40">
            <div className="max-w-3xl mx-auto w-full bg-[#10102a]/90 border-2 border-white/5 rounded-[2.5rem] p-3 flex items-center gap-4 shadow-2xl focus-within:border-lime-500/50 transition-all backdrop-blur-2xl">
              <input 
                type="text" 
                value={textInput} 
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                placeholder="Direct neural injection..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-white font-black text-xl px-6 py-2"
              />
              <button onClick={handleSendText} className="p-5 bg-lime-500 text-black rounded-2xl hover:scale-110 active:scale-95 transition-transform shadow-lg">💬</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;