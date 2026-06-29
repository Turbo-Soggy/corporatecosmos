import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

function CompanySide({ company, side, frame, fps }) {
  const delay = side === 'left' ? 6 : 12;
  const enter = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 18, stiffness: 140 } });
  const x = (1 - enter) * (side === 'left' ? -70 : 70);
  const rows = [
    ['VALUATION', company.valuation],
    ['YOY GROWTH', company.growth],
    ['EMPLOYEES', company.employees],
    ['PROFITABILITY', company.profitability],
  ];
  return (
    <div style={{ width: '43%', transform: `translateX(${x}px)`, opacity: enter }}>
      <div style={{ color: company.color, fontSize: 10, letterSpacing: '0.24em' }}>{company.sector}</div>
      <div style={{ color: '#E6EDF7', fontSize: 30, fontWeight: 650, marginTop: 8 }}>{company.name}</div>
      <div style={{ marginTop: 26 }}>
        {rows.map(([label, value], index) => {
          const rowOpacity = interpolate(frame, [20 + index * 7, 27 + index * 7], [0, 1], CLAMP);
          return (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0', opacity: rowOpacity }}>
              <span style={{ color: '#64748B', fontSize: 10, letterSpacing: '0.16em' }}>{label}</span>
              <span style={{ color: '#E6EDF7', fontSize: 14 }}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparisonComposition({ left, right }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, 105, 119], [0, 1, 1, 0], CLAMP);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', background: `rgba(2,6,23,${opacity * 0.96})`, fontFamily: '"Space Grotesk", Inter, sans-serif', opacity }}>
      <div style={{ position: 'absolute', top: 34, left: '50%', transform: 'translateX(-50%)', color: '#5EEAD4', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.28em' }}>COMPANY COMPARISON</div>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: '0 7vw' }}>
        <CompanySide company={left} side="left" frame={frame} fps={fps} />
        <div style={{ width: 1, height: '62%', background: 'linear-gradient(transparent, rgba(94,234,212,0.5), transparent)' }} />
        <CompanySide company={right} side="right" frame={frame} fps={fps} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
