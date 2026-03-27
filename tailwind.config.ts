import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#5c7cfa",
          accent: "#5dd4ff",
          highlight: "#a855f7",
          muted: "#61709a",
          ink: "#151a32",
          surface: "#f5f6ff"
        }
      },
      boxShadow: {
        card: "0 20px 50px rgba(0, 0, 0, 0.4)"
      }
    }
  },
  plugins: []
};

export default config;
