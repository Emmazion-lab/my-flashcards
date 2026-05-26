import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        landing: "var(--landing)",
        coral: "#FF6B6B",
        teal: "#2DD4BF",
        amber: "#F59E0B",
        sky: "#38BDF8",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "card-float": {
          "0%, 100%": { transform: "translateY(0) rotate(var(--rotate))" },
          "50%": { transform: "translateY(-8px) rotate(var(--rotate))" },
        },
        "card-flip": {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "card-enter": {
          "0%": {
            opacity: "0",
            transform: "translateY(40px) rotate(var(--rotate)) scale(0.9)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) rotate(var(--rotate)) scale(1)",
          },
        },
        "dot-pop": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "60%": { transform: "scale(1.3)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-delay-1":
          "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
        "fade-up-delay-2":
          "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
        "fade-up-delay-3":
          "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both",
        "fade-up-delay-4":
          "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
        "card-float": "card-float 5s ease-in-out infinite",
        "card-float-slow": "card-float 7s ease-in-out infinite",
        "card-flip": "card-flip 0.7s ease-in-out 2s both",
        "card-enter-1":
          "card-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
        "card-enter-2":
          "card-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both",
        "card-enter-3":
          "card-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
        "card-enter-4":
          "card-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both",
        "dot-1": "dot-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both",
        "dot-2": "dot-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both",
        "dot-3": "dot-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
        "dot-4": "dot-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.5s both",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
