import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { checkForSetListUpdatesIfStale } from './lib/scryfall';

checkForSetListUpdatesIfStale().catch(() => null);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
