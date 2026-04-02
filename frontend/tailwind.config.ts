import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#009DFF',
        glass: 'rgba(255,255,255,0.30)',
        'glass-strong': 'rgba(255,255,255,0.40)',
        'glass-border': 'rgba(255,255,255,0.50)',
        'glass-border-strong': 'rgba(255,255,255,0.80)',
      },
      boxShadow: {
        accent: '0 10px 24px rgba(0, 157, 255, 0.28)',
        glass: '0 14px 34px rgba(17, 31, 67, 0.14)',
      },
      borderRadius: {
        pill: '999px',
        glass: '28px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
