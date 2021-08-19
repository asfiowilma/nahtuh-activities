console.log(process.env.NODE_ENV);
const purge = process.env.NODE_ENV === "production";
module.exports = {
  purge: {
    enabled: purge,
    content: ["./*.html", "./*.js"],
    options: {
      keyframes: true,
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [require("ps-scrollbar-tailwind")],
};
