import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { db } from './lib/db';
import { checkForSetListUpdatesIfStale, setScryfallDb } from './lib/scryfall';

setScryfallDb(db);
checkForSetListUpdatesIfStale().catch(() => null);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
