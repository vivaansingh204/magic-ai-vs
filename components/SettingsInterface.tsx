import React, { useState, useEffect } from 'react';
import { AccountSettings } from '../types.ts';

const COMMON_TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Africa/Cairo", "Asia/Dubai",
  "Asia/Kolkata", "Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"
];

const LOCATION_TO_TZ_MAP: Record<string, string> = {
  "london": "Europe/London", "uk": "Europe/London", "new york": "America/New_York", "usa": "America/New_York",
  "california": "America/Los_Angeles", "tokyo": "Asia/Tokyo", "japan": "Asia/Tokyo", "paris": "Europe/Paris",
  "france": "Europe/Paris", "berlin": "Europe/Berlin", "germany": "Europe/Berlin", "india": "Asia/Kolkata",
  "delhi": "Asia/Kolkata", "mumbai": "Asia/Kolkata", "noida": "Asia/Kolkata", "sydney": "Australia/Sydney",
  "dubai": "Asia/Dubai", "uae": "Asia/Dubai"
};

const OPTIMIZE_LOGS = [
  "SCANNING BROWSER CACHE...",
  "DEFRAGMENTING LOCALSTORAGE TABLES...",
  "RE-INDEXING CHAT EMBEDDINGS...",
  "VERIFYING RSA KEY INTEGRITY...",
  "CALIBRATING NEURAL LATENCY...",
  "OPTIMIZATION COMPLETE: SYSTEM STABLE."
];

interface SettingsInterfaceProps {
  settings: AccountSettings;
  onUpdate: (newSettings: AccountSettings) => void;
}

const SettingsInterface: React.FC<SettingsInterfaceProps> = ({ settings, onUpdate }) => {
  const [locInput, setLocInput] = useState(settings.location);
  const [isSynced, setIsSynced] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optStep, setOptStep] = useState(0);

  useEffect(() => {
    setLocInput(settings.location);
  }, [settings.location]);

  const handleLocationUpdate = () => {
    let inferredTZ = settings.timezone;
    const lowerLoc = locInput.toLowerCase();
    
    for (const [keyword, tz] of Object.entries(LOCATION_TO_TZ_MAP)) {
      if (lowerLoc.includes(keyword)) {
        inferredTZ = tz;
        break;
      }
    }

    onUpdate({ ...settings, location: locInput, timezone: inferredTZ });
    setIsSynced(true);
    setTimeout(() => setIsSynced(false), 2000);
  };

  const handleOptimize = () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setOptStep(0);
    
    const interval = setInterval(() => {
      setOptStep(prev => {
        if (prev >= OPTIMIZE_LOGS.length - 1) {
          clearInterval(interval);
          setTimeout(() => setIsOptimizing(false), 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  const clearStorage = () => {
    if (confirm("CRITICAL WARNING: This will permanently delete ALL locally stored profiles, chat sessions, and notes. This cannot be undone. Purge now?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const localNodeId = `node-v3-${Math.random().toString(36).substring(7).toUpperCase()}`;

  return (
    <div className="h-full w-full overflow-y-auto bg-white dark:bg-transparent transition-colors duration-500 scrollbar-thin pb-20">
      <div className="max-w-4xl mx-auto w-full p-6 md:p-12 flex flex-col space-y-12 animate-in fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-6xl font-black italic hero-font text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            SYSTEM <span className="text-lime-500">CONTROL</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-[0.4em]">NEURAL CORE PARAMETERS</p>
        </div>

        <section className="p-8 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border-2 border-white/5 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <h3 className="text-xl font-black hero-font uppercase text-slate-900 dark:text-white">Grounding Location</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={locInput} 
                onChange={(e) => setLocInput(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="flex-1 bg-white dark:bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-lime-500 transition-all"
              />
              <button 
                onClick={handleLocationUpdate}
                className={`px-8 py-4 font-black hero-font uppercase italic rounded-2xl transition-all shadow-lg min-w-[140px] ${isSynced ? 'bg-blue-500 text-white' : 'bg-lime-500 text-black hover:scale-105'}`}
              >
                {isSynced ? 'SAVED ✓' : 'SYNC DATA'}
              </button>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Temporal Synchronization</label>
            <select 
              value={settings.timezone}
              onChange={(e) => onUpdate({ ...settings, timezone: e.target.value })}
              className="w-full bg-white dark:bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none focus:border-lime-500 transition-all cursor-pointer appearance-none"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="p-8 bg-slate-50 dark:bg-[#0a0a20] rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
          <h3 className="font-black hero-font uppercase text-slate-400 text-xs text-center">SYSTEM MAINTENANCE</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={`group relative py-6 bg-purple-600 text-white font-black hero-font text-xs uppercase italic rounded-2xl hover:bg-purple-500 transition-all active:scale-95 shadow-lg overflow-hidden ${isOptimizing ? 'opacity-50' : ''}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isOptimizing ? 'OPTIMIZING...' : 'RECALIBRATE ENGINE ⚡'}
              </span>
            </button>
            <button 
              onClick={clearStorage}
              className="py-6 bg-red-600/10 border border-red-600/20 text-red-500 font-black hero-font text-xs uppercase italic rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              PURGE LOCAL SYNC 🗑️
            </button>
          </div>
          {isOptimizing && (
            <div className="mt-4 bg-black/60 p-4 rounded-xl border border-lime-500/30 font-mono text-[9px] text-lime-500 space-y-1">
              {OPTIMIZE_LOGS.slice(0, optStep + 1).map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="p-8 bg-slate-50 dark:bg-[#0a0a20] rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
            <h3 className="font-black hero-font uppercase text-slate-400 text-xs text-center">INTERFACE THEME</h3>
            <div className="flex gap-2">
              {['light', 'dark'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => onUpdate({ ...settings, theme: t as any })} 
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${settings.theme === t ? 'bg-lime-500 border-white text-black scale-[1.03] shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500'}`}
                >
                  {t} MODE
                </button>
              ))}
            </div>
          </section>

          <section className="p-8 bg-slate-50 dark:bg-[#0a0a20] rounded-[2rem] border border-white/5 space-y-6 shadow-xl">
            <h3 className="font-black hero-font uppercase text-slate-400 text-xs text-center">SYNTH PERSONA</h3>
            <div className="flex gap-2">
              {['Vivaan', 'Suchita'].map((v) => (
                <button 
                  key={v} 
                  onClick={() => onUpdate({ ...settings, voice: v as any })} 
                  className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${settings.voice === v ? 'bg-blue-600 border-white text-white scale-[1.03] shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500'}`}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="pt-20 text-center space-y-4 opacity-50">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-lime-500 to-transparent mx-auto mb-6"></div>
          <p className="hero-font font-black text-[14px] uppercase tracking-[1em] text-white">MAGIC AI</p>
          <p className="text-[10px] font-black hero-font text-lime-500 uppercase tracking-[0.3em] animate-pulse">MADE BY VIVAAN SINGH</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase mt-2">Node ID: {localNodeId}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsInterface;