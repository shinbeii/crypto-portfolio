/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Đường dẫn đến các tệp của bạn
  ],
  options: {
    safelist: ['text-green-500', 'text-red-500'],
  },
  theme: {
    extend: {},
  },
  plugins: [],
};


