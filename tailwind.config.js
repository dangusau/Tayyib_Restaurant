/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#800020',
        'primary-dark': '#5d0018',
        'primary-light': '#a50026',
        secondary: '#000000',
        accent: '#ffffff',
        success: '#388e3c',
        error: '#d32f2f',
        warning: '#f57c00',
        info: '#1976d2',
      },
    },
  },
  plugins: [],
};
