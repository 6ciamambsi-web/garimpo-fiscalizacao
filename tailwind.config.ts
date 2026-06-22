import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'pmmg-green': { 50:'#f0faf4', 100:'#dcf5e6', 200:'#b3ebcb', 300:'#7ad9a7', 400:'#3dc27e', 500:'#1aa862', 600:'#0d8a4e', 700:'#0a6e3e', 800:'#095832', 900:'#084a2b' },
        'pmmg-gold': { 50:'#fffbeb', 100:'#fef3c7', 200:'#fde68a', 300:'#fcd34d', 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706', 700:'#b45309', 800:'#92400e', 900:'#78350f' }
      }
    }
  },
  plugins: []
}
export default config
