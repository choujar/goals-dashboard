// Hero block — year pulse + focus banner.
// Takes { summary, goals, density, pinnedGoal, onUnpin }.

function Hero({ summary, goals, density, pinnedGoal, onUnpin }) {
  const S = summary;
  const pad = density === 'compact' ? '24px 28px' : '36px 40px';

  let focusLine = null;
  if (pinnedGoal) {
    const g = pinnedGoal;
    if (g.kind === 'count' && g.remaining > 0) {
      const diff = Math.max(0, g.neededPerMonth - g.currentPerMonth);
      const detail = diff > 0
        ? `Add ${diff.toFixed(1)} per month to get on pace, about ${(diff/4).toFixed(1)} extra per week.`
        : `You're at ${g.progress}/${g.target}. Hold ${g.neededPerMonth.toFixed(1)}/mo to finish.`;
      focusLine = { kicker: 'Pinned this week', title: g.goal, detail };
    } else if (g.kind === 'binary') {
      focusLine = { kicker: 'Pinned this week', title: g.goal, detail: `One-time goal, due ${g.due}.` };
    } else {
      focusLine = { kicker: 'Pinned this week', title: g.goal, detail: `${g.zone} · due ${g.due}.` };
    }
  } else {
    const behindGoals = goals.filter(g => g.verdict === 'behind' && g.kind === 'count');
    const topBehind = behindGoals.sort((a,b) => (b.neededPerMonth - b.currentPerMonth) - (a.neededPerMonth - a.currentPerMonth))[0];
    if (topBehind) {
      const diff = Math.max(0, topBehind.neededPerMonth - topBehind.currentPerMonth);
      focusLine = {
        kicker: 'This week, focus on',
        title: topBehind.goal,
        detail: diff > 0
          ? `Add ${diff.toFixed(1)} per month to get back on pace, about ${(diff/4).toFixed(1)} extra per week.`
          : `Needs ${topBehind.neededPerMonth.toFixed(1)}/mo to hit target.`,
      };
    } else {
      focusLine = {
        kicker: 'Nice work',
        title: 'Everything is on pace or ahead',
        detail: 'Keep the rhythm. Log the wins as they happen.',
      };
    }
  }

  return (
    <div style={{
      padding: pad,
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: 14,
      boxShadow: 'var(--shadow)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 10 }}>
            {S.todayStr}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: density === 'compact' ? 38 : 52,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
            color: 'var(--ink)',
            marginBottom: 8,
          }}>
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{TODAY.getFullYear()}</span> is {Math.round(S.yearPct*100)}% done.
          </h1>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{S.daysIn} days in</span>
            <span style={{ margin: '0 10px', color: 'var(--ink-4)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{S.daysLeft} days left</span>
            <span style={{ margin: '0 10px', color: 'var(--ink-4)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{S.monthsLeft.toFixed(1)} months to go</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: density === 'compact' ? 16 : 22, flexWrap: 'wrap' }}>
          <Pulse label="Ahead"    value={S.ahead + S.done} verdict="ahead"    total={S.total}/>
          <Pulse label="On track" value={S.onTrack}        verdict="on-track" total={S.total}/>
          <Pulse label="Behind"   value={S.behind}         verdict="behind"   total={S.total}/>
          <Pulse label="Open"     value={S.open}           verdict="open"     total={S.total}/>
        </div>
      </div>

      <div style={{
        marginTop: density === 'compact' ? 20 : 28,
        padding: density === 'compact' ? '16px 20px 4px' : '20px 24px 4px',
        borderTop: '1px solid var(--rule)',
        display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700 }}>
              {focusLine.kicker}
            </div>
            {pinnedGoal && (
              <button onClick={onUnpin} title="Unpin, return to auto-focus" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px 2px 6px',
                background: 'var(--accent-wash)',
                border: '1px solid var(--rule)',
                borderRadius: 999,
                color: 'var(--accent)',
                fontSize: 10, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>
                <span style={{ fontSize: 10 }}>📌</span>
                <span>Unpin</span>
              </button>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: density === 'compact' ? 22 : 28,
            fontWeight: 500, lineHeight: 1.2,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            marginBottom: 6,
          }}>{focusLine.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 620 }}>
            {focusLine.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pulse({ label, value, verdict, total }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 110 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ArcRing size={42} stroke={3.5} pct={pct} color={`var(--status-${verdict})`} track="var(--rule)"/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: `var(--status-${verdict})`, lineHeight: 1 }}>{value}</span>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 1, whiteSpace: 'nowrap' }}>{Math.round(pct*100)}% of {total}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Hero });
