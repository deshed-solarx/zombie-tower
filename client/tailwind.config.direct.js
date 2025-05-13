/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(210, 33%, 10%)',
        foreground: 'hsl(210, 40%, 98%)',
        primary: 'hsl(25, 95%, 53%)',
        secondary: 'hsl(210, 33%, 13%)',
        accent: 'hsl(210, 33%, 20%)',
        muted: 'hsl(210, 33%, 20%)',
        border: 'hsl(210, 33%, 20%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}