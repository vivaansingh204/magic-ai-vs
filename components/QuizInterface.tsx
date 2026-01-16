import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserAccount } from '../types.ts';

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

interface QuizInterfaceProps {
  account: UserAccount;
  onBack?: () => void;
}

const LABEL_SETS = [
  ['A', 'B', 'C', 'D'],
  ['1', '2', '3', '4'],
  ['I', 'II', 'III', 'IV'],
  ['●', '■', '▲', '◆'],
  ['α', 'β', 'γ', 'δ'],
  ['🍎', '🍌', '🍒', '🍇'],
  ['☀️', '🌧️', '❄️', '⚡'],
  ['←', '↑', '→', '↓'],
  ['♠', '♣', '♥', '♦'],
  ['➊', '➋', '➌', '➍']
];

const QuizInterface: React.FC<QuizInterfaceProps> = ({ account, onBack }) => {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Randomize labels for each question to maximize visual variety
  const [currentLabels, setCurrentLabels] = useState<string[]>(LABEL_SETS[0]);

  useEffect(() => {
    // Pick a new random label set whenever the question changes
    setCurrentLabels(LABEL_SETS[Math.floor(Math.random() * LABEL_SETS.length)]);
  }, [currentIdx, quiz]);

  const shuffleOptions = (questions: Question[]): Question[] => {
    return questions.map(q => {
      const correctAnswerText = q.options[q.answerIndex];
      const shuffled = [...q.options];
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return {
        ...q,
        options: shuffled,
        answerIndex: shuffled.indexOf(correctAnswerText)
      };
    });
  };

  const generateQuiz = async (manualTopic?: string) => {
    setIsGenerating(true);
    setQuiz(null);
    setCurrentIdx(0);
    setSelectedIdx(null);
    setScore(0);
    setIsCompleted(false);
    setError(null);

    // High entropy salt to force model out of its common output patterns
    const entropy = Array.from({length: 10}, () => Math.random().toString(36)[2]).join('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const targetTopic = manualTopic || topic || (account.notes.length > 0 ? account.notes[Math.floor(Math.random() * account.notes.length)].content : 'Unexpected Scientific Anomalies');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `MAGIC AI QUIZ PROTOCOL: Generate a 5-question multiple choice quiz on: "${targetTopic}".
        UNIQUE_ID: ${entropy}.
        RULES:
        1. Do NOT use common or textbook questions. Focus on obscure, counter-intuitive, or bleeding-edge facts.
        2. Ensure every single question is distinctly different from any previous generation.
        3. Provide 4 unique options per question.
        4. Include a technical and educational explanation for the answer.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answerIndex: { type: Type.INTEGER, description: 'Index of the correct option (0-3)' },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "answerIndex", "explanation"]
                }
              }
            },
            required: ["title", "questions"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}') as QuizData;
      if (!data.questions || data.questions.length === 0) throw new Error("Faulty Neural Response.");
      
      const processedQuiz = {
        ...data,
        questions: shuffleOptions(data.questions)
      };

      setQuiz(processedQuiz);
    } catch (err: any) {
      setError("NEURAL LINK ERROR: Could not synthesize unique quiz data. Retrying may be necessary.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    if (idx === quiz!.questions[currentIdx].answerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < quiz!.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
    } else {
      setIsCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setTopic('');
    setIsCompleted(false);
  };

  return (
    <div className="h-full w-full p-4 md:p-12 overflow-y-auto scrollbar-thin bg-[#050510] font-sans relative selection:bg-lime-500 selection:text-black">
      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 md:top-10 md:left-10 text-slate-400 hover:text-white font-black uppercase text-[10px] z-50 transition-colors">← BACK TO ARCADE</button>
      )}
      
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-5xl md:text-8xl font-black hero-font italic text-white uppercase tracking-tighter leading-tight">
            MAGIC <span className="text-lime-500">QUIZ</span>
          </h2>
          <p className="text-xs md:text-lg text-slate-500 font-bold uppercase tracking-[0.5em]">
            SYNAPTIC VARIETY ENGINE ACTIVE
          </p>
        </div>

        {!quiz && !isGenerating ? (
          <div className="bg-[#0f0f2a] border-4 border-white/5 rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl space-y-12 animate-in zoom-in">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Select Topic for Synthesis</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Rare Deep Sea Biology, 1980s Hardware Architecture..."
                className="w-full bg-black/40 border-2 border-white/10 rounded-3xl px-8 py-6 text-xl md:text-3xl text-white font-black outline-none focus:border-lime-500 transition-all placeholder-white/5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => generateQuiz()}
                className="py-6 md:py-8 bg-lime-500 text-black font-black hero-font text-xl rounded-[2rem] md:rounded-3xl uppercase italic hover:scale-[1.03] active:scale-95 transition-all shadow-2xl"
              >
                INITIALIZE BRAIN
              </button>
              <button 
                onClick={() => generateQuiz()} // generateQuiz without topic defaults to random
                className="py-6 md:py-8 bg-white/5 border border-white/10 text-white font-black hero-font text-xl rounded-[2rem] md:rounded-3xl uppercase italic hover:bg-white/10 transition-all active:scale-95"
              >
                RANDOM SEED
              </button>
            </div>
            {error && <p className="text-red-500 text-center hero-font font-black text-xs animate-pulse uppercase tracking-widest">{error}</p>}
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-10 animate-pulse">
            <div className="relative">
              <div className="w-32 h-32 border-8 border-lime-500/20 rounded-full"></div>
              <div className="absolute inset-0 w-32 h-32 border-8 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="hero-font text-lime-500 font-black uppercase tracking-[0.6em] text-2xl">CALCULATING VARIANCE</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Applying Entropy protocols...</p>
            </div>
          </div>
        ) : quiz && !isCompleted ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex justify-between items-end px-4">
              <div className="flex flex-col">
                <span className="hero-font text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Module Progress: {currentIdx + 1}/{quiz.questions.length}</span>
                <span className="text-[9px] font-bold text-lime-500/60 uppercase tracking-widest mt-1 italic">Active Label Protocol: {currentLabels[0]} series</span>
              </div>
              <div className="text-right">
                <span className="hero-font text-[10px] font-black text-lime-500 uppercase tracking-widest block mb-1">Score Accuracy</span>
                <span className="text-3xl font-black hero-font italic text-white leading-none">{(score/quiz.questions.length * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-[#0f0f2a] border-4 border-white/5 rounded-[3rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl space-y-12">
              <h3 className="text-2xl md:text-5xl font-black text-white leading-[1.15] tracking-tight italic">
                {quiz.questions[currentIdx].question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {quiz.questions[currentIdx].options.map((opt, i) => {
                  let statusClass = "bg-white/5 border-white/5 text-slate-300 hover:border-lime-500/50 hover:bg-white/[0.08]";
                  if (selectedIdx !== null) {
                    if (i === quiz.questions[currentIdx].answerIndex) statusClass = "bg-lime-500 text-black border-white shadow-[0_0_40px_rgba(162,255,0,0.4)] z-10 scale-[1.02]";
                    else if (i === selectedIdx) statusClass = "bg-red-600 text-white border-white opacity-60 grayscale";
                    else statusClass = "bg-white/5 border-white/5 text-slate-600 opacity-20";
                  }

                  return (
                    <button 
                      key={i}
                      disabled={selectedIdx !== null}
                      onClick={() => handleAnswerSelect(i)}
                      className={`w-full p-6 md:p-8 text-left rounded-[2rem] border-2 transition-all font-black text-lg md:text-2xl flex items-center gap-6 ${statusClass}`}
                    >
                      <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl flex items-center justify-center font-black transition-colors ${selectedIdx !== null && i === quiz.questions[currentIdx].answerIndex ? 'bg-black text-lime-500' : 'bg-black/40 text-white/20'}`}>
                        {currentLabels[i]}
                      </div>
                      <span className="leading-tight">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {selectedIdx !== null && (
                <div className="animate-in slide-in-from-top-4 duration-700 space-y-8">
                  <div className="p-8 md:p-12 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-lime-500"></div>
                    <h4 className="hero-font font-black text-[11px] text-lime-500 uppercase tracking-[0.4em]">Neural Insight Analysis:</h4>
                    <p className="text-slate-300 font-bold text-base md:text-xl leading-relaxed tracking-tight">{quiz.questions[currentIdx].explanation}</p>
                  </div>
                  <button 
                    onClick={handleNext}
                    className="w-full py-8 bg-purple-600 text-white font-black hero-font text-2xl rounded-[2.5rem] uppercase italic hover:bg-purple-500 transition-all shadow-2xl hover:scale-[1.02] active:scale-95"
                  >
                    {currentIdx === quiz.questions.length - 1 ? 'REVEAL FINAL METRICS' : 'NEXT CHALLENGE →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#0f0f2a] border-4 border-white/5 rounded-[4rem] p-16 md:p-24 shadow-2xl text-center space-y-12 animate-in zoom-in">
             <div className="space-y-6">
                <span className="text-9xl filter drop-shadow-[0_0_30px_rgba(162,255,0,0.4)]">🎖️</span>
                <h3 className="text-4xl md:text-7xl font-black hero-font italic text-white uppercase tracking-tighter">PROTOCOLS <span className="text-lime-500">RESOLVED</span></h3>
             </div>
             <div className="flex flex-col items-center gap-4">
                <div className="text-8xl md:text-[10rem] font-black hero-font text-lime-500 drop-shadow-[0_0_50px_rgba(162,255,0,0.6)] leading-none">{score} / {quiz?.questions.length}</div>
                <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-sm md:text-lg">Synaptic Efficiency Achieved</p>
             </div>
             <div className="pt-8">
               <button 
                  onClick={resetQuiz}
                  className="px-20 py-8 bg-lime-500 text-black font-black hero-font text-2xl rounded-[3rem] uppercase italic hover:scale-110 active:scale-95 transition-all shadow-2xl"
               >
                 NEW SIMULATION
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizInterface;