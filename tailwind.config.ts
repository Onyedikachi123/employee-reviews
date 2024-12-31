import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        grayMain: '#4A4A4A',
        primaryBlue: '#2D86B9',
        lightBlue: '#BDDFF2',
        lightGray: '#ECEBEB',
        white: '#FFFFFF',
      },
    },
  },
  plugins: [],
} satisfies Config;
