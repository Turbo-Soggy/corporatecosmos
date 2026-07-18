import { useId } from 'react';
import { confidenceWeight, RADIX_CATEGORIES } from '../../lib/radix';

const VIEW_SIZE = 520;
const CENTER = VIEW_SIZE / 2;
const RIM_RADIUS = 118;
const LABEL_RADIUS = 132;
const STUB_RADIUS = 24;
const ACTIVE_MIN_RADIUS = 34;
const ORBIT_RADIUS = 218;
const CHIP_HEIGHT = 20;
const CHIP_MAX_WIDTH = 82;
const CHIP_VIEWBOX_MARGIN = 4;
const MAX_WEIGHT = 3;
const MAX_ORBIT_CHIPS = 8;

const MODE_STYLES = {
  jd: { color: '#FBBF24', fillOpacity: 0.11, name: 'job description' },
  resume: { color: '#5EEAD4', fillOpacity: 0.1, name: 'resume' },
};

function pointAt(angle, radius) {
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function skillsFrom(result) {
  if (Array.isArray(result)) return result;
  return Array.isArray(result?.skills) ? result.skills : [];
}

function isSkillDataset(result) {
  return Array.isArray(result)
    || Boolean(result && !Array.isArray(result) && typeof result === 'object' && Array.isArray(result.skills));
}

function resolveMode(mode, fallback = 'jd') {
  return MODE_STYLES[mode] ? mode : fallback;
}

function buildSpectrum(result) {
  const byCode = new Map(
    RADIX_CATEGORIES.map(({ code }) => [code, { count: 0, weightedCount: 0 }])
  );
  const otherNames = [];
  const seenOther = new Set();

  for (const skill of skillsFrom(result)) {
    if (!skill || typeof skill !== 'object') continue;

    const code = String(skill.category_code || '').trim().toUpperCase();
    if (code === 'OTHER') {
      const name = String(skill.skill_name || '').trim();
      const key = name.toLowerCase();
      if (name && !seenOther.has(key)) {
        seenOther.add(key);
        otherNames.push(name);
      }
      continue;
    }

    const bucket = byCode.get(code);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.weightedCount += confidenceWeight(skill.confidence);
  }

  const axes = RADIX_CATEGORIES.map((category) => {
    const strength = byCode.get(category.code);
    const ratio = Math.min(strength.weightedCount / MAX_WEIGHT, 1);
    const radius = strength.count
      ? ACTIVE_MIN_RADIUS + ratio * (RIM_RADIUS - ACTIVE_MIN_RADIUS)
      : STUB_RADIUS;

    return { ...category, ...strength, radius, point: pointAt(category.angle, radius) };
  });

  const categorizedSkillCount = axes.reduce((total, axis) => total + axis.count, 0);

  return { axes, otherNames, categorizedSkillCount };
}

function PolygonLayer({ axes, mode, filterId, secondary = false }) {
  const style = MODE_STYLES[mode];
  const points = axes.map(({ point }) => `${point.x},${point.y}`).join(' ');

  return (
    <g
      data-layer={secondary ? 'secondary' : 'primary'}
      data-mode={mode}
      aria-hidden="true"
      style={{
        opacity: secondary ? 0.58 : 1,
        transition: 'opacity 240ms ease, filter 240ms ease',
      }}
    >
      <polygon
        points={points}
        fill={style.color}
        fillOpacity={secondary ? style.fillOpacity * 0.62 : style.fillOpacity}
        stroke={style.color}
        strokeWidth={secondary ? 1.1 : 1.6}
        strokeDasharray={secondary ? '4 5' : undefined}
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
        vectorEffect="non-scaling-stroke"
      />
      {axes.map((axis) => (
        <circle
          key={axis.code}
          cx={axis.point.x}
          cy={axis.point.y}
          r={axis.count ? (secondary ? 2.2 : 3) : 1.4}
          fill={style.color}
          fillOpacity={axis.count ? 0.9 : 0.22}
          stroke="#020617"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          style={{ transition: 'cx 280ms ease, cy 280ms ease, opacity 200ms ease' }}
        />
      ))}
    </g>
  );
}

function axisLabelPosition(angle) {
  const point = pointAt(angle, LABEL_RADIUS);
  const cosine = Math.cos(angle);
  return {
    ...point,
    anchor: cosine > 0.25 ? 'start' : cosine < -0.25 ? 'end' : 'middle',
  };
}

function displayChipName(name) {
  return name.length > 11 ? `${name.slice(0, 10)}...` : name;
}

function orbitChipPosition(angle, width) {
  const point = pointAt(angle, ORBIT_RADIUS);
  const halfWidth = width / 2;
  const halfHeight = CHIP_HEIGHT / 2;

  return {
    x: Math.max(
      CHIP_VIEWBOX_MARGIN + halfWidth,
      Math.min(VIEW_SIZE - CHIP_VIEWBOX_MARGIN - halfWidth, point.x)
    ),
    y: Math.max(
      CHIP_VIEWBOX_MARGIN + halfHeight,
      Math.min(VIEW_SIZE - CHIP_VIEWBOX_MARGIN - halfHeight, point.y)
    ),
  };
}

function describeSpectrum(spectrum, modeName, layerName) {
  const activeAxisCount = spectrum.axes.filter((axis) => axis.count > 0).length;
  const axisCounts = spectrum.axes
    .map((axis) => `${axis.label} (${axis.code}) ${axis.count}`)
    .join('; ');
  const shapeDescription = spectrum.categorizedSkillCount > 0
    ? `A ${layerName.toLowerCase()} polygon is shown.`
    : `No categorized RADIX skills are available, so no ${layerName.toLowerCase()} polygon is shown; the reference grid and faint axis stubs remain visible.`;
  const otherDescription = spectrum.otherNames.length > 0
    ? `${spectrum.otherNames.length} named OTHER technologies: ${spectrum.otherNames.join(', ')}.`
    : 'No named OTHER technologies.';

  return `${layerName} ${modeName}: ${spectrum.categorizedSkillCount} categorized skills across ${activeAxisCount} of 12 axes. ${shapeDescription} Per-axis counts: ${axisCounts}. ${otherDescription}`;
}

export default function SkillConstellation({
  result,
  mode,
  secondaryResult = null,
  secondaryMode,
  className = '',
}) {
  const id = useId().replace(/:/g, '');
  const primaryMode = resolveMode(mode, resolveMode(result?.source_type));
  const overlayMode = resolveMode(
    secondaryMode,
    resolveMode(secondaryResult?.source_type, primaryMode === 'jd' ? 'resume' : 'jd')
  );
  const primary = buildSpectrum(result);
  const secondary = isSkillDataset(secondaryResult) ? buildSpectrum(secondaryResult) : null;
  const primaryStyle = MODE_STYLES[primaryMode];
  const visibleChipLimit = primary.otherNames.length > MAX_ORBIT_CHIPS
    ? MAX_ORBIT_CHIPS - 1
    : MAX_ORBIT_CHIPS;
  const visibleChips = primary.otherNames.slice(0, visibleChipLimit);
  const hiddenChipCount = primary.otherNames.length - visibleChips.length;
  const chips = hiddenChipCount > 0
    ? [...visibleChips, `+${hiddenChipCount} tech`]
    : visibleChips;
  const hasPrimaryShape = primary.categorizedSkillCount > 0;
  const hasSecondaryShape = Boolean(secondary?.categorizedSkillCount);
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const primaryFilterId = `${id}-primary-glow`;
  const secondaryFilterId = `${id}-secondary-glow`;
  const accessibleTitle = secondary
    ? `${primaryStyle.name} and ${MODE_STYLES[overlayMode].name} RADIX skill constellation comparison`
    : `${primaryStyle.name} RADIX skill constellation`;
  const accessibleDescription = [
    describeSpectrum(primary, primaryStyle.name, 'Primary'),
    secondary && describeSpectrum(secondary, MODE_STYLES[overlayMode].name, 'Secondary'),
    'Axis distance reflects skill count weighted by confidence. Primary named OTHER technologies are displayed in the outer orbit.',
  ].filter(Boolean).join(' ');

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      className={`block h-auto w-full ${className}`.trim()}
      data-skill-constellation="true"
      data-mode={primaryMode}
      style={{ aspectRatio: '1 / 1' }}
    >
      <title id={titleId}>{accessibleTitle}</title>
      <desc id={descriptionId}>{accessibleDescription}</desc>

      <defs>
        {[hasPrimaryShape && { id: primaryFilterId, color: primaryStyle.color }, hasSecondaryShape && {
          id: secondaryFilterId,
          color: MODE_STYLES[overlayMode].color,
        }].filter(Boolean).map((filter) => (
          <filter
            key={filter.id}
            id={filter.id}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={filter.color} floodOpacity="0.55" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      <g aria-hidden="true">
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <circle
            key={ratio}
            cx={CENTER}
            cy={CENTER}
            r={RIM_RADIUS * ratio}
            fill="none"
            stroke="#94A3B8"
            strokeOpacity={ratio === 1 ? 0.15 : 0.08}
            strokeWidth="1"
            strokeDasharray={ratio === 1 ? undefined : '2 6'}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {primary.axes.map((axis) => {
          const end = pointAt(axis.angle, axis.count ? RIM_RADIUS : STUB_RADIUS);
          return (
            <line
              key={axis.code}
              data-axis={axis.code}
              data-skill-count={axis.count}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke={axis.count ? axis.color : '#94A3B8'}
              strokeOpacity={axis.count ? 0.2 : 0.1}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      {hasSecondaryShape && (
        <PolygonLayer
          axes={secondary.axes}
          mode={overlayMode}
          filterId={secondaryFilterId}
          secondary
        />
      )}
      {hasPrimaryShape && (
        <PolygonLayer axes={primary.axes} mode={primaryMode} filterId={primaryFilterId} />
      )}

      <g aria-hidden="true" data-label-treatment="dark-halo">
        {primary.axes.map((axis) => {
          const label = axisLabelPosition(axis.angle);
          return (
            <text
              key={axis.code}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              className="label-mono"
              fill={axis.count ? '#F8FAFC' : '#CBD5E1'}
              fillOpacity={axis.count ? 1 : 0.84}
              stroke="#020617"
              strokeOpacity="0.94"
              strokeWidth="4"
              paintOrder="stroke fill"
              fontSize="11"
              fontWeight="650"
              style={{ letterSpacing: 0 }}
            >
              <title>{`${axis.label}: ${axis.count} skills, ${axis.weightedCount.toFixed(2)} weighted`}</title>
              {axis.code}
            </text>
          );
        })}
      </g>

      {chips.length > 0 && (
        <g aria-hidden="true" data-orbit-chip-count={chips.length}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_RADIUS}
            fill="none"
            stroke={primaryStyle.color}
            strokeOpacity="0.08"
            strokeWidth="1"
            strokeDasharray="1 9"
            vectorEffect="non-scaling-stroke"
            aria-hidden="true"
          />
          {chips.map((name, index) => {
            const angle = -Math.PI / 2 + (index / chips.length) * Math.PI * 2;
            const displayName = displayChipName(name);
            const width = Math.min(CHIP_MAX_WIDTH, Math.max(38, displayName.length * 5.2 + 14));
            const point = orbitChipPosition(angle, width);
            return (
              <g
                key={`${name}-${index}`}
                data-orbit-chip="true"
                data-chip-width={width}
                data-chip-height={CHIP_HEIGHT}
                transform={`translate(${point.x} ${point.y})`}
              >
                <title>{name}</title>
                <rect
                  x={-width / 2}
                  y={-CHIP_HEIGHT / 2}
                  width={width}
                  height={CHIP_HEIGHT}
                  rx="4"
                  fill="#0B1220"
                  fillOpacity="0.92"
                  stroke={primaryStyle.color}
                  strokeOpacity="0.34"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={primaryStyle.color}
                  className="font-mono"
                  fontSize="8.5"
                  style={{ letterSpacing: 0 }}
                >
                  {displayName}
                </text>
              </g>
            );
          })}
        </g>
      )}

      <circle cx={CENTER} cy={CENTER} r="2.5" fill={primaryStyle.color} aria-hidden="true" />
    </svg>
  );
}
