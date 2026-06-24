/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Type triad: Space Grotesk (display) / Inter (body) / JetBrains Mono (data).
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      // Semantic dark tokens — desaturated tonal variants, not pure inversions.
      colors: {
        canvas: '#020617',
        surface: {
          DEFAULT: '#0B1220', // panel base
          light: '#121C30', // elevated
        },
        ink: {
          DEFAULT: '#E6EDF7', // primary text  (~13:1 on canvas)
          muted: '#9FB0C8', // secondary     (~6:1)
          faint: '#64748B', // tertiary/labels(~4.6:1)
        },
        accent: {
          DEFAULT: '#5EEAD4',
          deep: '#2DD4BF',
        },
        // Categorical palette for data-viz (colorblind-safe spread).
        data: {
          sky: '#38BDF8',
          violet: '#A78BFA',
          pink: '#F472B6',
          amber: '#FBBF24',
          emerald: '#34D399',
        },
        pos: '#34D399',
        neg: '#FB7185',
      },
      boxShadow: {
        glass:
          '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 48px -24px rgba(0,0,0,0.75)',
      },
      keyframes: {
        rowIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rowIn: 'rowIn 320ms cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};
