import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Icons } from '../constants';

interface AccountInterfaceProps {
  accounts: UserAccount[];
  currentId: string | null;
  onSelectAccount: (id: string) => void;
  onAddAccount: (name: string) => void;
  onDeleteAccount: (id: string) => void;
}

const AccountInterface: React.FC<AccountInterfaceProps> = ({
  accounts,
  currentId,
  onSelectAccount,
  onAddAccount,
  onDeleteAccount
}) => {
  const [newAccountName, setNewAccountName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      onAddAccount(newAccountName.trim());
      setNewAccountName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#050510] overflow-y-auto selection:bg-lime-500 selection:text-black">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-5xl md:text-7xl font-black hero-font italic text-white uppercase tracking-tighter">
            NEURAL <span className="text-lime-500">PROFILES</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-[0.4em]">
            Select an identity to synchronize with Magic AI
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {accounts.map((acc) => {
            const isActive = acc.id === currentId;
            return (
              <div 
                key={acc.id}
                className={`group relative p-8 rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center text-center space-y-6 shadow-2xl overflow-hidden ${
                  isActive 
                  ? 'bg-purple-600/20 border-lime-500 ring-4 ring-lime-500/20 scale-[1.02]' 
                  : 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/[0.08]'
                }`}
              >
                {/* Visual Glow for Active */}
                {isActive && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
                    </span>
                  </div>
                )}

                {/* Avatar / Icon */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black hero-font border-4 ${
                  isActive ? 'bg-lime-500 text-black border-white' : 'bg-purple-600/20 text-purple-400 border-white/5'
                }`}>
                  {acc.name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black hero-font text-white uppercase truncate px-2">
                    {acc.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {acc.sessions.length} SESSIONS • {acc.settings.location}
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-4">
                  {!isActive ? (
                    <a 
                      href={`#/accounts/${acc.id}`}
                      onClick={() => onSelectAccount(acc.id)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-lime-500 hover:text-black hover:border-lime-500 transition-all active:scale-95 text-center flex items-center justify-center"
                    >
                      Sync Link
                    </a>
                  ) : (
                    <div className="flex-1 py-4 bg-lime-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-[0_0_20px_rgba(162,255,0,0.3)]">
                      Active
                    </div>
                  )}
                  
                  {accounts.length > 1 && (
                    <button 
                      onClick={(e) => { e.preventDefault(); onDeleteAccount(acc.id); }}
                      className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      title="Delete Profile"
                    >
                      <Icons.Trash />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New Identity Card */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="group p-8 rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-lime-500/50 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 min-h-[350px]"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-4xl text-white/20 group-hover:text-lime-500 group-hover:scale-110 transition-all">
                +
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black hero-font text-white/40 group-hover:text-white uppercase">New Identity</h3>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Add a fresh neural profile</p>
              </div>
            </button>
          ) : (
            <form 
              onSubmit={handleCreate}
              className="p-8 rounded-[3rem] border-2 border-lime-500 bg-lime-500/5 flex flex-col items-center justify-center text-center space-y-8 min-h-[350px] animate-in zoom-in duration-300"
            >
              <h3 className="text-xl font-black hero-font text-lime-500 uppercase tracking-widest">Identify Profile</h3>
              <input 
                autoFocus
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="ENTER NAME..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-black hero-font text-center outline-none focus:border-lime-500 transition-all"
              />
              <div className="flex gap-4 w-full">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newAccountName.trim()}
                  className="flex-1 py-4 bg-lime-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  Manifest
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security / Info Footer */}
        <div className="pt-12 border-t border-white/5 flex flex-col items-center space-y-6 opacity-30">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">🔒</span>
              <span className="text-[8px] font-black uppercase tracking-widest">Isolated Storage</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">🧠</span>
              <span className="text-[8px] font-black uppercase tracking-widest">Neural Link Sync</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">⚡</span>
              <span className="text-[8px] font-black uppercase tracking-widest">Instant Context</span>
            </div>
          </div>
          <p className="text-[10px] hero-font font-bold uppercase tracking-[0.5em] text-center">
            Multiple profiles allow isolated session history and settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInterface;