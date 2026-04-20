// Three layouts: Focus list, Zone grid, Pace table.
// Each takes { goals, onOpen, density, pinnedKey, onTogglePin }.

function LayoutFocus({ goals, onOpen, density, pinnedKey, onTogglePin }) {
  const rank = { 'behind': 0, 'on-track': 1, 'open': 2, 'ahead': 3, 'done': 4 };
  const sorted = [...goals].sort((a, b) => {
    const r = (rank[a.verdict] ?? 9) - (rank[b.verdict] ?? 9);
    if (r !== 0) return r;
    return b.pct - a.pct;
  });

  const gap = density === 'compact' ? 10 : 14;
  const pad = density === 'compact' ? '16px 20px' : '22px 26px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {sorted.map((g) => (
        <div key={g.key} onClick={() => onOpen(g)} style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr auto',
          gap: 20, alignItems: 'center',
          padding: pad,
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 180ms',
          boxShadow: 'var(--shadow)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hi)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--rule)'; }}
        >
          <div style={{ position: 'relative' }}>
            <ArcRing size={56} stroke={4} pct={g.pct} color={`var(--status-${g.verdict})`}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: `var(--status-${g.verdict})` }}>
                {Math.round(g.pct*100)}
              </span>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{g.zone}</span>
              <span style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--ink-4)' }}/>
              <Badge verdict={g.verdict}/>
              <div style={{ flex: 1 }}/>
              <PinButton pinned={pinnedKey === g.key} onClick={() => onTogglePin(g.key)}/>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: density === 'compact' ? 18 : 20, fontWeight: 500,
              color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.25,
              marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{g.goal}</div>
            {(g.kind === 'count' || g.kind === 'checklist') && (
              <ProgressBar pct={g.pct} marker={window.YEAR_PCT} color={`var(--status-${g.verdict})`} height={4}/>
            )}
            {g.kind === 'binary' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>One-time · Due {g.due}</div>
            )}
            {g.kind === 'percent' && (
              <ProgressBar pct={g.progress/100} marker={(g.target||0)/100} color={`var(--status-${g.verdict})`} height={4}/>
            )}
            {g.kind === 'open' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>Open · Due {g.due}</div>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: 140 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: density === 'compact' ? 22 : 26,
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {g.kind === 'percent' ? `${g.progress}%` :
               g.kind === 'binary' ? (g.progress >= 1 ? '✓' : '–') :
               g.kind === 'open' ? '—' :
               g.progress}
              {g.kind !== 'percent' && g.kind !== 'binary' && g.kind !== 'open' && (
                <span style={{ color: 'var(--ink-4)', fontSize: 14, marginLeft: 2 }}>/{g.target}</span>
              )}
            </div>
            {g.kind === 'count' && g.remaining > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                {g.neededPerMonth.toFixed(1)}/mo needed
              </div>
            )}
            {g.kind === 'count' && g.remaining === 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: `var(--status-done)`, marginTop: 4 }}>complete</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LayoutZones({ goals, onOpen, density, pinnedKey, onTogglePin }) {
  const byZone = {};
  for (const g of goals) (byZone[g.zone] = byZone[g.zone] || []).push(g);

  const prefOrder = ['Parkrun', 'Fitness', 'Music', 'Listening', 'Movies', 'Creative', 'Writing', 'Health', 'Blood', 'Volunteering', 'Getaways', 'One-offs', 'Life admin'];
  const seen = new Set();
  const zones = [];
  for (const z of prefOrder) if (byZone[z]) { zones.push(z); seen.add(z); }
  for (const z of Object.keys(byZone)) if (!seen.has(z)) zones.push(z);

  const cardPad = density === 'compact' ? 16 : 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 24 : 32 }}>
      {zones.map(zone => {
        const gs = byZone[zone];
        const zonePct = gs.reduce((a, g) => a + g.pct, 0) / gs.length;
        return (
          <div key={zone}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 12,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px solid var(--rule)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: density === 'compact' ? 22 : 26,
                fontWeight: 500,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
              }}>{zone}</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {gs.length} goal{gs.length===1?'':'s'} · {Math.round(zonePct*100)}% avg
              </div>
              <div style={{ flex: 1 }}/>
              <div style={{ display: 'flex', gap: 4 }}>
                {gs.map((g) => <StatusDot key={g.key} verdict={g.verdict} size={8}/>)}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${density === 'compact' ? 280 : 320}px, 1fr))`,
              gap: density === 'compact' ? 10 : 14,
            }}>
              {gs.map((g) => (
                <div key={g.key} onClick={() => onOpen(g)} style={{
                  padding: cardPad,
                  background: 'var(--paper)',
                  border: '1px solid var(--rule)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 180ms',
                  boxShadow: 'var(--shadow)',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  minHeight: density === 'compact' ? 140 : 160,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-hi)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Badge verdict={g.verdict}/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{g.due}</div>
                      <PinButton pinned={pinnedKey === g.key} onClick={() => onTogglePin(g.key)}/>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: density === 'compact' ? 17 : 19,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                    flex: 1,
                  }}>{g.goal}</div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 22, fontWeight: 500, color: 'var(--ink)',
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                      }}>
                        {g.kind === 'percent' ? `${g.progress}%` :
                         g.kind === 'binary' ? (g.progress >= 1 ? 'Done' : '—') :
                         g.kind === 'open' ? '—' :
                         g.progress}
                        {g.kind !== 'percent' && g.kind !== 'binary' && g.kind !== 'open' && (
                          <span style={{ color: 'var(--ink-4)', fontSize: 13, fontWeight: 400 }}> / {g.target}</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: `var(--status-${g.verdict})`, fontWeight: 500 }}>
                        {Math.round(g.pct*100)}%
                      </div>
                    </div>
                    {(g.kind === 'count' || g.kind === 'checklist' || g.kind === 'percent') && (
                      <ProgressBar
                        pct={g.kind === 'percent' ? g.progress/100 : g.pct}
                        marker={(g.kind === 'count' || g.kind === 'checklist') ? window.YEAR_PCT : null}
                        color={`var(--status-${g.verdict})`}
                        height={4}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LayoutTable({ goals, onOpen, density, sortKey, onSortKey, pinnedKey, onTogglePin }) {
  const rank = { 'behind': 0, 'on-track': 1, 'open': 2, 'ahead': 3, 'done': 4 };

  const sorted = [...goals].sort((a, b) => {
    if (sortKey === 'zone')     return a.zone.localeCompare(b.zone) || a.goal.localeCompare(b.goal);
    if (sortKey === 'progress') return b.pct - a.pct;
    if (sortKey === 'status')   return (rank[a.verdict] ?? 9) - (rank[b.verdict] ?? 9);
    if (sortKey === 'pace')     return (b.neededPerMonth - b.currentPerMonth) - (a.neededPerMonth - a.currentPerMonth);
    if (sortKey === 'due')      return (a.due || '').localeCompare(b.due || '');
    return 0;
  });

  const rowH = density === 'compact' ? 42 : 56;

  const th = (key, label, align = 'left', width) => (
    <th onClick={() => onSortKey(key)} style={{
      padding: `12px 14px`, textAlign: align,
      fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: sortKey === key ? 'var(--accent)' : 'var(--ink-3)',
      fontWeight: 600,
      borderBottom: '1px solid var(--rule)',
      cursor: 'pointer',
      userSelect: 'none',
      width,
      whiteSpace: 'nowrap',
    }}>
      {label} {sortKey === key ? '↓' : ''}
    </th>
  );

  return (
    <div style={{
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {th('status', '', 'center', 40)}
            {th('zone', 'Zone', 'left', 140)}
            <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600, borderBottom: '1px solid var(--rule)' }}>Goal</th>
            {th('progress', 'Progress', 'left', 180)}
            {th('pace', 'Pace', 'right', 150)}
            {th('due', 'Due', 'right', 90)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((g) => (
            <tr key={g.key} onClick={() => onOpen(g)} style={{
              cursor: 'pointer',
              height: rowH,
              transition: 'background 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-wash)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)', textAlign: 'center' }}>
                <StatusDot verdict={g.verdict} size={10}/>
              </td>
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{g.zone}</td>
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PinButton pinned={pinnedKey === g.key} onClick={() => onTogglePin(g.key)} size={20}/>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: density === 'compact' ? 14 : 16, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.005em' }}>
                    {g.goal}
                  </div>
                </div>
              </td>
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80 }}>
                    <ProgressBar pct={g.pct} color={`var(--status-${g.verdict})`} height={4} animate={false}/>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                    {g.kind === 'percent' ? `${g.progress}%` :
                     g.kind === 'binary' ? (g.progress >= 1 ? '✓' : '–') :
                     g.kind === 'open' ? '—' :
                     `${g.progress}/${g.target}`}
                  </div>
                </div>
              </td>
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                {g.kind === 'count' && g.remaining > 0 ? (
                  <span>
                    <span style={{ color: g.verdict === 'behind' ? 'var(--status-behind)' : 'var(--ink-2)' }}>{g.neededPerMonth.toFixed(1)}</span>
                    <span style={{ color: 'var(--ink-4)' }}> vs </span>
                    <span style={{ color: 'var(--ink-3)' }}>{g.currentPerMonth.toFixed(1)}/mo</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--ink-4)' }}>—</span>
                )}
              </td>
              <td style={{ padding: '0 14px', borderBottom: '1px solid var(--rule-soft)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{g.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { LayoutFocus, LayoutZones, LayoutTable });
