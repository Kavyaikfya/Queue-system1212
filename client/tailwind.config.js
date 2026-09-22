/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f8ff',
          100: '#e0f0fe',
          200: '#bae2fd',
          300: '#7ccafc',
          400: '#38bdf8', // electric cyan
          500: '#0c87eb', // electric blue
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d6f',
          950: '#08274a',
        },
        navy: {
          800: '#111d38',
          850: '#0e172d',
          900: '#0b1325',
          950: '#070d1e', // deep futuristic navy
        },
        slate: {
          850: '#131d33',
          950: '#070d1e',
        },
        cyan: {
          400: '#38bdf8',
          500: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'ai-pulse': 'aiPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-right': 'flowRight 2s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        aiPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.06)' },
        },
        flowRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 12px rgba(12, 135, 235, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 24px rgba(56, 189, 248, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
