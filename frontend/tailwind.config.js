/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#111827',     /* Very dark slate for main background */
        'bg-card': '#1f2937',     /* Slightly lighter card background */
        'primary': '#5b5fc7',     /* Microsoft Teams Indigo */
        'primary-hover': '#4f52b2',
        'secondary': '#64748b',   /* Corporate gray */
        'accent': '#38bdf8',      /* Light blue accent */
        'success': '#10b981',
        'danger': '#ef4444',
        'warning': '#f59e0b',
        'text-main': '#f9fafb',
        'text-muted': '#9ca3af',
        'border-color': '#374151', /* Clean solid borders */
      }
    },
  },
  plugins: [],
}
