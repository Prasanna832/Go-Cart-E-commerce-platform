/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#020617',
          surface: 'rgba(15, 23, 42, 0.6)',
          neon: '#22d3ee',
          pink: '#f472b6',
          purple: '#a78bfa'
        }
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 30px rgba(34, 211, 238, 0.25)',
        threat: '0 0 30px rgba(248, 113, 113, 0.35)'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' }
        },
        drift: {
          '0%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(25px)' },
          '100%': { transform: 'translateX(0px)' }
        }
      },
      animation: {
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        drift: 'drift 9s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
