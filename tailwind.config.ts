import type { Config } from "tailwindcss";

// ============================================================
// ARIS Design System — Color Contract
// ============================================================
// RULE: Only semantic tokens are exposed as Tailwind utilities.
// Raw palette colors (blue-600, emerald-500, amber-400, etc.)
// are intentionally NOT in the color map.
//
// ✅ Use: text-primary, bg-success, text-warning, text-muted-foreground
// ❌ Ban: text-blue-600, bg-emerald-500, text-amber-600, bg-sky-100
//
// To change brand color → edit CSS variables in index.css only.
// ============================================================

export default {
  // Dark mode is intentionally disabled. ARIS is a light-only product.
  // Do not re-enable without a full dark-mode token audit first.
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
          soft: "hsl(var(--accent-soft))",
        },
        brand: {
          red: {
            DEFAULT: "hsl(var(--brand-red))",
            foreground: "hsl(var(--brand-red-foreground))",
            hover: "hsl(var(--brand-red-hover))",
            soft: "hsl(var(--brand-red-soft))",
          },
          blue: {
            DEFAULT: "hsl(var(--brand-blue))",
            foreground: "hsl(var(--brand-blue-foreground))",
            hover: "hsl(var(--brand-blue-hover))",
            soft: "hsl(var(--brand-blue-soft))",
          },
          cyan: {
            DEFAULT: "hsl(var(--brand-cyan))",
            soft: "hsl(var(--brand-cyan-soft))",
          },
        },
        surface: {
          DEFAULT: "hsl(var(--card))",
          elevated: "hsl(var(--surface-elevated))",
          muted: "hsl(var(--surface-muted))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // --- Semantic state colors ---
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // --- Sidebar ---
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // --- Exam skill section colors ---
        listening: "hsl(var(--listening))",
        reading: "hsl(var(--reading))",
        writing: "hsl(var(--writing))",
        speaking: "hsl(var(--speaking))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "signal-ripple": {
          "0%": { transform: "scale(1)", opacity: "0.35" },
          "45%": { transform: "scale(1.45)", opacity: "0.15" },
          "100%": { transform: "scale(2.0)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "signal-ripple": "signal-ripple 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "signal-ripple-delayed": "signal-ripple 3.6s cubic-bezier(0.16, 1, 0.3, 1) 1.2s infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
