import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        pill: "999px",
      },
      backgroundImage: {
        playful:
          "radial-gradient(circle at 10% 20%, #fde68a 0%, transparent 32%), radial-gradient(circle at 85% 15%, #bfdbfe 0%, transparent 34%), linear-gradient(135deg, #fef3c7 0%, #dbeafe 50%, #fce7f3 100%)",
      },
    },
  },
};

export default config;
