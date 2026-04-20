// Detail drawer with lazy-loaded per-zone activity log.
// Takes { goal, onClose, density }.

function DetailDrawer({ goal, onClose, density }) {
  const open = !!goal;
  const [log, setLog] = React.useState(null); // null = loading, [] = empty, [..] = loaded
  const [logErr, setLogErr] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  // Reset + lazy load log when goal changes
  React.useEffect(() => {
    if (!goal) return;
    setLog(null); setLogErr(false);
    let cancelled = false;
    window.loadZoneLog(goal.zone)
      .then(entries => { if (!cancelled) setLog(entries); })
      .catch(() => { if (!cancelled) { setLog([]); setLogErr(true); } });
    return () => { cancelled = true; };
  }, [goal && goal.key]);

  if (!open) return null;

  const g = goal;
  const pct = g.pct;
  const yearPct = window.YEAR_PCT;
  const color = `var(--status-${g.verdict})`;

  let pace = null, action = null;
  if (g.kind === 'count') {
    const cpm = g.currentPerMonth, npm = g.neededPerMonth;
    if (g.progress >= g.target) {
      pace = `Target reached. ${g.progress} of ${g.target} complete.`;
    } else if (g.progress === 0) {
      pace = `Not started. You need ${npm.toFixed(1)} per month for the remaining ${window.MO_LEFT.toFixed(1)} months.`;
      action = `Start this week, even 1 counts.`;
    } else if (cpm >= npm) {
      const weeksAhead = Math.max(0, (pct - yearPct) * 52);
      pace = `Doing ${cpm.toFixed(1)}/mo, only need ${npm.toFixed(1)}/mo.`;
      action = weeksAhead > 0 ? `You're ~${weeksAhead.toFixed(0)} weeks ahead of pace. Keep the rhythm.` : `Hold this pace.`;
    } else {
      const diff = npm - cpm;
      pace = `Averaging ${cpm.toFixed(1)}/mo, need ${npm.toFixed(1)}/mo.`;
      action = `Add ${diff.toFixed(1)} per month, roughly ${(diff/4).toFixed(1)} extra per week.`;
    }
  } else if (g.kind === 'binary') {
    pace = g.progress >= 1 ? 'Complete.' : `One-time goal. Due ${g.due}.`;
    action = g.progress >= 1 ? null : 'Book the date if you haven\u2019t already.';
  } else if (g.kind === 'percent') {
    pace = `Tracking at ${g.progress}% vs ${g.target}% target.`;
    action = g.progress < g.target ? `Keep logging daily, each good night nudges the %.` : null;
  } else if (g.kind === 'checklist') {
    pace = `${g.progress} of ${g.target} ticked.`;
    action = g.progress < g.target ? `${g.target - g.progress} small wins remaining.` : null;
  } else if (g.kind === 'open') {
    pace = `Open goal, due ${g.due}.`;
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,8,5,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'flex-end',
      animation: 'fade-in 180ms ease',
    }}>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(560px, 100vw)', height: '100%',
        background: 'var(--paper)',
        borderLeft: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-hi)',
        overflow: 'auto',
        padding: '28px 32px 48px',
        animation: 'slide-in 260ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>
            {g.zone} · Due {g.due}
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, border: '1px solid var(--rule)', borderRadius: 8,
            background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer', fontSize: 16,
            fontFamily: 'var(--font-body)',
          }}>×</button>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32, fontWeight: 500, lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          marginBottom: 20,
        }}>{g.goal}</h2>

        <div style={{
          display: 'flex', gap: 24, alignItems: 'center',
          padding: '20px 0',
          borderTop: '1px solid var(--rule)',
          borderBottom: '1px solid var(--rule)',
          marginBottom: 24,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ArcRing size={112} stroke={8} pct={pct} color={color}/>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, lineHeight: 1, color: 'var(--ink)' }}>
                {Math.round(pct*100)}<span style={{ fontSize: 14, color: 'var(--ink-3)' }}>%</span>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 2 }}>
                complete
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Badge verdict={g.verdict}/>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 44, fontWeight: 500, lineHeight: 1,
              color: 'var(--ink)',
              marginTop: 10,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {g.kind === 'percent' ? `${g.progress}%` :
               g.kind === 'binary' ? (g.progress >= 1 ? '✓' : '–') :
               g.kind === 'open' ? '—' :
               `${g.progress}`}
              <span style={{ color: 'var(--ink-3)', fontSize: 20, marginLeft: 4 }}>
                {g.kind === 'percent' || g.kind === 'open' || g.kind === 'binary' ? '' : `/ ${g.target}`}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {g.kind === 'count' && g.remaining > 0 ? `${g.remaining} remaining` : ''}
            </div>
          </div>
        </div>

        {(g.kind === 'count' || g.kind === 'checklist') && g.target > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              <span>0</span>
              <span>↓ year {Math.round(yearPct*100)}%</span>
              <span>{g.target}</span>
            </div>
            <ProgressBar pct={pct} marker={yearPct} color={color} height={10}/>
          </div>
        )}

        {g.kind === 'count' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <Stat label="Per month" value={g.currentPerMonth.toFixed(1)} sub="current"/>
            <Stat label="Per month" value={g.neededPerMonth.toFixed(1)} sub="needed" emphasis={g.verdict === 'behind'}/>
            <Stat label="Months left" value={window.MO_LEFT.toFixed(1)} sub="until Dec 31"/>
          </div>
        )}

        {(pace || action) && (
          <div style={{
            borderLeft: `3px solid var(--accent)`,
            padding: '14px 18px',
            background: 'var(--accent-wash)',
            borderRadius: '0 8px 8px 0',
            marginBottom: 28,
          }}>
            {pace && <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink)', fontWeight: 500 }}>{pace}</div>}
            {action && <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', marginTop: 6 }}>→ {action}</div>}
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 12 }}>
            Activity
          </div>
          {log === null && (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic', padding: '8px 0' }}>Loading recent entries…</div>
          )}
          {log !== null && log.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '8px 0' }}>
              {logErr ? 'Could not load activity for this zone.' : 'No recent entries in this zone sheet.'}
            </div>
          )}
          {log !== null && log.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {log.map((l, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '72px 1fr auto',
                  gap: 16,
                  padding: '10px 0',
                  borderBottom: i === log.length - 1 ? 'none' : '1px solid var(--rule-soft)',
                  alignItems: 'baseline',
                  fontSize: 13,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.02em' }}>{l.date || '—'}</div>
                  <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{l.label}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{l.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, emphasis }) {
  return (
    <div style={{
      padding: '14px 14px 12px',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      background: emphasis ? 'var(--accent-wash)' : 'transparent',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { DetailDrawer });
