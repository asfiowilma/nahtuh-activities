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
    extend: {
      colors: {
        gray: {
          light: "#f4f8fd",
        },
      },
      backgroundImage: {
        "lime-gradient": "linear-gradient(96.18deg, #10B981 3.21%, #B8EC48 105.94%)",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        circle: "100%",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
