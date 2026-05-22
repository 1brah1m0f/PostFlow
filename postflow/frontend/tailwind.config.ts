import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pf: {
          green: "#A6B366",
          cream: "#FFEEC7",
          tan: "#D8B68A",
          rust: "#C26834",
          brown: "#592706",
          background: "#FAF6EF", // Light background from mockups
          white: "#FFFFFF",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
};
export default config;
