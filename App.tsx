
import React, { useState, useEffect } from 'react';
import { AppMode, Language, UserAccount, ChatSession, AccountSettings, VoiceSession, Note, ChatMessage } from './types.ts';
import ChatInterface from './components/ChatInterface.tsx';
import VoiceInterface from './components/VoiceInterface.tsx';
import ImageGenerator from './components/ImageGenerator.tsx';
import NotesInterface from './components/NotesInterface.tsx';
import GameInterface from './components/GameInterface.tsx';
import SettingsInterface from './components/SettingsInterface.tsx';
import AccountInterface from './components/AccountInterface.tsx';
import SketchMaster from './components/SketchMaster.tsx';

const TAGLINES = [
  "NEURAL BRAIN: GOVERNING LOGIC ACTIVE",
  "IDENTITY PROTOCOL: IMMUTABLE",
  "REALISM CALIBRATION: STACKED",
  "INTELLIGENCE OPTIMIZED",
  "SEARCH-DRIVEN INSIGHTS",
  "HIGH-PERFORMANCE AI",
  "GROUNDING VERIFIED"
];

const GLOBAL_LOC_KEY = 'magic_ai_last_location';
const GLOBAL_TZ_KEY = 'magic_ai_last_timezone';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [globalError, setGlobalError] = useState<{ message: string; type: 'quota' | 'general' | 'info' | 'success' | 'auth' } | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key presence with a more robust check
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const aistudio = window.aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        try {
          const linked = await aistudio.hasSelectedApiKey();
          setHasApiKey(linked);
        } catch (e) {
          console.error("Link Check Error:", e);
        }
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleActivateKey = async () => {
    // @ts-ignore
    const aistudio = window.aistudio;
    
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setHasApiKey(true);
        window.location.hash = '#/chat';
        setGlobalError({ message: "MAGIC ENGINE ACTIVATED ⚡", type: 'success' });
        setTimeout(() => setGlobalError(null), 3000);
      } catch (err: any) {
        console.error("Activation Error:", err);
        setGlobalError({ message: "NEURAL BRIDGE FAILED: Try clicking again!", type: 'auth' });
      }
    } else {
      setGlobalError({ 
        message: "BRIDGE OFFLINE: Please ensure you are running in a Magic-compatible environment.", 
        type: 'general' 
      });
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  // Router Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const parts = hash.split('/');
      const primaryMode = parts[0] as AppMode;
      const subId = parts[1] || null;
      
      if (Object.values(AppMode).includes(primaryMode)) {
        setActiveMode(primaryMode);
        setActiveSubId(subId);
      } else if (!hash || hash === '') {
        setActiveMode(AppMode.CHAT);
        window.location.hash = '#/chat';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('magic_ai_profiles');
    const globalLoc = localStorage.getItem(GLOBAL_LOC_KEY) || 'London, UK';
    const globalTZ = localStorage.getItem(GLOBAL_TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let initialAccounts: UserAccount[] = [];

    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (parsed.length > 0) {
          initialAccounts = parsed.map(acc => ({
            ...acc,
            notes: acc.notes || [],
            settings: {
              ...acc.settings,
              location: acc.settings.location || globalLoc,
              timezone: acc.settings.timezone || globalTZ
            }
          }));
        }
      } catch (e) {
        console.error("Failed to parse accounts", e);
      }
    }

    if (initialAccounts.length === 0) {
      initialAccounts = [{
        id: '1',
        name: 'YOUNG PRODIGY',
        sessions: [{ id: 's1', title: 'WELCOME SESSION', messages: [], lastTimestamp: Date.now() }],
        voiceSessions: [],
        notes: [],
        settings: { 
          language: 'English', 
          theme: 'dark', 
          voice: 'Vivaan', 
          location: globalLoc,
          timezone: globalTZ
        }
      }];
    }

    setAccounts(initialAccounts);
    setCurrentId(initialAccounts[0].id);
  }, []);

  const account = accounts.find(a => a.id === currentId) || null;

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem('magic_ai_profiles', JSON.stringify(accounts));
    }
    if (account) {
      if (account.settings.location) localStorage.setItem(GLOBAL_LOC_KEY, account.settings.location);
      if (account.settings.timezone) localStorage.setItem(GLOBAL_TZ_KEY, account.settings.timezone);
      const isDark = account.settings.theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.body.style.backgroundColor = isDark ? '#050510' : '#f8fafc';
    }
  }, [accounts, account]);

  const handleError = (err: any) => {
    const errStr = JSON.stringify(err).toLowerCase();
    const isQuota = errStr.includes('quota') || err.status === 429;
    const isAuth = errStr.includes('api key') || errStr.includes('invalid') || errStr.includes('not found') || err.status === 401 || err.status === 403;

    if (isAuth) {
      setHasApiKey(false);
      setGlobalError({ message: "NEURAL LINK BROKEN: Please re-activate your engine.", type: 'auth' });
    } else if (isQuota) {
      setGlobalError({ message: "ENERGY DEPLETED: Engine cooling down (60s).", type: 'quota' });
      setTimeout(() => setGlobalError(null), 60000);
    } else {
      setGlobalError({ message: "CONNECTION INTERRUPTED.", type: 'general' });
      setTimeout(() => setGlobalError(null), 5000);
    }
  };

  const updateSettings = (newSettings: AccountSettings) => {
    if (currentId) setAccounts(prev => prev.map(a => a.id === currentId ? { ...a, settings: newSettings } : a));
  };

  const handleUpdateSessions = (sessions: ChatSession[]) => {
    if (currentId) setAccounts(prev => prev.map(a => a.id === currentId ? { ...a, sessions } : a));
  };

  const handleUpdateVoiceSessions = (voiceSessions: VoiceSession[]) => {
    if (currentId) setAccounts(prev => prev.map(a => a.id === currentId ? { ...a, voiceSessions } : a));
  };

  const handleUpdateNotes = (notes: Note[]) => {
    if (currentId) setAccounts(prev => prev.map(a => a.id === currentId ? { ...a, notes } : a));
  };

  const handleAddAccount = (name: string) => {
    const currentLoc = localStorage.getItem(GLOBAL_LOC_KEY) || 'London, UK';
    const currentTZ = localStorage.getItem(GLOBAL_TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const newAcc: UserAccount = {
      id: `acc-${Date.now()}`,
      name: name.toUpperCase(),
      sessions: [{ id: `s-${Date.now()}`, title: 'NEW LINK...', messages: [], lastTimestamp: Date.now() }],
      voiceSessions: [],
      notes: [],
      settings: { language: 'English', theme: 'dark', voice: 'Vivaan', location: currentLoc, timezone: currentTZ }
    };
    setAccounts(prev => [...prev, newAcc]);
    setCurrentId(newAcc.id);
    window.location.hash = `#/accounts/${newAcc.id}`;
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) return;
    const filtered = accounts.filter(a => a.id !== id);
    setAccounts(filtered);
    if (currentId === id) setCurrentId(filtered[0].id);
  };

  const renderContent = () => {
    if (!account) return null;
    const props = { account, onError: handleError };
    switch (activeMode) {
      case AppMode.VOICE: return <VoiceInterface account={account} onUpdateVoiceSessions={handleUpdateVoiceSessions} activeLogId={activeSubId} />;
      case AppMode.IMAGE_GEN: return <ImageGenerator />;
      case AppMode.DRAW: return <SketchMaster account={account} />;
      case AppMode.NOTES: return <NotesInterface notes={account.notes} onUpdateNotes={handleUpdateNotes} activeNoteId={activeSubId} />;
      case AppMode.GAME: return <GameInterface account={account} />;
      case AppMode.SETTINGS: return <SettingsInterface settings={account.settings} onUpdate={updateSettings} onActivateKey={handleActivateKey} hasApiKey={hasApiKey} />;
      case AppMode.ACCOUNTS: return (
        <AccountInterface 
          accounts={accounts} 
          currentId={currentId} 
          onSelectAccount={(id) => { setCurrentId(id); window.location.hash = '#/chat'; }} 
          onAddAccount={handleAddAccount} 
          onDeleteAccount={handleDeleteAccount} 
        />
      );
      default: return <ChatInterface {...props} onUpdateSessions={handleUpdateSessions} onUpdateNotes={handleUpdateNotes} activeSessionId={activeSubId} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen max-h-screen transition-colors duration-500 overflow-hidden ${account?.settings.theme === 'dark' ? 'bg-[#050510] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      {globalError && (
        <div className={`fixed top-0 left-0 right-0 z-[2000] py-4 px-6 text-center font-black hero-font text-[10px] uppercase shadow-2xl animate-in slide-in-from-top duration-300 ${
          globalError.type === 'success' ? 'bg-lime-500 text-black' : 
          globalError.type === 'quota' ? 'bg-yellow-500 text-black' : 
          globalError.type === 'info' ? 'bg-blue-600 text-white' : 
          globalError.type === 'auth' ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {globalError.message}
          {globalError.type === 'auth' && (
             <button onClick={handleActivateKey} className="ml-4 underline font-black">RE-ACTIVATE ENGINE</button>
          )}
        </div>
      )}

      <header className={`relative flex items-center justify-between px-4 md:px-8 py-4 border-b z-[500] transition-colors duration-500 ${account?.settings.theme === 'dark' ? 'bg-[#0a0a1a]/95 border-purple-500/10' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 transition-transform active:scale-90 text-xl">☰</button>
          <a href="#/chat" className="flex flex-col cursor-pointer">
            <h1 className="text-2xl font-black hero-font italic tracking-tighter leading-none">MAGIC <span className="text-lime-500">AI</span></h1>
            <span className="text-[9px] hero-font font-bold text-slate-400 tracking-[0.3em] uppercase">{TAGLINES[taglineIndex]}</span>
          </a>
        </div>

        <nav className={`hidden xl:flex items-center gap-1 p-1 rounded-2xl border ${account?.settings.theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
          <NavLink href="#/chat" active={activeMode === AppMode.CHAT} label="CHAT" icon="💬" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/image_gen" active={activeMode === AppMode.IMAGE_GEN} label="VISUALIZER" icon="⚡" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/draw" active={activeMode === AppMode.DRAW} label="SKETCH" icon="🖌️" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/voice" active={activeMode === AppMode.VOICE} label="VOICE" icon="🎙️" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/accounts" active={activeMode === AppMode.ACCOUNTS} label="PROFILES" icon="👤" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/game" active={activeMode === AppMode.GAME} label="ARCADE" icon="🎮" isDark={account?.settings.theme === 'dark'} />
          <NavLink href="#/notes" active={activeMode === AppMode.NOTES} label="NOTES" icon="📓" isDark={account?.settings.theme === 'dark'} />
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={!hasApiKey ? handleActivateKey : undefined}
            className={`hidden sm:flex px-3 py-1.5 rounded-full border text-[8px] font-black hero-font uppercase transition-all ${hasApiKey ? 'bg-lime-500/10 border-lime-500/50 text-lime-500 cursor-default' : 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse cursor-pointer hover:bg-red-600 hover:text-white hover:border-white'}`}
          >
             {hasApiKey ? 'NEURAL LINK: ACTIVE' : 'NEURAL LINK: OFFLINE (CLICK TO ACTIVATE)'}
          </button>
          <a href="#/settings" className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${activeMode === AppMode.SETTINGS ? 'border-lime-500 bg-lime-500 text-black' : (account?.settings.theme === 'dark' ? 'border-white/10 text-slate-400 bg-white/5 hover:border-lime-500' : 'border-slate-200 text-slate-600 bg-white')}`}>⚙️</a>
        </div>
      </header>

      {isMobileMenuOpen && <div className="xl:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />}
      <div className={`xl:hidden fixed top-0 left-0 h-full w-[280px] z-[1100] transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${account?.settings.theme === 'dark' ? 'bg-[#0a0a20]' : 'bg-white'} border-r dark:border-white/10 shadow-2xl p-6 flex flex-col gap-6`}>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-black hero-font italic">MAGIC <span className="text-lime-500">AI</span></h2>
           <button onClick={() => setIsMobileMenuOpen(false)} className="text-xl opacity-50">✕</button>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { id: AppMode.CHAT, label: 'CHAT', icon: '💬', href: '#/chat' },
            { id: AppMode.IMAGE_GEN, label: 'VISUALIZER', icon: '⚡', href: '#/image_gen' },
            { id: AppMode.DRAW, label: 'SKETCH', icon: '🖌️', href: '#/draw' },
            { id: AppMode.VOICE, label: 'VOICE', icon: '🎙️', href: '#/voice' },
            { id: AppMode.ACCOUNTS, label: 'PROFILES', icon: '👤', href: '#/accounts' },
            { id: AppMode.GAME, label: 'ARCADE', icon: '🎮', href: '#/game' },
            { id: AppMode.NOTES, label: 'NOTES', icon: '📓', href: '#/notes' },
            { id: AppMode.SETTINGS, label: 'SETTINGS', icon: '⚙️', href: '#/settings' },
          ].map(item => (
            <a key={item.id} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex flex-row items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeMode === item.id ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs uppercase tracking-widest">{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden flex flex-col">{renderContent()}</main>
    </div>
  );
};

const NavLink = ({ active, href, label, icon, isDark }: any) => (
  <a href={href} className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 min-w-[90px] ${active ? 'bg-purple-600 text-white shadow-lg scale-105' : (isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-purple-600 hover:bg-slate-200')}`}>
    <span className="text-xl">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
  </a>
);

export default App;
