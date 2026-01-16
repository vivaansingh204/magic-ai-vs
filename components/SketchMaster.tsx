import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Icons } from '../constants.tsx';
import { UserAccount } from '../types.ts';

interface SketchMasterProps {
  account: UserAccount;
}

const SketchMaster: React.FC<SketchMasterProps> = ({ account }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  // Initial canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#101025';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Precise coordinate mapping for different screen sizes
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#101025';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setResultImage(null);
  };

  const transformSketch = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      // Using process.env.API_KEY directly - no more selection dialogs
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const brainInfluence = account.notes.length > 0 
        ? `### CORE IDENTITY LAWS (NEURAL BRAIN) ###\n${account.notes.map((n, i) => `${i+1}. ${n.content}`).join('\n')}`
        : "";

      const lowerPrompt = prompt.toLowerCase();
      // REALISM LOCK: Only allow fantasy if explicitly requested
      const fantasyKeywords = ["magic", "dragon", "alien", "sci-fi", "fantasy", "monster", "spirit", "ghost", "wizard", "imaginary", "doesn't exist", "mythical", "surreal", "unreal", "not real"];
      const containsFantasy = fantasyKeywords.some(kw => lowerPrompt.includes(kw));

      const realismDirective = containsFantasy 
        ? `CREATIVE FREEDOM: User requested: "${prompt}". You may draw things that do not exist.`
        : `STRICT REALISM PROTOCOL: ONLY DRAW REAL-WORLD OBJECTS. Transform this sketch into a hyper-realistic, photorealistic image of things that exist in reality. No fantasy, no magic.`;

      const transformPrompt = `${realismDirective}
      
      Visual Target: ${prompt || 'A photorealistic masterpiece interpreting this composition'}. 
      
      ${brainInfluence}
      
      Technical Style: Professional photography, macro details, cinematic light, lifelike textures.
      Maintain composition faithfully.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Reverted to standard model for instant access
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            },
            {
              text: transformPrompt
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1'
          }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setResultImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) throw new Error("Link failed to transmit visual data.");

    } catch (err: any) {
      console.error(err);
      setError("NEURAL LINK FAILURE: " + (err.message || "Connection Interrupted"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row gap-8 p-6 md:p-12 overflow-y-auto scrollbar-thin bg-[#050510]">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-6 animate-in slide-in-from-left-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black hero-font italic text-white uppercase tracking-tighter glow-text">SKETCH <span className="text-lime-500">MASTER</span></h2>
          <p className="text-[10px] font-bold text-lime-500 uppercase tracking-[0.3em]">REAL-TIME NEURAL SYNTHESIS</p>
        </div>

        <div className="bg-[#0f0f2a] border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Brush Parameters</label>
            <div className="flex gap-4 items-center">
              <input 
                type="color" 
                value={brushColor} 
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer p-0"
              />
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="flex-1 accent-lime-500"
              />
              <span className="text-xs font-bold text-white w-8">{brushSize}px</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Core Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A real mountain range..."
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-white font-bold h-24 resize-none focus:border-lime-500 outline-none"
            />
            <p className="text-[8px] text-white/30 font-bold uppercase">🔒 Reality Lock Active: Objects that don't exist won't be drawn unless requested.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={clearCanvas}
              className="w-full py-4 border border-red-500/30 text-red-500 font-black hero-font text-[10px] rounded-2xl hover:bg-red-500 hover:text-white transition-all"
            >
              PURGE CANVAS
            </button>
            <button 
              onClick={transformSketch}
              disabled={isGenerating}
              className={`w-full py-6 bg-lime-500 text-black font-black hero-font text-lg rounded-[2rem] italic shadow-2xl transition-all ${isGenerating ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
            >
              {isGenerating ? 'CALIBRATING...' : 'ENHANCE ⚡'}
            </button>
          </div>

          {error && <div className="p-3 bg-red-600/20 text-red-500 text-[10px] font-bold uppercase text-center mt-4 tracking-tight rounded-xl border border-red-500/20">{error}</div>}
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        <div className="flex-1 relative bg-[#101025] rounded-[3rem] border-4 border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
           <canvas
             ref={canvasRef}
             width={800}
             height={800}
             onMouseDown={startDrawing}
             onMouseMove={draw}
             onMouseUp={endDrawing}
             onMouseOut={endDrawing}
             onTouchStart={startDrawing}
             onTouchMove={draw}
             onTouchEnd={endDrawing}
             className="w-full h-full cursor-crosshair touch-none"
           />
           {isGenerating && (
             <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-50">
                <div className="w-24 h-24 border-8 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="hero-font text-lime-500 font-black uppercase tracking-[0.5em] text-xl animate-pulse">SYNTHESIZING REALITY</span>
             </div>
           )}
        </div>

        {/* Output */}
        {resultImage && (
          <div className="h-80 md:h-[400px] relative bg-[#0a0a20] rounded-[3rem] border-4 border-lime-500/30 shadow-2xl overflow-hidden animate-in zoom-in duration-700">
             <img src={resultImage} className="w-full h-full object-contain" alt="Result" />
             <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-lime-500/20">
                <span className="text-[10px] font-black text-lime-500 uppercase tracking-widest">OUTPUT_LINK_STABLE</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SketchMaster;