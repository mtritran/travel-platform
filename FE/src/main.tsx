import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfill for SockJS
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
