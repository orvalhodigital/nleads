
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ─── Fontes self-hosted (sem CDN, sem render-blocking) ────────────────────────
// Corpo/UI: Inter (variável). Títulos/display: Bricolage Grotesque (variável).
// Ver docs/DESIGN_GUIDELINES.md para o uso de `font-sans` vs `font-heading`.
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';

import './index.css';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
