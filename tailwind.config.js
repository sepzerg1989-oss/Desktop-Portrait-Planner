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
          canvas: '#E2DED0',
          panel: '#F5F5F5',
          blue: '#A1B5C1',
          oat: '#D9C5B2',
          green: '#B8C4BB',
          text: '#333333',
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
