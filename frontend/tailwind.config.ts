import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Paleta de colores cálidos — diseñada para que se vea elegante y acogedora
      colors: {
        cream: {
          50:  '#FEFCF8',
          100: '#FBF8F2',
          200: '#F5EFE3',
          DEFAULT: '#F5EFE3',
        },
        beige: {
          100: '#EDE4D3',
          200: '#E2D5BE',
          300: '#D4C4A8',
          DEFAULT: '#EDE4D3',
        },
        sand: {
          DEFAULT: '#C8A882',
          dark: '#B8976E',
        },
        brown: {
          light: '#A07850',
          DEFAULT: '#7A5C3A',
          dark: '#4A3020',
          deep: '#2C1A10',
        },
        amber: {
          warm: '#D4956A',
          light: '#E8B48A',
        },
        success: '#6BAF6B',
        error: '#C0392B',
        warning: '#E8A020',
      },
      fontFamily: {
        // Poppins como fuente principal — es elegante y muy legible
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm': '0 4px 20px rgba(74, 48, 32, 0.12)',
        'warm-lg': '0 8px 40px rgba(74, 48, 32, 0.18)',
        'warm-xl': '0 20px 60px rgba(74, 48, 32, 0.25)',
        'card': '0 2px 12px rgba(74, 48, 32, 0.08)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pop': 'pop 0.2s ease-out',
        'pulse-warm': 'pulseWarm 1s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseWarm: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 149, 106, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212, 149, 106, 0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
