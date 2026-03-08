import { useState, useRef } from "react";

// ─── Theme ───────────────────────────────────────────────────────────────────
const t = {
  bg: "#0f1117",
  surface: "#1a1d27",
  border: "#2a2e42",
  borderFocus: "#4f6ef7",
  text: "#e8eaf0",
  textMuted: "#6b7280",
  textDim: "#9ca3af",
  accent: "#4f6ef7",
  accentSoft: "#1e2a5e",
  legal: "#22c55e",
  legalSoft: "#052e16",
  banned: "#ef4444",
  bannedSoft: "#2d0707",
  pending: "#6b7280",
  warning: "#f59e0b",
  warningSoft: "#1c1400",
};

// ─── 100 fake cards ───────────────────────────────────────────────────────────
const FAKE_CARDS = [
  { name: "Sol Ring",                    result: "banned" },
  { name: "Command Tower",               result: "legal" },
  { name: "Arcane Signet",               result: "legal" },
  { name: "Rhystic Study",               result: "banned" },
  { name: "Demonic Tutor",               result: "banned" },
  { name: "Swords to Plowshares",        result: "legal" },
  { name: "Counterspell",                result: "legal" },
  { name: "Cyclonic Rift",               result: "banned" },
  { name: "Lightning Greaves",           result: "legal" },
  { name: "Swiftfoot Boots",             result: "legal" },
  { name: "Path to Exile",               result: "legal" },
  { name: "Mana Crypt",                  result: "banned" },
  { name: "Cultivate",                   result: "legal" },
  { name: "Kodama's Reach",              result: "legal" },
  { name: "Farseek",                     result: "legal" },
  { name: "Beast Within",                result: "legal" },
  { name: "Blasphemous Act",             result: "legal" },
  { name: "Toxic Deluge",                result: "banned" },
  { name: "Smothering Tithe",            result: "banned" },
  { name: "Dockside Extortionist",       result: "banned" },
  { name: "Atraxa, Praetors' Voice",     result: "banned" },
  { name: "Doubling Season",             result: "banned" },
  { name: "Cabal Coffers",               result: "banned" },
  { name: "Urborg, Tomb of Yawgmoth",    result: "banned" },
  { name: "Polluted Delta",              result: "banned" },
  { name: "Dimir Signet",                result: "legal" },
  { name: "Talisman of Dominance",       result: "legal" },
  { name: "Thought Vessel",              result: "legal" },
  { name: "Mind Stone",                  result: "legal" },
  { name: "Solemn Simulacrum",           result: "legal" },
  { name: "Rampant Growth",              result: "legal" },
  { name: "Three Visits",                result: "legal" },
  { name: "Nature's Lore",               result: "legal" },
  { name: "Skyshroud Claim",             result: "legal" },
  { name: "Coiling Oracle",              result: "legal" },
  { name: "Acidic Slime",                result: "legal" },
  { name: "Wood Elves",                  result: "legal" },
  { name: "Farhaven Elf",                result: "legal" },
  { name: "Eternal Witness",             result: "legal" },
  { name: "Fauna Shaman",                result: "legal" },
  { name: "Phyrexian Arena",             result: "banned" },
  { name: "Necropotence",                result: "banned" },
  { name: "Read the Bones",              result: "legal" },
  { name: "Night's Whisper",             result: "legal" },
  { name: "Sign in Blood",               result: "legal" },
  { name: "Preordain",                   result: "legal" },
  { name: "Ponder",                      result: "legal" },
  { name: "Brainstorm",                  result: "legal" },
  { name: "Opt",                         result: "legal" },
  { name: "Impulse",                     result: "legal" },
  { name: "Fact or Fiction",             result: "legal" },
  { name: "Dig Through Time",            result: "banned" },
  { name: "Treasure Cruise",             result: "legal" },
  { name: "Windfall",                    result: "legal" },
  { name: "Wheel of Fortune",            result: "banned" },
  { name: "Mystic Remora",               result: "legal" },
  { name: "Propaganda",                  result: "legal" },
  { name: "Ghostly Prison",              result: "legal" },
  { name: "Arcane Laboratory",           result: "legal" },
  { name: "Meekstone",                   result: "legal" },
  { name: "Wrath of God",                result: "banned" },
  { name: "Damnation",                   result: "banned" },
  { name: "Supreme Verdict",             result: "banned" },
  { name: "Languish",                    result: "legal" },
  { name: "Crux of Fate",                result: "legal" },
  { name: "Vandalblast",                 result: "legal" },
  { name: "Chaos Warp",                  result: "legal" },
  { name: "Generous Gift",               result: "legal" },
  { name: "Krosan Grip",                 result: "legal" },
  { name: "Nature's Claim",              result: "legal" },
  { name: "Assassin's Trophy",           result: "banned" },
  { name: "Abrupt Decay",                result: "banned" },
  { name: "Vindicate",                   result: "legal" },
  { name: "Anguished Unmaking",          result: "banned" },
  { name: "Despark",                     result: "legal" },
  { name: "Return to Dust",              result: "legal" },
  { name: "Swan Song",                   result: "legal" },
  { name: "Negate",                      result: "legal" },
  { name: "Delay",                       result: "legal" },
  { name: "Spell Pierce",                result: "legal" },
  { name: "Dovin's Veto",                result: "legal" },
  { name: "Mystical Tutor",              result: "banned" },
  { name: "Enlightened Tutor",           result: "banned" },
  { name: "Worldly Tutor",               result: "legal" },
  { name: "Vampiric Tutor",              result: "banned" },
  { name: "Diabolic Tutor",              result: "legal" },
  { name: "Temple of Mystery",           result: "legal" },
  { name: "Evolving Wilds",              result: "legal" },
  { name: "Terramorphic Expanse",        result: "legal" },
  { name: "Reliquary Tower",             result: "legal" },
  { name: "Exotic Orchard",              result: "legal" },
  { name: "Path of Ancestry",            result: "legal" },
  { name: "Ash Barrens",                 result: "legal" },
  { name: "Myriad Landscape",            result: "legal" },
  { name: "Swamp",                       result: "legal" },
  { name: "Forest",                      result: "legal" },
  { name: "Island",                      result: "legal" },
  { name: "Plains",                      result: "legal" },
  { name: "Mountain",                    result: "legal" },
  { name: "Exotic Orchard",              result: "legal" },
  { name: "Llanowar Wastes",             result: "banned" },
  { name: "Yavimaya Coast",              result: "banned" },
];

// ─── Per-mode history (static mock) ──────────────────────────────────────────
const HISTORY = {
  card: [
    { id: "sol-ring",          name: "Sol Ring",              banned: true,  ts: "Today, 9:41 AM" },
    { id: "command-tower",     name: "Command Tower",         banned: false, ts: "Today, 9:39 AM" },
    { id: "rhystic-study",     name: "Rhystic Study",         banned: true,  ts: "Yesterday" },
    { id: "arcane-signet",     name: "Arcane Signet",         banned: false, ts: "Feb 21" },
    { id: "demonic-tutor",     name: "Demonic Tutor",         banned: true,  ts: "Feb 18" },
  ],
  deck: [
    { id: "182733", name: "Atraxa Superfriends",   banned: 12, total: 100, ts: "Today, 9:41 AM" },
    { id: "204910", name: "Krenko Goblin Tribal",   banned: 2,  total: 87,  ts: "Yesterday" },
    { id: "198432", name: "Muldrotha Value Pile",   banned: 0,  total: 91,  ts: "Feb 21" },
    { id: "177021", name: "Ur-Dragon",              banned: 8,  total: 100, ts: "Feb 18" },
  ],
  folder: [
    { id: "f-8821", name: "Competitive Builds",    deckCount: 6,  banned: 18, ts: "Today, 8:02 AM" },
    { id: "f-7743", name: "Casual Night",           deckCount: 4,  banned: 3,  ts: "Feb 22" },
    { id: "f-6610", name: "Budget Experiments",     deckCount: 9,  banned: 0,  ts: "Feb 19" },
  ],
  user: [
    { id: "grindstone99",  name: "grindstone99",   deckCount: 14, banned: 31, ts: "Today, 7:55 AM" },
    { id: "spellslinger",  name: "spellslinger",   deckCount: 7,  banned: 5,  ts: "Feb 20" },
    { id: "muldrothamain", name: "muldrothamain",  deckCount: 22, banned: 0,  ts: "Feb 17" },
  ],
};

// ─── Audit hook ───────────────────────────────────────────────────────────────
function useDeckAudit() {
  const [phase, setPhase] = useState("idle");
  const [deckName, setDeckName] = useState("");
  const [cards, setCards] = useState([]);
  const cancelRef = useRef(false);

  const start = async (id, name) => {
    cancelRef.current = false;
    setPhase("running");
    setDeckName(name || `Deck #${id}`);
    setCards([]);

    for (let i = 0; i < FAKE_CARDS.length; i++) {
      if (cancelRef.current) break;
      await new Promise((r) => setTimeout(r, 55 + Math.random() * 70));
      if (cancelRef.current) break;
      setCards((prev) => [...prev, { ...FAKE_CARDS[i], status: "checking" }]);
      await new Promise((r) => setTimeout(r, 35 + Math.random() * 55));
      if (cancelRef.current) break;
      setCards((prev) =>
        prev.map((c, idx) => idx === i ? { ...c, status: FAKE_CARDS[i].result } : c)
      );
    }
    if (!cancelRef.current) setPhase("done");
  };

  const cancel = () => { cancelRef.current = true; setPhase("cancelled"); };
  const reset  = () => { setPhase("idle"); setCards([]); setDeckName(""); };

  return { phase, deckName, cards, start, cancel, reset };
}

// ─── Small components ─────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    legal:    { label: "Legal",     color: t.legal,    bg: t.legalSoft },
    banned:   { label: "Banned",    color: t.banned,   bg: t.bannedSoft },
    checking: { label: "Checking…", color: t.textMuted, bg: "transparent" },
    failed:   { label: "Failed",    color: t.warning,  bg: t.warningSoft },
  };
  const s = map[status] || { label: "—", color: t.pending, bg: "transparent" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", color: s.color, background: s.bg,
      padding: "2px 8px", borderRadius: 4,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{s.label}</span>
  );
}

function ProgressBar({ value, done }) {
  return (
    <div style={{ height: 4, background: t.border, borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${value}%`,
        background: done ? t.legal : t.accent,
        borderRadius: 2, transition: "width 0.25s ease",
      }} />
    </div>
  );
}

// ─── Entry page ───────────────────────────────────────────────────────────────
function HistoryRow({ mode, r, onSubmit }) {
  const meta = {
    card:   r.ts,
    deck:   `ID ${r.id} · ${r.total} cards · ${r.ts}`,
    folder: `ID ${r.id} · ${r.deckCount} deck${r.deckCount !== 1 ? "s" : ""} · ${r.ts}`,
    user:   `${r.deckCount} deck${r.deckCount !== 1 ? "s" : ""} · ${r.ts}`,
  }[mode];

  const badge = mode === "card"
    ? (r.banned
        ? <span style={{ fontSize: 13, fontWeight: 600, color: t.banned }}>Banned</span>
        : <span style={{ fontSize: 13, fontWeight: 600, color: t.legal }}>Legal</span>)
    : (r.banned > 0
        ? <span style={{ fontSize: 13, fontWeight: 600, color: t.banned }}>{r.banned} banned</span>
        : <span style={{ fontSize: 13, fontWeight: 600, color: t.legal }}>All legal</span>);

  return (
    <button
      onClick={() => onSubmit(r.id, r.name)}
      style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 14,
        cursor: "pointer", textAlign: "left", width: "100%",
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
  const [val, setVal] = useState("");
  const [mode, setMode] = useState("deck");

  const modes = [
    { id: "card",   label: "Card" },
    { id: "deck",   label: "Deck" },
    { id: "folder", label: "Folder" },
    { id: "user",   label: "User" },
  ];
  const placeholder = {
    card:   "Enter card name…",
    deck:   "Enter Archidekt deck ID…",
    folder: "Enter Archidekt folder ID…",
    user:   "Enter Archidekt username…",
  }[mode];

  const historyLabel = {
    card:   "Recent Card Lookups",
    deck:   "Recent Deck Audits",
    folder: "Recent Folder Audits",
    user:   "Recent User Audits",
  }[mode];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 0 64px" }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
          margin: "0 0 6px", color: t.text,
        }}>
          Is your deck middle-class?
        </h1>
        <p style={{ fontSize: 14, color: t.textMuted, margin: 0 }}>
          A card is banned if it has ever been printed above uncommon in a non-ignored set.
        </p>
      </div>

      {/* Input panel */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: "18px 18px 16px", marginBottom: 28,
      }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {modes.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setVal(""); }} style={{
              padding: "4px 13px", borderRadius: 6,
              border: `1px solid ${mode === m.id ? t.accent : t.border}`,
              background: mode === m.id ? t.accentSoft : "transparent",
              color: mode === m.id ? t.accent : t.textDim,
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && val && onSubmit(val, null)}
            placeholder={placeholder}
            style={{
              flex: 1, background: t.bg, border: `1px solid ${t.border}`,
              borderRadius: 8, padding: "10px 14px", color: t.text,
              fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => val && onSubmit(val, null)}
            style={{
              background: t.accent, color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 22px",
              cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}>Audit</button>
        </div>
      </div>

      {/* History — changes with mode */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        color: t.textMuted, textTransform: "uppercase", marginBottom: 10,
      }}>{historyLabel}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {HISTORY[mode].map((r) => (
          <HistoryRow key={r.id} mode={mode} r={r} onSubmit={onSubmit} />
        ))}
      </div>
    </div>
  );
}

// ─── Deck results ─────────────────────────────────────────────────────────────
function DeckView({ audit, onBack }) {
  const { phase, deckName, cards, cancel, reset } = audit;
  const total    = FAKE_CARDS.length;
  const resolved = cards.filter((c) => c.status !== "checking").length;
  const banned   = cards.filter((c) => c.status === "banned").length;
  const legal    = cards.filter((c) => c.status === "legal").length;
  const progress = Math.round((resolved / total) * 100);
  const isDone   = phase === "done";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 64 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        paddingTop: 32, marginBottom: 20,
      }}>
        <button onClick={() => { reset(); onBack(); }} style={{
          background: "transparent", border: `1px solid ${t.border}`,
          borderRadius: 6, padding: "6px 12px", cursor: "pointer",
          color: t.textDim, fontSize: 12, whiteSpace: "nowrap", marginTop: 2,
        }}>← Back</button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 6 }}>
            {deckName}
          </div>
          <ProgressBar value={progress} done={isDone} />
          <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: t.textMuted }}>{resolved}/{total} checked</span>
            {banned > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: t.banned }}>{banned} banned</span>
            )}
            {isDone && (
              <span style={{ fontSize: 12, fontWeight: 600, color: t.legal }}>{legal} legal</span>
            )}
            {phase === "cancelled" && (
              <span style={{ fontSize: 12, color: t.warning }}>Cancelled</span>
            )}
          </div>
        </div>

        {phase === "running" && (
          <button onClick={cancel} style={{
            background: "transparent", border: `1px solid ${t.border}`,
            borderRadius: 6, padding: "6px 14px", cursor: "pointer",
            color: t.textDim, fontSize: 12, marginTop: 2,
          }}>Cancel</button>
        )}
      </div>

      {/* Summary chips when done */}
      {isDone && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{
            background: t.bannedSoft, border: `1px solid ${t.banned}33`,
            borderRadius: 8, padding: "10px 16px", flex: 1,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.banned }}>{banned}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Banned cards</div>
          </div>
          <div style={{
            background: t.legalSoft, border: `1px solid ${t.legal}33`,
            borderRadius: 8, padding: "10px 16px", flex: 1,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.legal }}>{legal}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Legal cards</div>
          </div>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: "10px 16px", flex: 1,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{total}</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Total cards</div>
          </div>
        </div>
      )}

      {/* Card list */}
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 10, overflow: "hidden",
      }}>
        {cards.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: t.textMuted, fontSize: 13 }}>
            Fetching deck…
          </div>
        )}
        {cards.map((card, i) => (
          <div key={`${card.name}-${i}`} style={{
            display: "flex", alignItems: "center",
            padding: "9px 16px",
            borderBottom: i < cards.length - 1 ? `1px solid ${t.border}` : "none",
            background: card.status === "banned" ? `${t.bannedSoft}99` : "transparent",
            transition: "background 0.25s",
          }}>
            <span style={{
              fontSize: 11, color: t.textMuted, width: 30, flexShrink: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ flex: 1, fontSize: 14, color: t.text }}>{card.name}</span>
            <StatusPill status={card.status} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: t.textMuted, textAlign: "center" }}>
        Deck data from Archidekt · Card/printing data from Scryfall
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("entry");
  const audit = useDeckAudit();

  const handleSubmit = (id, name) => {
    setView("deck");
    audit.start(id, name);
  };

  return (
    <div style={{
      minHeight: "100vh", background: t.bg, color: t.text,
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        input::placeholder { color: ${t.textMuted}; }
        button { font-family: inherit; transition: opacity 0.1s; }
        button:hover { opacity: 0.82; }
      `}</style>

      {/* Nav */}
      <div style={{
        borderBottom: `1px solid ${t.border}`, padding: "13px 32px",
        display: "flex", alignItems: "center", background: t.surface,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: t.text }}>
          Middle Class Commander
        </span>
      </div>

      <div style={{ padding: "0 32px" }}>
        {view === "entry" && <EntryPage onSubmit={handleSubmit} />}
        {view === "deck"  && <DeckView  audit={audit} onBack={() => setView("entry")} />}
      </div>
    </div>
  );
}
