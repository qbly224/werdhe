import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './polish.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(reg) {
        console.log('[SW] Enregistré :', reg.scope);
      })
      .catch(function(err) {
        console.warn('[SW] Échec :', err.message);
      });
  });
}