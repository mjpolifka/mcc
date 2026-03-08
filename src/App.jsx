import { useRef, useState } from 'react';
import { auditCard, auditDeck, auditFolder, auditUser } from './lib/audit';

const t = {
  bg: '#0f1117',
  surface: '#1a1d27',
  border: '#2a2e42',
  text: '#e8eaf0',
  textMuted: '#6b7280',
  textDim: '#9ca3af',
  accent: '#4f6ef7',
  accentSoft: '#1e2a5e',
  legal: '#22c55e',
  legalSoft: '#052e16',
  banned: '#ef4444',
  bannedSoft: '#2d0707',
  pending: '#6b7280',
  warning: '#f59e0b',
  warningSoft: '#1c1400',
};

const HISTORY = {
  card: [
    { id: 'Sol Ring', name: 'Sol Ring', banned: true, ts: 'Today, 9:41 AM' },
    { id: 'Command Tower', name: 'Command Tower', banned: false, ts: 'Today, 9:39 AM' },
  ],
  deck: [
    { id: '182733', name: 'Atraxa Superfriends', banned: 12, total: 100, ts: 'Today, 9:41 AM' },
    { id: '204910', name: 'Krenko Goblin Tribal', banned: 2, total: 87, ts: 'Yesterday' },
  ],
  folder: [
    { id: 'f-8821', name: 'Competitive Builds', deckCount: 6, banned: 18, ts: 'Today, 8:02 AM' },
    { id: 'f-7743', name: 'Casual Night', deckCount: 4, banned: 3, ts: 'Feb 22' },
  ],
  user: [
    { id: 'grindstone99', name: 'grindstone99', deckCount: 14, banned: 31, ts: 'Today, 7:55 AM' },
    { id: 'spellslinger', name: 'spellslinger', deckCount: 7, banned: 5, ts: 'Feb 20' },
  ],
};

function StatusPill({ status }) {
  const map = {
    legal: { label: 'Legal', color: t.legal, bg: t.legalSoft },
    banned: { label: 'Banned', color: t.banned, bg: t.bannedSoft },
    checking: { label: 'Checking…', color: t.textMuted, bg: 'transparent' },
    failed: { label: 'Failed', color: t.warning, bg: t.warningSoft },
  };
  const s = map[status] || { label: status || '—', color: t.pending, bg: 'transparent' };

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: s.color,
        background: s.bg,
        padding: '2px 8px',
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {s.label}
    </span>
  );
}

function ProgressBar({ value, done }) {
  return (
    <div style={{ height: 4, background: t.border, borderRadius: 2, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: done ? t.legal : t.accent,
          borderRadius: 2,
          transition: 'width 0.25s ease',
        }}
      />
    </div>
  );
}

function HistoryRow({ mode, r, onSubmit }) {
  const meta = {
    card: r.ts,
    deck: `ID ${r.id} · ${r.total} cards · ${r.ts}`,
    folder: `ID ${r.id} · ${r.deckCount} deck${r.deckCount !== 1 ? 's' : ''} · ${r.ts}`,
    user: `${r.deckCount} deck${r.deckCount !== 1 ? 's' : ''} · ${r.ts}`,
  }[mode];

  const badge =
    mode === 'card'
      ? r.banned
        ? <span style={{ fontSize: 13, fontWeight: 600, color: t.banned }}>Banned</span>
        : <span style={{ fontSize: 13, fontWeight: 600, color: t.legal }}>Legal</span>
      : r.banned > 0
        ? <span style={{ fontSize: 13, fontWeight: 600, color: t.banned }}>{r.banned} banned</span>
        : <span style={{ fontSize: 13, fontWeight: 600, color: t.legal }}>All legal</span>;

  return (
    <button
      onClick={() => onSubmit(mode, r.id, r.name)}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{r.name}</div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{meta}</div>
      </div>
      {badge}
      <span style={{ color: t.textMuted, fontSize: 14 }}>→</span>
    </button>
  );
}

function EntryPage({ onSubmit }) {
  const [val, setVal] = useState('');
  const [mode, setMode] = useState('deck');

  const modes = [
    { id: 'card', label: 'Card' },
    { id: 'deck', label: 'Deck' },
    { id: 'folder', label: 'Folder' },
    { id: 'user', label: 'User' },
  ];

  const placeholder = {
    card: 'Enter card name…',
    deck: 'Enter Archidekt deck ID…',
    folder: 'Enter Archidekt folder ID…',
    user: 'Enter Archidekt username…',
  }[mode];

  const historyLabel = {
    card: 'Recent Card Lookups',
    deck: 'Recent Deck Audits',
    folder: 'Recent Folder Audits',
    user: 'Recent User Audits',
  }[mode];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px', color: t.text }}>
          Is your deck middle-class?
        </h1>
        <p style={{ fontSize: 14, color: t.textMuted, margin: 0 }}>
          A card is banned if it has ever been printed above uncommon in a non-ignored set.
        </p>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: '18px 18px 16px', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setVal('');
              }}
              style={{
                padding: '4px 13px',
                borderRadius: 6,
                border: `1px solid ${mode === m.id ? t.accent : t.border}`,
                background: mode === m.id ? t.accentSoft : 'transparent',
                color: mode === m.id ? t.accent : t.textDim,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && val && onSubmit(mode, val, null)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: t.bg,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              color: t.text,
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => val && onSubmit(mode, val, null)}
            style={{
              background: t.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Audit
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: t.textMuted, textTransform: 'uppercase', marginBottom: 10 }}>
        {historyLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {HISTORY[mode].map((r) => (
          <HistoryRow key={`${mode}-${r.id}`} mode={mode} r={r} onSubmit={onSubmit} />
        ))}
      </div>
    </div>
  );
}

function ResultsView({ audit, onBack }) {
  const { phase, title, rows, totals, processed, total, cancel, reset, error } = audit;

  const progress = total === 0 ? 0 : Math.round((processed / total) * 100);
  const done = phase === 'done';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 32, marginBottom: 20 }}>
        <button
          onClick={() => {
            reset();
            onBack();
          }}
          style={{
            background: 'transparent',
            border: `1px solid ${t.border}`,
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            color: t.textDim,
            fontSize: 12,
            whiteSpace: 'nowrap',
            marginTop: 2,
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 6 }}>{title || 'Running audit…'}</div>
          <ProgressBar value={progress} done={done} />
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>{processed}/{total} checked</span>
            {totals.banned > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: t.banned }}>{totals.banned} banned</span>}
            {done && <span style={{ fontSize: 12, fontWeight: 600, color: t.legal }}>{totals.legal} legal</span>}
            {phase === 'cancelled' && <span style={{ fontSize: 12, color: t.warning }}>Cancelled</span>}
            {error && <span style={{ fontSize: 12, color: t.warning }}>Error: {error}</span>}
          </div>
        </div>

        {phase === 'running' && (
          <button
            onClick={cancel}
            style={{
              background: 'transparent',
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              color: t.textDim,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {rows.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: t.textMuted, fontSize: 13 }}>Starting…</div>}
        {rows.map((row, i) => (
          <div
            key={`${row.name}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '9px 16px',
              borderBottom: i < rows.length - 1 ? `1px solid ${t.border}` : 'none',
              background: row.status === 'banned' ? `${t.bannedSoft}99` : 'transparent',
            }}
          >
            <span style={{ fontSize: 11, color: t.textMuted, width: 30, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1, fontSize: 14, color: t.text }}>{row.name}</span>
            <StatusPill status={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function useAuditController() {
  const [phase, setPhase] = useState('idle');
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ banned: 0, legal: 0, failed: 0 });
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const bumpTotals = (status) => {
    setTotals((prev) => ({
      ...prev,
      banned: prev.banned + (status === 'banned' ? 1 : 0),
      legal: prev.legal + (status === 'legal' ? 1 : 0),
      failed: prev.failed + (status === 'failed' ? 1 : 0),
    }));
  };

  const pushRow = (name, status) => {
    setRows((prev) => [...prev, { name, status }]);
    setProcessed((value) => value + (status === 'checking' ? 0 : 1));
    if (status !== 'checking') {
      bumpTotals(status);
    }
  };

  const reset = () => {
    setPhase('idle');
    setTitle('');
    setRows([]);
    setTotals({ banned: 0, legal: 0, failed: 0 });
    setProcessed(0);
    setTotal(0);
    setError('');
  };

  const cancel = () => {
    abortRef.current?.abort();
    setPhase('cancelled');
  };

  const run = async (mode, value, nameHint) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setPhase('running');
    setTitle(nameHint || value);
    setRows([]);
    setTotals({ banned: 0, legal: 0, failed: 0 });
    setProcessed(0);
    setTotal(0);
    setError('');

    const onError = (err) => {
      setError(err?.reason || 'unknown');
      setPhase('done');
    };

    if (mode === 'card') {
      setTotal(1);
      await auditCard(value, {
        onResult: ({ cardName, status }) => {
          if (status === 'checking') {
            setRows([{ name: cardName, status }]);
            return;
          }
          setRows([{ name: cardName, status }]);
          setProcessed(1);
          setTotals({ banned: status === 'banned' ? 1 : 0, legal: status === 'legal' ? 1 : 0, failed: status === 'failed' ? 1 : 0 });
          setPhase('done');
        },
      });
      return;
    }

    if (mode === 'deck') {
      await auditDeck(value, {
        signal: abortRef.current.signal,
        onError,
        onDeckInfo: (info) => {
          setTitle(`${info.name}`);
          setTotal(info.totalCards);
        },
        onCardResult: ({ cardName, status }) => {
          if (abortRef.current.signal.aborted) return;
          pushRow(cardName, status);
        },
        onComplete: () => {
          if (!abortRef.current.signal.aborted) setPhase('done');
        },
      });
      return;
    }

    const runGroup = mode === 'folder' ? auditFolder : auditUser;

    await runGroup(value, {
      signal: abortRef.current.signal,
      onError,
      onFolderInfo: (info) => setTitle(`${info.name}`),
      onDeckStart: ({ name }) => {
        if (abortRef.current.signal.aborted) return;
        setRows((prev) => [...prev, { name: `Deck: ${name}`, status: 'checking' }]);
      },
      onDeckCardResult: ({ deckName, cardName, status }) => {
        if (abortRef.current.signal.aborted) return;
        pushRow(`${deckName} · ${cardName}`, status);
      },
      onDeckComplete: ({ deckName, banned, legal, failed }) => {
        if (abortRef.current.signal.aborted) return;
        setRows((prev) => [...prev, { name: `${deckName} complete (${banned}/${legal}/${failed})`, status: 'legal' }]);
      },
    });

    if (!abortRef.current.signal.aborted) {
      setPhase('done');
    }
  };

  return { phase, title, rows, totals, processed, total, error, run, cancel, reset };
}

export default function App() {
  const [view, setView] = useState('entry');
  const audit = useAuditController();

  const handleSubmit = async (mode, value, nameHint) => {
    setView('results');
    await audit.run(mode, value, nameHint);
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${t.textMuted}; }
        button { font-family: inherit; transition: opacity 0.1s; }
        button:hover { opacity: 0.82; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${t.border}`, padding: '13px 32px', display: 'flex', alignItems: 'center', background: t.surface }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: t.text }}>Middle Class Commander</span>
      </div>

      <div style={{ padding: '0 32px' }}>
        {view === 'entry' && <EntryPage onSubmit={handleSubmit} />}
        {view === 'results' && <ResultsView audit={audit} onBack={() => setView('entry')} />}
      </div>
    </div>
  );
}
