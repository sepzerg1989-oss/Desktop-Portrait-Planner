/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          canvas: 'var(--color-canvas)',
          panel: 'var(--color-paper)',  /* 完美向下兼容原先的 panel */
          paper: 'var(--color-paper)',
          text: 'var(--color-ink)',
          red: 'var(--color-primary-red)',
          green: 'var(--color-primary-green)',
          blue: 'var(--color-accent-blue)',
          oat: 'var(--color-accent-oat)',
          gstart: 'var(--color-gradient-start)',
          gend: 'var(--color-gradient-end)',
          border: 'var(--color-border-line)',
          muted: '#999999'
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Playfair Display', 'Noto Serif SC', 'Songti SC', 'serif'],
      }
    },
  },
  plugins: [],
}
