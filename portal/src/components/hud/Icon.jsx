// Minimal inline Lucide-style icons (no emoji, no extra dependency).
// Consistent 1.6 stroke, currentColor, 24px box.

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function XIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ArrowUpRight(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}
