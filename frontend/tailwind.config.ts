import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        'eleken-bg': '#f9f9f7',
        'eleken-text': '#1d1e22',
        'eleken-text-secondary': '#616161',
        'eleken-code-bg': '#f6f4f2',
        'eleken-accent': '#ff8e5e',
      },
    },
  },
  plugins: [],
}
export default config
