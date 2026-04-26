/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          secondary: 'var(--card)',
          tertiary: 'var(--muted)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          secondary: 'var(--muted-foreground)',
          tertiary: 'var(--muted-foreground)',
        },
        'muted-foreground': 'var(--muted-foreground)',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'var(--primary-foreground)',
          light: '#60A5FA',
          dark: '#2563EB',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'var(--secondary-foreground)',
          light: '#F472B6',
          dark: '#DB2777',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        accent: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
