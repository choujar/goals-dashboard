// Theme tokens + primitives.
// Exposes via window: THEMES, ACCENTS, STATUS, TYPE_PAIRS, applyTheme,
//   ArcRing, ProgressBar, StatusDot, Badge, IconBtn, PinButton

const THEMES = {
  light: {
    '--bg':          '#f5f1e8',
    '--paper':       '#fbf8f0',
    '--ink':         '#1a1712',
    '--ink-2':       '#4a463d',
    '--ink-3':       '#7a7468',
    '--ink-4':       '#a8a294',
    '--rule':        '#e4dfd1',
    '--rule-soft':   '#ece7d8',
    '--surface':     '#ffffffcc',
    '--shadow':      '0 1px 0 rgba(26,23,18,0.04), 0 8px 24px rgba(26,23,18,0.06)',
    '--shadow-hi':   '0 2px 0 rgba(26,23,18,0.06), 0 18px 44px rgba(26,23,18,0.12)',
  },
  dark: {
    '--bg':          '#14110d',
    '--paper':       '#1b1813',
    '--ink':         '#f5f1e8',
    '--ink-2':       '#c8c1b0',
    '--ink-3':       '#8f877a',
    '--ink-4':       '#5e584d',
    '--rule':        '#2a2620',
    '--rule-soft':   '#221e18',
    '--surface':     '#201c16cc',
    '--shadow':      '0 1px 0 rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)',
    '--shadow-hi':   '0 2px 0 rgba(0,0,0,0.5), 0 18px 44px rgba(0,0,0,0.55)',
  },
};

const ACCENTS = {
  ember:  { name: 'Ember',  accent: 'oklch(62% 0.16 42)',  accentHi: 'oklch(70% 0.16 42)',  accentWash: 'oklch(62% 0.16 42 / 0.10)' },
  forest: { name: 'Forest', accent: 'oklch(55% 0.12 155)', accentHi: 'oklch(63% 0.12 155)', accentWash: 'oklch(55% 0.12 155 / 0.12)' },
  cobalt: { name: 'Cobalt', accent: 'oklch(55% 0.15 255)', accentHi: 'oklch(64% 0.15 255)', accentWash: 'oklch(55% 0.15 255 / 0.12)' },
};

const STATUS = {
  ahead:      { light: 'oklch(52% 0.12 155)', dark: 'oklch(68% 0.12 155)', label: 'Ahead' },
  done:       { light: 'oklch(52% 0.12 155)', dark: 'oklch(68% 0.12 155)', label: 'Done' },
  'on-track': { light: 'oklch(58% 0.14 80)',  dark: 'oklch(72% 0.14 80)',  label: 'On track' },
  behind:     { light: 'oklch(55% 0.17 25)',  dark: 'oklch(68% 0.17 25)',  label: 'Behind' },
  open:       { light: 'oklch(55% 0.01 80)',  dark: 'oklch(60% 0.01 80)',  label: 'Open' },
};

const TYPE_PAIRS = {
  editorial: {
    name: 'Editorial',
    display: `'Fraunces', Georgia, serif`,
    body: `'Inter Tight', -apple-system, system-ui, sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, monospace`,
    fetch: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
  neogrotesk: {
    name: 'Neo-grotesk',
    display: `'Instrument Serif', Georgia, serif`,
    body: `'Inter Tight', -apple-system, system-ui, sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, monospace`,
    fetch: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  },
};

function applyTheme({ mode = 'light', accentKey = 'cobalt', typePair = 'editorial' } = {}) {
  const root = document.documentElement;
  const t = THEMES[mode];
  for (const k in t) root.style.setProperty(k, t[k]);
  const a = ACCENTS[accentKey];
  root.style.setProperty('--accent', a.accent);
  root.style.setProperty('--accent-hi', a.accentHi);
  root.style.setProperty('--accent-wash', a.accentWash);
  const p = TYPE_PAIRS[typePair];
  root.style.setProperty('--font-display', p.display);
  root.style.setProperty('--font-body', p.body);
  root.style.setProperty('--font-mono', p.mono);
  root.dataset.theme = mode;
  for (const k in STATUS) root.style.setProperty(`--status-${k}`, STATUS[k][mode]);

  const id = 'typepair-font';
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== p.fetch) link.href = p.fetch;
}

function ArcRing({ size = 120, stroke = 8, pct = 0, color, track = 'var(--rule)', animate = true }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = React.useState(0);
  React.useEffect(() => {
    if (!animate) { setAnimated(pct); return; }
    const id = requestAnimationFrame(() => setAnimated(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, animate]);
  const offset = circ * (1 - Math.min(Math.max(animated, 0), 1));
  const c = color || 'var(--accent)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={c} strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(.2,.8,.2,1)', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
}

function ProgressBar({ pct = 0, marker = null, color, height = 6, animate = true, track = 'var(--rule)' }) {
  const [animated, setAnimated] = React.useState(0);
  React.useEffect(() => {
    if (!animate) { setAnimated(pct); return; }
    const id = setTimeout(() => setAnimated(pct), 50);
    return () => clearTimeout(id);
  }, [pct, animate]);
  return (
    <div style={{ position: 'relative', height, background: track, borderRadius: height/2, overflow: 'visible' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.min(animated, 1) * 100}%`,
        background: color || 'var(--accent)',
        borderRadius: height/2,
        transition: 'width 1200ms cubic-bezier(.2,.8,.2,1)',
      }}/>
      {marker != null && (
        <div style={{
          position: 'absolute', left: `${Math.min(marker, 1) * 100}%`,
          top: -3, bottom: -3,
          width: 2,
          background: 'var(--ink-2)',
          borderRadius: 1,
          transform: 'translateX(-1px)',
          opacity: 0.6,
        }} title={`Year pace: ${Math.round(marker*100)}%`}/>
      )}
    </div>
  );
}

function StatusDot({ verdict, size = 8 }) {
  return <span style={{
    display: 'inline-block', width: size, height: size, borderRadius: size,
    background: `var(--status-${verdict})`,
  }}/>;
}

function Badge({ verdict, children }) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
    color: `var(--status-${verdict})`,
    background: 'transparent',
    padding: '3px 8px 3px 6px',
    border: `1px solid var(--rule)`,
    borderRadius: 999,
    fontFamily: 'var(--font-body)',
  }}>
    <StatusDot verdict={verdict} size={6}/>
    {children || STATUS[verdict]?.label || verdict}
  </span>;
}

function IconBtn({ children, onClick, title, active, style }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        height: 30, minWidth: 30, padding: '0 10px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: active ? 'var(--ink)' : (h ? 'var(--rule-soft)' : 'transparent'),
        color: active ? 'var(--paper)' : 'var(--ink-2)',
        border: '1px solid var(--rule)',
        borderRadius: 8,
        fontSize: 12, fontWeight: 500,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        transition: 'all 140ms',
        ...style,
      }}>
      {children}
    </button>
  );
}

function PinButton({ pinned, onClick, size = 22 }) {
  const [h, setH] = React.useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      title={pinned ? 'Unpin from focus' : 'Pin as this week\u2019s focus'}
      style={{
        width: size, height: size,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: pinned ? 'var(--accent-wash)' : (h ? 'var(--rule-soft)' : 'transparent'),
        border: `1px solid ${pinned ? 'var(--accent)' : 'var(--rule)'}`,
        borderRadius: 999,
        color: pinned ? 'var(--accent)' : 'var(--ink-3)',
        cursor: 'pointer', padding: 0,
        transition: 'all 160ms',
        flexShrink: 0,
      }}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 2l4 4-2 1-1 3-5-5 3-1 1-2z"/>
        <path d="M6 10l-3 4"/>
      </svg>
    </button>
  );
}

Object.assign(window, {
  THEMES, ACCENTS, STATUS, TYPE_PAIRS, applyTheme,
  ArcRing, ProgressBar, StatusDot, Badge, IconBtn, PinButton,
});
