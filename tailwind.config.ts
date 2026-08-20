import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        imperial: {
          DEFAULT: "#D4AF37",
          light: "#E8C766",
          dark: "#9C7F22"
        },
        champagne: "#F3E5AB",
        maroon: {
          DEFAULT: "#4A0E14",
          deep: "#2A070B"
        },
        onyx: {
          DEFAULT: "#080506",
          soft: "#18090C"
        }
      },
      fontFamily: {
        heading: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-poppins)", "sans-serif"]
      },
      backgroundImage: {
        "radial-luxury":
          "radial-gradient(circle, #18090C 0%, #080506 70%, #000000 100%)",
        "gold-sweep":
          "linear-gradient(115deg, transparent 20%, rgba(212,175,55,0.65) 45%, rgba(243,229,171,0.9) 50%, rgba(212,175,55,0.65) 55%, transparent 80%)",
        "gold-radial":
          "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0) 70%)"
      },
      boxShadow: {
        gold: "0 0 40px rgba(212,175,55,0.35)",
        "gold-lg": "0 0 80px rgba(212,175,55,0.45)",
        glass: "0 8px 32px rgba(0,0,0,0.55)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "spin-slow": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" }
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" }
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.55", filter: "blur(28px)" },
          "50%": { opacity: "1", filter: "blur(38px)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        shimmer: "shimmer 3.2s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.5s ease-in-out infinite",
        "fade-up": "fade-up 0.8s ease forwards"
      }
    }
  },
  plugins: []
};

export default config;
