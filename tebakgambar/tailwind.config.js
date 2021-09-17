console.log(process.env.NODE_ENV);
const purge = process.env.NODE_ENV === "production";
module.exports = {
  purge: {
    enabled: purge,
    content: ["./dist/*.html", "./dist/*.js"],
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
        bubblegum: "linear-gradient(90deg, #0027c5 0%, #7f52f5 100%)",
      },
    },
  },
  variants: {
    extend: {
      brightness: ["hover"],
    },
  },
  plugins: [require("ps-scrollbar-tailwind"), require("@tailwindcss/forms")],
};
