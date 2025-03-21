
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}","./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: '#9EDD45',
          background: '#020E1E',
        },
      },
    },
    plugins: [],
  };