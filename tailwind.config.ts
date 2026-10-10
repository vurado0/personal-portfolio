import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Colors are CSS variables (src/styles/tokens.css) holding "r g b" triplets,
// so Tailwind opacity modifiers like bg-surface/80 keep working in both themes.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        espresso: v('espresso'),
        'dark-roast': v('dark-roast'),
        mocha: v('mocha'),
        caramel: v('caramel'),
        crema: v('crema'),
        latte: v('latte'),
        cream: v('cream'),
        foam: v('foam'),
        ink: v('ink'),
        // Semantic tokens (switch with the theme)
        bg: v('bg'),
        surface: v('surface'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        accent: v('accent'),
        'on-accent': v('on-accent'),
        link: v('link'),
      },
      fontFamily: {
        mono: ['var(--font-mono)'],
        blog: ['var(--font-blog)'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        warm: '0 1px 2px rgb(43 29 20 / 0.12), 0 6px 20px -8px rgb(92 58 33 / 0.35)',
      },
      letterSpacing: {
        label: '0.14em',
        tightest: '-0.045em',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
