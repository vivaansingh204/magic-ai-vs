import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  try {
    root.render(<App />);
  } catch (err) {
    console.error("Neural Initialization Error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050510; color: #ff4b4b; font-family: 'Orbitron', sans-serif; text-align: center; padding: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">BOOT FAILURE</h1>
        <p style="opacity: 0.7;">An error occurred while loading Magic AI. Please refresh.</p>
        <button onclick="window.location.reload()" style="margin-top: 2rem; padding: 1rem 2rem; background: #ff4b4b; color: white; border: none; border-radius: 100px; cursor: pointer; font-weight: 900;">RELOAD SYSTEM</button>
      </div>
    `;
  }
}