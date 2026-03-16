/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-sans)', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
        serif: ['var(--font-serif)', 'serif'],
      },
      colors: {
        bg:       '#0d1117',
        surface:  '#161b22',
        surface2: '#21262d',
        border:   '#30363d',
        accent:   '#3fb950',
        blue:     '#58a6ff',
        danger:   '#f78166',
        gold:     '#d29922',
        muted:    '#8b949e',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease',
        'scale-in': 'scaleIn 0.25s ease',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.92)' },     to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
