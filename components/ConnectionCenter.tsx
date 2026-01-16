import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types.ts';

interface ConnectionCenterProps {
  account: UserAccount;
  onCopy: () => void;
}

const ConnectionCenter: React.FC<ConnectionCenterProps> = ({ account, onCopy }) => {
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Generate the URL on mount to ensure browser APIs are available
    const url = window.location.href.split('#')[0];
    setAppUrl(url);
  }, []);

  const handleCopy = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl).then(() => {
      onCopy();
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-white dark:bg-transparent transition-colors duration-500 scrollbar-thin">
      <div className="max-w-4xl mx-auto w-full p-6 md:p-12 flex flex-col space-y-12 animate-in fade-in zoom-in">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-7xl font-black italic hero-font text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
            CONNECTION <span className="text-lime-500">CENTER</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-[0.4em]">DISTRIBUTED SYSTEM ACCESS</p>
        </div>

        <section className="p-8 md:p-16 rounded-[3rem] border-4 border-lime-500/30 bg-lime-500/5 shadow-2xl space-y-12">
          <div className="space-y-4 text-center">
            <h3 className="text-3xl font-black hero-font uppercase italic text-white tracking-tight">UNIVERSAL SYSTEM LINK</h3>
            <p className="text-sm text-slate-400 font-medium">This is the direct neural address for this Magic AI instance.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-black/40 border-2 border-white/10 rounded-3xl p-8 font-mono text-lime-500 text-sm md:text-xl break-all relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-lime-500"></div>
               {appUrl || 'GENERATING LINK...'}
               <div className="mt-6 flex justify-end">
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">PUBLIC_ACCESS_NODE</span>
               </div>
            </div>

            <button 
               onClick={handleCopy}
               className="w-full py-8 bg-lime-500 text-black font-black hero-font text-2xl rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(162,255,0,0.3)] flex items-center justify-center gap-4"
            >
               COPY SYSTEM LINK 🔗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/10">
             <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                <h4 className="font-black hero-font uppercase text-slate-400 text-xs tracking-widest text-center">SESSION SHARING</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center">To share a specific conversation, use the "SHARE SESSION" button inside the Chat Interface.</p>
             </div>
             <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white flex items-center justify-center rounded-xl p-2">
                   <div className="w-full h-full bg-black flex flex-wrap gap-1 p-1">
                      {Array(64).fill(null).map((_, i) => (
                        <div key={i} className={`w-[6px] h-[6px] ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                      ))}
                   </div>
                </div>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">SYSTEM QR IDENTIFIER</span>
             </div>
          </div>
        </section>

        <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border-2 border-blue-500/20 text-center">
           <p className="text-xs text-blue-400 font-bold leading-relaxed">
             <span className="font-black">SECURITY NOTE:</span> Your API Key is NOT shared. Guests must authenticate themselves.
           </p>
        </div>

        <div className="pt-20 text-center space-y-3 opacity-30">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-lime-500 to-transparent mx-auto mb-6"></div>
          <p className="hero-font font-black text-[12px] uppercase tracking-[1em] text-white">MAGIC AI</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCenter;