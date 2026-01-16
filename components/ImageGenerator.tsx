import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Icons } from '../constants.tsx';

interface SavedBuild {
  url: string;
  prompt: string;
  timestamp: number;
}

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('1:1');
  const [history, setHistory] = useState<SavedBuild[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('magic_build_history_v3');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('magic_build_history_v3', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const hyperPrompt = `A hyper-realistic, photorealistic masterpiece, cinematic lighting: ${prompt}. Incredible detail.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: hyperPrompt }] },
        config: { imageConfig: { aspectRatio: aspectRatio } }
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const newUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImage(newUrl);
          setHistory(prev => [{ url: newUrl, prompt: prompt, timestamp: Date.now() }, ...prev].slice(0, 10));
          foundImage = true;
          break;
        }
      }
      
      if (!foundImage) throw new Error("No image data returned.");
    } catch (error: any) {
      console.error('Error:', error);
      const isQuota = error.message?.toLowerCase().includes('quota') || error.status === 429;
      setError(isQuota 
        ? "⚠️ NEURAL RECHARGE: Too many requests! Please wait 1 minute for the engines to cool down." 
        : "The magic fizzled out... try again! 🪄💀");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteHistoryItem = (e: React.MouseEvent, timestamp: number) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.timestamp !== timestamp);
    setHistory(updatedHistory);
    // If the image being deleted is the one currently displayed, clear it
    const itemToDelete = history.find(item => item.timestamp === timestamp);
    if (itemToDelete && generatedImage === itemToDelete.url) {
      setGeneratedImage(null);
    }
  };

  const clearCurrentView = () => {
    setGeneratedImage(null);
  };

  return (
    <div className="h-full max-w-7xl mx-auto w-full p-4 md:p-10 flex flex-col xl:flex-row gap-10 items-stretch overflow-y-auto bg-white dark:bg-transparent transition-colors duration-500">
      <div className="w-full xl:w-[450px] space-y-8 animate-in slide-in-from-left-12 shrink-0 flex flex-col">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🎨</span>
            <h2 className="text-4xl hero-font font-black italic text-slate-900 dark:text-white uppercase glow-text">VISUALIZER</h2>
          </div>
          <p className="text-xl text-lime-600 dark:text-lime-400 font-black uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 bg-lime-500 rounded-full animate-ping"></span>
             AI IMAGE SYNTHESIS
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a hyper-realistic scene..."
            className="w-full bg-slate-100 dark:bg-[#101025] border-2 border-purple-500/10 rounded-3xl p-6 text-xl text-slate-900 dark:text-white font-bold h-44 resize-none outline-none focus:border-lime-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['1:1', '3:4', '4:3', '9:16', '16:9'].map(val => (
            <button key={val} onClick={() => setAspectRatio(val as any)} className={`py-3 rounded-xl text-[10px] font-black hero-font transition-all border-2 ${aspectRatio === val ? 'bg-lime-500 border-white text-black scale-105' : 'bg-slate-100 dark:bg-[#101025] border-slate-200 dark:border-white/5 text-slate-500'}`}>{val}</button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={`w-full py-8 rounded-[2.5rem] bg-lime-500 text-black text-2xl font-black hero-font uppercase italic transition-all ${!prompt.trim() || isGenerating ? 'opacity-30 grayscale' : 'hover:bg-slate-900 hover:text-white hover:scale-[1.03]'}`}
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE'}
        </button>

        {error && (
          <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-2xl text-red-500 font-black hero-font text-xs text-center animate-bounce">
            {error}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] hero-font font-black text-slate-500 uppercase tracking-widest">History Buffer</h3>
            <div className="grid grid-cols-5 gap-3 pt-2 overflow-y-auto">
              {history.map((build) => (
                <div key={build.timestamp} className="relative group aspect-square">
                  <button 
                    onClick={() => setGeneratedImage(build.url)} 
                    className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all ${generatedImage === build.url ? 'border-lime-500' : 'border-white/5 hover:border-lime-500/50'}`}
                  >
                    <img src={build.url} className="w-full h-full object-cover" alt="History item" />
                  </button>
                  <button 
                    onClick={(e) => deleteHistoryItem(e, build.timestamp)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-90"
                    title="Purge from buffer"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 w-full h-full relative min-h-[500px]">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#050510] rounded-[3.5rem] border-4 border-purple-500/5 flex flex-col items-center justify-center p-6 overflow-hidden shadow-2xl">
          {isGenerating ? (
            <div className="text-center space-y-6">
              <div className="w-64 h-64 mx-auto rounded-full border-8 border-slate-200 dark:border-slate-900 border-t-lime-500 animate-spin" />
              <p className="hero-font font-black text-lime-600 animate-pulse">PROCESSING NEURAL DATA...</p>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex items-center justify-center group">
              <img src={generatedImage} className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl animate-in zoom-in" alt="Generated masterpiece" />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={clearCurrentView}
                  className="bg-black/60 backdrop-blur-md text-white p-4 rounded-3xl hover:bg-red-600 transition-colors border border-white/10 flex items-center gap-2 font-black hero-font text-[10px] uppercase"
                >
                  <Icons.Trash />
                  Purge View
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center opacity-10 flex flex-col items-center gap-4">
               <span className="text-9xl">🖼️</span>
               <p className="hero-font font-black uppercase text-xl tracking-[0.4em]">Awaiting Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;