
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onActivateKey: () => void;
  hasApiKey: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onActivateKey, hasApiKey }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050510] text-white selection:bg-lime-500 selection:text-black overflow-x-hidden">
      {/* Navigation Header */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 px-6 py-4 md:px-12 md:py-8 flex items-center justify-between ${scrolled ? 'bg-[#050510]/90 backdrop-blur-xl border-b border-white/10 py-4' : 'bg-transparent'}`}>
        <div className="flex items-center gap-2">
           <h1 className="text-2xl md:text-3xl font-black hero-font italic tracking-tighter">MAGIC <span className="text-lime-500">AI</span></h1>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[10px] font-black hero-font uppercase tracking-widest hover:text-lime-500 transition-colors">FEATURES</a>
          <a href="#tech" className="text-[10px] font-black hero-font uppercase tracking-widest hover:text-lime-500 transition-colors">INTELLIGENCE</a>
          {!hasApiKey ? (
            <button 
              onClick={(e) => { e.preventDefault(); onActivateKey(); }}
              className="px-8 py-3 bg-lime-500 text-black font-black hero-font text-[10px] uppercase italic rounded-full hover:brightness-110 transition-all hover:scale-105 active:scale-95 animate-pulse cursor-pointer"
            >
              ACTIVATE ENGINE ⚡
            </button>
          ) : (
            <button 
              onClick={(e) => { e.preventDefault(); onEnter(); }}
              className="px-8 py-3 bg-white text-black font-black hero-font text-[10px] uppercase italic rounded-full hover:bg-lime-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              ENTER BRAIN
            </button>
          )}
        </div>
        <button onClick={hasApiKey ? onEnter : onActivateKey} className="md:hidden px-6 py-2 bg-lime-500 text-black font-black hero-font text-[10px] uppercase rounded-full">
           {hasApiKey ? 'ENTER' : 'ACTIVATE'}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(157,0,255,0.2),transparent_70%)]"></div>
          <div className="tech-grid w-full h-full scale-150 -rotate-12 translate-y-[-10%] opacity-40"></div>
        </div>

        <div className="relative z-10 space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-4">
             <span className="text-[9px] font-black hero-font uppercase tracking-[0.5em] text-lime-500">NEURAL CORE ACTIVE • GOOGLE SEARCH ENABLED</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black hero-font italic uppercase leading-none tracking-tighter">
            MAGIC <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 via-purple-500 to-blue-500">REIMAGINED.</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed tracking-tight">
            The world's fastest Mini Gemini architecture. Now with 1-click neural activation and full web-grounding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            {!hasApiKey ? (
              <button 
                onClick={(e) => { e.preventDefault(); onActivateKey(); }}
                className="w-full sm:w-auto px-16 py-8 bg-lime-500 text-black font-black hero-font text-xl uppercase italic rounded-[3rem] shadow-[0_0_50px_rgba(162,255,0,0.3)] hover:scale-110 active:scale-95 transition-all animate-bounce cursor-pointer"
              >
                ACTIVATE NEURAL ENGINE ⚡
              </button>
            ) : (
              <button 
                onClick={(e) => { e.preventDefault(); onEnter(); }}
                className="w-full sm:w-auto px-16 py-8 bg-purple-600 text-white font-black hero-font text-xl uppercase italic rounded-[3rem] shadow-[0_0_50px_rgba(157,0,255,0.3)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                LAUNCH INTERFACE 🚀
              </button>
            )}
          </div>
          {!hasApiKey && (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse mt-6">
              Neural bridge requires a single project link. One click to begin.
            </p>
          )}
        </div>

        <div className="absolute bottom-10 left-10 hidden xl:flex flex-col gap-4 opacity-30 text-[8px] font-black hero-font uppercase tracking-widest text-slate-500">
           <span>Latent Space: Calibrated</span>
           <span>Neural Throughput: 14.2 TB/s</span>
           <span>Safety Protocol: L3 Verifier</span>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-32 px-6 md:px-12 bg-[#08081a]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-7xl font-black hero-font italic uppercase tracking-tighter">THE MAGIC <span className="text-purple-500">SUITE</span></h2>
            <div className="w-24 h-1 bg-lime-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon="🔍" title="Web Grounding" desc="Ask anything. Magic AI searches Google in real-time to give you the truth." color="border-blue-500/20" />
            <FeatureCard icon="⚡" title="Visualizer" desc="Synthesize hyper-realistic 4K imagery from pure linguistic input." color="border-lime-500/20" />
            <FeatureCard icon="🎙️" title="Native Voice" desc="Zero-latency audio conversation with human-grade synth personas." color="border-purple-500/20" />
            <FeatureCard icon="🖌️" title="Sketch Master" desc="Transform crude doodles into professional art using neural composition." color="border-red-500/20" />
            <FeatureCard icon="🎮" title="Arcade" desc="Test your synapses against grandmaster-level neural gaming nodes." color="border-yellow-500/20" />
            <FeatureCard icon="📓" title="Neural Notes" desc="Persistent memory that influences the AI's core worldview across sessions." color="border-teal-500/20" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-40 px-6 md:px-12 bg-black text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-lime-500 to-transparent"></div>
         <div className="max-w-4xl mx-auto space-y-12 relative z-10">
            <h2 className="text-4xl md:text-8xl font-black hero-font italic uppercase leading-none tracking-tighter">
              READY TO <br />
              <span className="text-lime-500">EVOLVE?</span>
            </h2>
            <button 
              onClick={hasApiKey ? onEnter : onActivateKey}
              className="px-20 py-10 bg-white text-black font-black hero-font text-2xl uppercase italic rounded-[4rem] hover:bg-lime-500 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              INITIALIZE NOW
            </button>
            <div className="pt-20 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5">
               <div className="text-[10px] font-black hero-font uppercase tracking-widest text-slate-500">© 2026 MAGIC AI PROTOCOLS</div>
            </div>
         </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <div className={`p-10 rounded-[3rem] bg-[#101025]/50 border-2 ${color} backdrop-blur-xl hover:scale-105 transition-all group flex flex-col gap-6`}>
    <div className="text-6xl group-hover:scale-125 transition-transform duration-500">{icon}</div>
    <h3 className="text-3xl font-black hero-font uppercase italic">{title}</h3>
    <p className="text-slate-400 font-bold leading-relaxed tracking-tight">{desc}</p>
  </div>
);

export default LandingPage;
