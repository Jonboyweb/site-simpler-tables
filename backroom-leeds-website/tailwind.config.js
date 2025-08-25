/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Underground Sanctuary palette
        'luxury-charcoal': 'oklch(15% 0 0)',
        'luxury-copper': 'oklch(60% 0.12 40)',
        'luxury-champagne': 'oklch(96% 0.04 85)',
        'luxury-smoke': 'oklch(55% 0.02 240)',
        'luxury-ivory': 'oklch(98% 0.01 85)',
        'luxury-copper-dark': 'oklch(45% 0.15 40)',
        'luxury-copper-light': 'oklch(75% 0.08 40)',
        'luxury-charcoal-light': 'oklch(25% 0.02 240)',
        'luxury-smoke-light': 'oklch(70% 0.01 240)',
        
        // Legacy color mappings for backward compatibility
        'speakeasy-noir': 'oklch(15% 0 0)',
        'speakeasy-burgundy': 'oklch(25% 0.02 240)',
        'speakeasy-gold': 'oklch(60% 0.12 40)',
        'speakeasy-copper': 'oklch(45% 0.15 40)',
        'speakeasy-champagne': 'oklch(96% 0.04 85)',
      },
      fontFamily: {
        'bebas': ['Bebas Neue', 'cursive'],
        'playfair': ['Playfair Display', 'serif'],
        'great-vibes': ['Great Vibes', 'cursive'],
        // Luxury typography fonts
        'futura': ['Futura PT', 'Century Gothic', 'sans-serif'],
        'crimson': ['Crimson Pro', 'Georgia', 'serif'],
        'raleway': ['Raleway', 'Helvetica Neue', 'sans-serif'],
      },
      textShadow: {
        'sm': '1px 1px 2px rgba(0, 0, 0, 0.5)',
        'DEFAULT': '2px 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '4px 4px 8px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'conic-sunburst': 'conic-gradient(from 0deg at 50% 0%, var(--tw-gradient-stops))',
        'gradient-copper': 'linear-gradient(135deg, oklch(60% 0.12 40) 0%, oklch(75% 0.08 40) 100%)',
        'gradient-luxury-bg': 'linear-gradient(135deg, oklch(15% 0 0) 0%, oklch(25% 0.02 240) 100%)',
      },
      
      boxShadow: {
        'luxury': '0 4px 20px oklch(15% 0 0 / 0.15)',
        'luxury-lg': '0 8px 40px oklch(15% 0 0 / 0.25)',
        'luxury-xl': '0 16px 60px oklch(15% 0 0 / 0.35)',
      },
      
      animation: {
        'shimmer': 'shimmer 2s infinite',
      },
      
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-burgundy': {
          textShadow: '4px 4px 8px rgba(107, 15, 26, 0.5)',
        },
        '.text-shadow-copper': {
          textShadow: '2px 2px 4px oklch(45% 0.15 40 / 0.5)',
        },
        '.luxury-glow': {
          filter: 'drop-shadow(0 0 10px oklch(60% 0.12 40)) drop-shadow(0 0 20px oklch(60% 0.12 40))',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}