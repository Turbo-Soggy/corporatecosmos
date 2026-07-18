import { RADIX_CATEGORIES } from '../../lib/radix';

// Self-contained 12-axis "skill constellation" radar (SVG, no deps). Renders one or
// two level series (0..10) — e.g. a candidate spectrum, or candidate (teal) overlaid
// on a company's required bar (amber) for Talent Check. Kept independent of Roles 1-2's
// SkillConstellation so the 3-5 branch builds on its own; the app can unify later.
const SIZE = 320;
const C = SIZE / 2;
const R = 128;
const RINGS = [2, 4, 6, 8, 10];

// Axis unit vectors, rotated so the first category sits at the top.
const AXES = RADIX_CATEGORIES.map((cat, i) => {
  const a = (i / RADIX_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
  return { ...cat, ux: Math.cos(a), uy: Math.sin(a) };
});

function point(ux, uy, radius) {
  return [C + ux * radius, C + uy * radius];
}

function polygon(levels) {
  return AXES.map(({ code, ux, uy }) => {
    const level = Math.max(0, Math.min(10, levels?.[code] ?? 0));
    return point(ux, uy, (level / 10) * R).join(',');
  }).join(' ');
}

export default function SpectrumRadar({ series = [], size = SIZE, showLabels = true }) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={size} height={size} role="img" aria-label="Skill spectrum radar">
      {/* rings */}
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={AXES.map(({ ux, uy }) => point(ux, uy, (ring / 10) * R).join(',')).join(' ')}
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1"
        />
      ))}
      {/* spokes */}
      {AXES.map(({ code, ux, uy }) => {
        const [x, y] = point(ux, uy, R);
        return <line key={code} x1={C} y1={C} x2={x} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />;
      })}

      {/* series polygons (additive glow) */}
      {series.map((s, i) => (
        <polygon
          key={s.key || i}
          points={polygon(s.levels)}
          fill={s.color || '#5EEAD4'}
          fillOpacity={s.fillOpacity ?? 0.14}
          stroke={s.color || '#5EEAD4'}
          strokeWidth="1.75"
          style={{ mixBlendMode: 'screen' }}
        />
      ))}
      {/* series vertices */}
      {series.map((s, i) =>
        AXES.map(({ code, ux, uy }) => {
          const level = Math.max(0, Math.min(10, s.levels?.[code] ?? 0));
          if (level <= 0) return null;
          const [x, y] = point(ux, uy, (level / 10) * R);
          return <circle key={`${i}-${code}`} cx={x} cy={y} r="2.4" fill={s.color || '#5EEAD4'} />;
        })
      )}

      {/* axis labels */}
      {showLabels &&
        AXES.map(({ code, ux, uy }) => {
          const [x, y] = point(ux, uy, R + 14);
          return (
            <text
              key={`l-${code}`}
              x={x}
              y={y}
              fill="rgba(159,176,200,0.9)"
              fontSize="10"
              fontFamily='"JetBrains Mono", ui-monospace, monospace'
              textAnchor={Math.abs(ux) < 0.3 ? 'middle' : ux > 0 ? 'start' : 'end'}
              dominantBaseline={Math.abs(uy) < 0.3 ? 'middle' : uy > 0 ? 'hanging' : 'auto'}
            >
              {code}
            </text>
          );
        })}
    </svg>
  );
}
