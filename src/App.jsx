import { useMemo, useRef, useState } from 'react';
import { auditCard, auditDeck, auditFolder, auditUser } from './lib/audit';
import { clearCache, getCacheStats, getSetListVersion } from './lib/cache';

const t = {
  bg: '#0f1117',
  surface: '#1a1d27',
  border: '#2a2e42',
  text: '#e8eaf0',
  textMuted: '#9ca3af',
  accent: '#4f6ef7',
  legal: '#22c55e',
  banned: '#ef4444',
  warning: '#f59e0b',
};

function Status({ status }) {
  const color = status === 'banned' ? t.banned : status === 'legal' ? t.legal : status === 'failed' ? t.warning : t.textMuted;
  return <span style={{ color, fontWeight: 600 }}>{status}</span>;
}

export default function App() {
  const [mode, setMode] = useState('deck');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [setVersion, setSetVersion] = useState('');
  const abortRef = useRef(null);

  const placeholders = useMemo(() => ({
    card: 'Enter card name',
    deck: 'Enter deck ID',
    folder: 'Enter folder ID',
    user: 'Enter username',
  }), []);

  const onError = (error) => {
    setBusy(false);
    setSummary({ error: error.reason || 'unknown' });
  };

  const runAudit = async () => {
    const value = input.trim();
    if (!value || busy) {
      return;
    }

    setRows([]);
    setSummary(null);
    setBusy(true);
    abortRef.current = new AbortController();

    if (mode === 'card') {
      setTitle(`Card: ${value}`);
      await auditCard(value, {
        onResult: ({ cardName, status }) => {
          setRows([{ label: cardName, status }]);
          if (status !== 'checking') {
            setBusy(false);
          }
        },
      });
      return;
    }

    if (mode === 'deck') {
      await auditDeck(value, {
        signal: abortRef.current.signal,
        onDeckInfo: (info) => setTitle(`${info.name} (${info.totalCards} cards)`),
        onCardResult: ({ cardName, status }) => {
          setRows((prev) => [...prev, { label: cardName, status }]);
        },
        onComplete: (totals) => {
          setSummary(totals);
          setBusy(false);
        },
        onError,
      });
      return;
    }

    const runGroupAudit = mode === 'folder' ? auditFolder : auditUser;

    await runGroupAudit(value, {
      signal: abortRef.current.signal,
      onFolderInfo: (info) => setTitle(`${info.name} (${info.totalDecks} decks)`),
      onDeckStart: ({ name }) => {
        setRows((prev) => [...prev, { label: `Deck: ${name}`, status: 'checking' }]);
      },
      onDeckCardResult: ({ deckName, cardName, status }) => {
        setRows((prev) => [...prev, { label: `${deckName} · ${cardName}`, status }]);
      },
      onDeckComplete: ({ deckName, banned, legal, failed }) => {
        setRows((prev) => [...prev, { label: `${deckName} complete`, status: `${banned} banned / ${legal} legal / ${failed} failed` }]);
      },
      onError,
    });

    setBusy(false);
  };

  const cancelAudit = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const loadCache = async () => {
    setCacheStats(await getCacheStats());
    setSetVersion(await getSetListVersion());
  };

  return (
    <div style={{ background: t.bg, minHeight: '100vh', color: t.text, fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <h1>Middle Class Commander</h1>
      <p style={{ color: t.textMuted }}>A card is banned if it was printed at rare/mythic in a banned set.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['card', 'deck', 'folder', 'user'].map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{ background: m === mode ? t.accent : t.surface, border: `1px solid ${t.border}`, color: t.text, borderRadius: 8, padding: '6px 10px' }}>{m}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholders[mode]} style={{ flex: 1, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: 8 }} />
        <button onClick={runAudit} disabled={busy} style={{ background: t.accent, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px' }}>Audit</button>
        {busy && <button onClick={cancelAudit} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: '8px 14px' }}>Cancel</button>}
      </div>

      <div style={{ marginTop: 20, padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{title || 'No audit started'}</div>
        {summary && (
          <div style={{ color: t.textMuted, marginBottom: 8 }}>
            {summary.error ? `Error: ${summary.error}` : `${summary.banned} banned · ${summary.legal} legal · ${summary.failed} failed`}
          </div>
        )}
        <div style={{ maxHeight: 360, overflow: 'auto', display: 'grid', gap: 6 }}>
          {rows.map((row, index) => (
            <div key={`${row.label}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}`, paddingBottom: 4 }}>
              <span>{row.label}</span>
              {['banned', 'legal', 'failed', 'checking'].includes(row.status) ? <Status status={row.status} /> : <span style={{ color: t.textMuted }}>{row.status}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Cache</h3>
        <button onClick={loadCache} style={{ marginRight: 8 }}>Refresh Cache Stats</button>
        <button onClick={clearCache}>Clear Cache</button>
        {cacheStats && (
          <div style={{ marginTop: 8, color: t.textMuted }}>
            Entries: {cacheStats.count} · Oldest: {cacheStats.oldestEntry || 'n/a'} · Newest: {cacheStats.newestEntry || 'n/a'} · Approx bytes: {cacheStats.sizeEstimate} · Set list version: {setVersion}
          </div>
        )}
      </div>
    </div>
  );
}
