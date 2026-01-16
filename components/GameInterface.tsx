import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserAccount } from '../types.ts';
import QuizInterface from './QuizInterface.tsx';

type GameType = 'HUB' | 'CHESS' | 'TIC_TAC_TOE' | 'HANGMAN' | 'QUIZ';

interface GameInterfaceProps {
  account: UserAccount;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ account }) => {
  const [activeGame, setActiveGame] = useState<GameType>('HUB');
  
  return (
    <div className="h-full w-full bg-[#050510] relative">
      {activeGame === 'HUB' ? (
        <GameHub onSelect={setActiveGame} />
      ) : activeGame === 'TIC_TAC_TOE' ? (
        <TicTacToe onBack={() => setActiveGame('HUB')} />
      ) : activeGame === 'HANGMAN' ? (
        <Hangman onBack={() => setActiveGame('HUB')} />
      ) : activeGame === 'CHESS' ? (
        <ChessGame onBack={() => setActiveGame('HUB')} />
      ) : activeGame === 'QUIZ' ? (
        <QuizInterface account={account} onBack={() => setActiveGame('HUB')} />
      ) : (
        <GameHub onSelect={setActiveGame} />
      )}
    </div>
  );
};

export default GameInterface;

const GameHub: React.FC<{ onSelect: (g: GameType) => void }> = ({ onSelect }) => (
  <div className="p-8 md:p-20 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto h-full overflow-y-auto">
    <GameCard title="Synaptic Quiz" icon="🧠" desc="Test your intelligence against AI generated challenges." onClick={() => onSelect('QUIZ')} />
    <GameCard title="Tic-Tac-Toe" icon="❌" desc="Classic logic battle against the machine." onClick={() => onSelect('TIC_TAC_TOE')} />
    <GameCard title="Neural Hangman" icon="🪢" desc="Predict the AI's linguistic patterns." onClick={() => onSelect('HANGMAN')} />
    <GameCard title="Grandmaster Chess" icon="♟️" desc="Strategic warfare on the 8x8 grid." onClick={() => onSelect('CHESS')} />
  </div>
);

const GameCard = ({ title, icon, desc, onClick }: any) => (
  <button onClick={onClick} className="bg-white/5 border-2 border-white/5 p-10 rounded-[3rem] hover:border-lime-500 hover:bg-lime-500/5 transition-all text-left group">
    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-3xl font-black hero-font italic text-white uppercase">{title}</h3>
    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">{desc}</p>
  </button>
);

const TicTacToe: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    const nextBoard = board.slice();
    nextBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(nextBoard);
    setXIsNext(!xIsNext);
  };

  const winner = calculateWinner(board);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12 animate-in zoom-in">
      <button onClick={onBack} className="absolute top-10 left-10 text-white/40 hover:text-white font-black uppercase text-xs">← BACK</button>
      <h2 className="text-5xl font-black hero-font italic text-white">TIC TAC <span className="text-lime-500">TOE</span></h2>
      <div className="grid grid-cols-3 gap-4">
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)} className="w-24 h-24 md:w-32 md:h-32 bg-white/5 border-4 border-white/10 rounded-3xl flex items-center justify-center text-4xl font-black hero-font text-white hover:border-lime-500 transition-all">
            {cell}
          </button>
        ))}
      </div>
      <div className="text-center">
        {winner ? (
          <p className="text-2xl font-black text-lime-500 uppercase tracking-widest animate-bounce">WINNER: {winner}</p>
        ) : board.every(Boolean) ? (
          <p className="text-2xl font-black text-slate-500 uppercase tracking-widest">DRAW</p>
        ) : (
          <p className="text-xl font-bold text-white/40 uppercase tracking-widest">NEXT: {xIsNext ? 'X' : 'O'}</p>
        )}
        <button onClick={() => setBoard(Array(9).fill(null))} className="mt-8 px-10 py-4 bg-lime-500 text-black font-black rounded-2xl">RESET</button>
      </div>
    </div>
  );
};

const Hangman: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const words = ["NEURAL", "SYNAPSE", "LATENT", "PHANTOM", "QUANTUM", "CYBER", "KINETIC", "VERTEX", "MATRIX", "VIRTUAL"];
  
  const initGame = () => {
    const selectedWord = words[Math.floor(Math.random() * words.length)];
    const uniqueChars = Array.from(new Set(selectedWord.split('')));
    const hints: string[] = [];
    
    const charsCopy = [...uniqueChars];
    while (hints.length < 2 && charsCopy.length > 0) {
      const idx = Math.floor(Math.random() * charsCopy.length);
      hints.push(charsCopy.splice(idx, 1)[0]);
    }
    
    return { word: selectedWord, initialGuessed: hints };
  };

  const [gameState, setGameState] = useState(() => initGame());
  const [guessed, setGuessed] = useState<string[]>(gameState.initialGuessed);
  
  const { word } = gameState;
  const mistakes = guessed.filter(l => !word.includes(l)).length;
  const isGameOver = mistakes >= 6 || word.split('').every(l => guessed.includes(l));

  const guess = (letter: string) => {
    if (isGameOver || guessed.includes(letter)) return;
    setGuessed([...guessed, letter]);
  };

  const restart = () => {
    const newState = initGame();
    setGameState(newState);
    setGuessed(newState.initialGuessed);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12 animate-in zoom-in">
      <button onClick={onBack} className="absolute top-10 left-10 text-white/40 hover:text-white font-black uppercase text-xs">← BACK</button>
      <div className="text-center space-y-2">
        <h2 className="text-5xl font-black hero-font italic text-white">NEURAL <span className="text-lime-500">HANGMAN</span></h2>
        <p className="text-[10px] font-black text-lime-500/50 uppercase tracking-[0.4em]">SYSTEM HINT: 2 NEURONS PRE-CALIBRATED</p>
      </div>
      
      <div className="text-6xl font-black hero-font tracking-[0.5em] text-white flex flex-wrap justify-center gap-y-4">
        {word.split('').map((l, i) => (
          <span key={i} className={`inline-block border-b-4 border-white/20 min-w-[1ch] text-center mx-1 ${guessed.includes(l) ? 'text-lime-500 border-lime-500/50' : ''}`}>
            {guessed.includes(l) ? l : ''}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 md:grid-cols-9 gap-3 max-w-2xl mx-auto">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(l => (
          <button 
            key={l} 
            onClick={() => guess(l)} 
            disabled={guessed.includes(l) || isGameOver} 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-sm transition-all flex items-center justify-center ${
              guessed.includes(l) 
                ? (word.includes(l) ? 'bg-lime-500 text-black' : 'bg-red-600/20 text-red-500 opacity-50') 
                : 'bg-white/5 text-white hover:bg-white/10 active:scale-90'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-6">
          <p className={`text-xl font-black uppercase tracking-widest ${mistakes >= 5 ? 'text-red-500 animate-pulse' : 'text-white/60'}`}>
            MISTAKES: {mistakes}/6
          </p>
        </div>

        {isGameOver && (
          <div className="mt-4 space-y-6 p-10 bg-white/5 border-2 border-white/5 rounded-[3rem] animate-in zoom-in">
            <div className="space-y-2">
               <p className={`text-4xl font-black hero-font italic uppercase ${mistakes >= 6 ? 'text-red-500' : 'text-lime-500'}`}>
                 {mistakes >= 6 ? 'SYSTEM FAILURE' : 'DECODED'}
               </p>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">REVEALED PATTERN: {word}</p>
            </div>
            <button 
              onClick={restart} 
              className="px-12 py-5 bg-lime-500 text-black font-black hero-font text-sm uppercase italic rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              RE-INITIATE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChessGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const initialPieces = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
  ];

  const [board, setBoard] = useState<(string | null)[][]>(initialPieces);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<[[number, number], [number, number]] | null>(null);

  const whitePieces = ['♖', '♘', '♗', '♕', '♔', '♙'];
  const blackPieces = ['♜', '♞', '♝', '♛', '♚', '♟'];

  const isValidMove = useCallback((from: [number, number], to: [number, number], currentBoard: (string | null)[][]): boolean => {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const piece = currentBoard[fr][fc];
    const target = currentBoard[tr][tc];

    if (!piece) return false;
    if (fr === tr && fc === tc) return false;

    // Check if capturing same color
    const isWhite = whitePieces.includes(piece);
    const isTargetWhite = target ? whitePieces.includes(target) : false;
    if (target && isWhite === isTargetWhite) return false;

    const dr = tr - fr;
    const dc = tc - fc;

    // Basic Piece Logic
    switch (piece) {
      case '♙': // White Pawn
        if (dc === 0 && dr === -1 && !target) return true;
        if (dc === 0 && dr === -2 && fr === 6 && !target && !currentBoard[5][fc]) return true;
        if (Math.abs(dc) === 1 && dr === -1 && target && !isTargetWhite) return true;
        return false;
      case '♟': // Black Pawn
        if (dc === 0 && dr === 1 && !target) return true;
        if (dc === 0 && dr === 2 && fr === 1 && !target && !currentBoard[2][fc]) return true;
        if (Math.abs(dc) === 1 && dr === 1 && target && isTargetWhite) return true;
        return false;
      case '♖': case '♜': // Rook
        if (dr !== 0 && dc !== 0) return false;
        const rStep = dr === 0 ? 0 : dr / Math.abs(dr);
        const cStep = dc === 0 ? 0 : dc / Math.abs(dc);
        let cr = fr + rStep, cc = fc + cStep;
        while (cr !== tr || cc !== tc) {
          if (currentBoard[cr][cc]) return false;
          cr += rStep; cc += cStep;
        }
        return true;
      case '♗': case '♝': // Bishop
        if (Math.abs(dr) !== Math.abs(dc)) return false;
        const brStep = dr / Math.abs(dr);
        const bcStep = dc / Math.abs(dc);
        let bcr = fr + brStep, bcc = fc + bcStep;
        while (bcr !== tr || bcc !== tc) {
          if (currentBoard[bcr][bcc]) return false;
          bcr += brStep; bcc += bcStep;
        }
        return true;
      case '♕': case '♛': // Queen
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
        const qrStep = dr === 0 ? 0 : dr / Math.abs(dr);
        const qcStep = dc === 0 ? 0 : dc / Math.abs(dc);
        let qcr = fr + qrStep, qcc = fc + qcStep;
        while (qcr !== tr || qcc !== tc) {
          if (currentBoard[qcr][qcc]) return false;
          qcr += qrStep; qcc += qcStep;
        }
        return true;
      case '♘': case '♞': // Knight
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case '♔': case '♚': // King
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      default:
        return false;
    }
  }, []);

  const makeAiMove = async (currentBoard: (string | null)[][]) => {
    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const boardStr = currentBoard.map(row => row.map(p => p || '.').join('')).join('\n');
      
      const prompt = `You are an expert chess engine playing as Black (lower-case symbols or symbols like ♜).
Current board:
${boardStr}

Rules:
1. You must only play Black pieces: ♜, ♞, ♝, ♛, ♚, ♟.
2. Output your move in JSON format: {"from": [row, col], "to": [row, col]}. 
3. Ensure the move is legal.
4. Rows and Columns are 0-7. Row 0 is at the top (Black side start), Row 7 is at the bottom (White side start).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.ARRAY, items: { type: Type.INTEGER }, minItems: 2, maxItems: 2 },
              to: { type: Type.ARRAY, items: { type: Type.INTEGER }, minItems: 2, maxItems: 2 }
            },
            required: ["from", "to"]
          }
        }
      });

      const move = JSON.parse(response.text || '{}');
      const { from, to } = move;

      if (from && to && isValidMove(from as [number, number], to as [number, number], currentBoard)) {
        const newBoard = currentBoard.map(row => [...row]);
        newBoard[to[0]][to[1]] = newBoard[from[0]][from[1]];
        newBoard[from[0]][from[1]] = null;
        setBoard(newBoard);
        setLastMove([from as [number, number], to as [number, number]]);
        setTurn('w');
      } else {
        // Fallback: Random legal move if AI fails or suggests illegal move
        makeRandomMove(currentBoard);
      }
    } catch (e) {
      makeRandomMove(currentBoard);
    } finally {
      setIsAiThinking(false);
    }
  };

  const makeRandomMove = (currentBoard: (string | null)[][]) => {
    const allMoves: [[number, number], [number, number]][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c] && blackPieces.includes(currentBoard[r][c]!)) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (isValidMove([r, c], [tr, tc], currentBoard)) {
                allMoves.push([[r, c], [tr, tc]]);
              }
            }
          }
        }
      }
    }
    if (allMoves.length > 0) {
      const [from, to] = allMoves[Math.floor(Math.random() * allMoves.length)];
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[to[0]][to[1]] = newBoard[from[0]][from[1]];
      newBoard[from[0]][from[1]] = null;
      setBoard(newBoard);
      setLastMove([from, to]);
      setTurn('w');
    }
  };

  useEffect(() => {
    if (turn === 'b' && !isAiThinking) {
      const timer = setTimeout(() => makeAiMove(board), 800);
      return () => clearTimeout(timer);
    }
  }, [turn, board]);

  const handleSquareClick = (r: number, c: number) => {
    if (turn === 'b' || isAiThinking) return;

    const piece = board[r][c];
    const isWhitePiece = whitePieces.includes(piece || '');

    if (selected) {
      const [sr, sc] = selected;
      
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }

      if (isValidMove([sr, sc], [r, c], board)) {
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = newBoard[sr][sc];
        newBoard[sr][sc] = null;
        setBoard(newBoard);
        setLastMove([[sr, sc], [r, c]]);
        setSelected(null);
        setTurn('b');
      } else if (isWhitePiece) {
        setSelected([r, c]);
      } else {
        setSelected(null);
      }
    } else {
      if (isWhitePiece) {
        setSelected([r, c]);
      }
    }
  };

  const resetGame = () => {
    setBoard(initialPieces);
    setSelected(null);
    setTurn('w');
    setLastMove(null);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 space-y-6 animate-in zoom-in overflow-y-auto">
      <button onClick={onBack} className="absolute top-10 left-10 text-white/40 hover:text-white font-black uppercase text-xs">← BACK</button>
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-5xl font-black hero-font italic text-white uppercase tracking-tighter">MAGIC <span className="text-lime-500">AI CHESS</span></h2>
        <div className="flex items-center justify-center gap-4">
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${turn === 'w' ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/10 text-white/40'}`}>WHITE (YOU)</div>
          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${turn === 'b' ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-white/10 text-white/40'}`}>BLACK (MAGIC AI)</div>
        </div>
      </div>

      <div className="relative group">
        <div className="w-[340px] h-[340px] md:w-[500px] md:h-[500px] border-[6px] md:border-[12px] border-[#0a0a20] rounded-xl overflow-hidden shadow-2xl grid grid-cols-8 grid-rows-8 bg-black">
          {board.map((row, r) => 
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isLastMove = lastMove && ((lastMove[0][0] === r && lastMove[0][1] === c) || (lastMove[1][0] === r && lastMove[1][1] === c));
              
              return (
                <button 
                  key={`${r}-${c}`} 
                  onClick={() => handleSquareClick(r, c)}
                  className={`w-full h-full flex items-center justify-center text-3xl md:text-5xl transition-all relative ${
                    isDark ? 'bg-[#151525]' : 'bg-[#2a2a40]'
                  } ${isSelected ? 'ring-4 ring-inset ring-lime-500 bg-lime-500/20 z-10' : ''} ${isLastMove ? 'bg-lime-500/10' : ''}`}
                >
                  <span className={`${whitePieces.includes(piece || '') ? 'text-white drop-shadow-md' : 'text-slate-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]'}`}>
                    {piece}
                  </span>
                  {c === 0 && <span className="absolute top-0.5 left-0.5 text-[8px] font-black text-white/10">{8-r}</span>}
                  {r === 7 && <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black text-white/10">{String.fromCharCode(97 + c)}</span>}
                </button>
              );
            })
          )}
        </div>
        {isAiThinking && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20">
             <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="hero-font font-black text-lime-500 uppercase tracking-widest text-xs animate-pulse">MAGIC AI THINKING...</p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={resetGame} 
          className="px-8 py-3 bg-white/5 border border-white/10 text-white font-black hero-font text-[10px] rounded-xl hover:bg-red-600 transition-all uppercase"
        >
          RESTART ENGINE
        </button>
      </div>

      <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] opacity-40">NEURAL PROTOCOL: GEMINI-3-FLASH ENGINE ACTIVE</p>
    </div>
  );
};
