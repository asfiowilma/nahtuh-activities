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
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        circle: "100%",
        card: "20px",
        10: "10px",
      },
      boxShadow: {
        card: "0px 10px 20px rgba(214, 226, 241, 0.5)",
      },
      backgroundImage: {
        lollipop: "linear-gradient(96.18deg, #EC4899 3.21%, #6366F1 105.94%)",
      },
    },
  },
  variants: {
    extend: {
      brightness: ["hover"],
    },
  },
  plugins: [require("ps-scrollbar-tailwind")],
};
