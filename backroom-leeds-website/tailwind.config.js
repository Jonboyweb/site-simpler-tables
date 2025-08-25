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
        // Classic Speakeasy palette
        'speakeasy-noir': 'oklch(8% 0.02 240)',
        'speakeasy-burgundy': 'oklch(25% 0.15 15)',
        'speakeasy-gold': 'oklch(76.9% 0.188 70.08)',
        'speakeasy-copper': 'oklch(55% 0.12 45)',
        'speakeasy-champagne': 'oklch(95% 0.05 85)',
      },
      fontFamily: {
        'bebas': ['Bebas Neue', 'cursive'],
        'playfair': ['Playfair Display', 'serif'],
        'great-vibes': ['Great Vibes', 'cursive'],
      },
      textShadow: {
        'sm': '1px 1px 2px rgba(0, 0, 0, 0.5)',
        'DEFAULT': '2px 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '4px 4px 8px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'conic-sunburst': 'conic-gradient(from 0deg at 50% 0%, var(--tw-gradient-stops))',
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
      }
      addUtilities(newUtilities)
    }
  ],
}