module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        luxury: { cream: '#F8F6F2', black: '#111111', accent: '#C4A484', green: '#4D6B57', dark: '#1A1A1A', charcoal: '#2D2D2D' },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(3rem, 8vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(2.5rem, 5vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'reveal': 'reveal 1.5s ease-out forwards',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'drift': 'drift 8s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(40px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-25px) rotate(2deg)' } },
        pulseSoft: { '0%, 100%': { opacity: '0.3' }, '50%': { opacity: '0.7' } },
        kenBurns: { '0%': { transform: 'scale(1) translate(0, 0)' }, '100%': { transform: 'scale(1.08) translate(-1%, -1%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        reveal: { '0%': { width: '0%' }, '100%': { width: '100%' } },
        drift: { '0%': { transform: 'translate(0, 0)' }, '100%': { transform: 'translate(30px, -20px)' } },
      },
    },
  },
  plugins: [],
};
