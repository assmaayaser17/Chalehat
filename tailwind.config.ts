import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        // Latin font first so Latin/numeric glyphs render in it; the
        // Arabic font is the fallback the browser resolves to per-glyph
        // for any Arabic characters — no per-string language switching.
        sans: ["var(--font-latin)", "var(--font-arabic)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Primary — deep forest teal, from the Chalehat logo icon/wordmark.
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#F5F9F8",
          100: "#E3EDEA",
          200: "#C6DDD8",
          300: "#9DC8C0",
          400: "#57A899",
          500: "#3E8477",
          600: "#2E6B60",
          700: "#265A50",
          800: "#1E4A42",
          900: "#142F2B",
          950: "#0C1D1A",
        },
        // Accent — warm gold sun accent. CTAs/price emphasis/featured only.
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#F9F6F0",
          100: "#F6ECD8",
          200: "#EEDBBA",
          300: "#E4CA9A",
          400: "#DCB671",
          500: "#D3A95A",
          600: "#CB9A45",
          700: "#B58730",
          800: "#976F26",
          900: "#74551B",
          950: "#543D12",
        },
        // Sand — warm cream neutrals (page/card backgrounds, borders).
        sand: {
          50: "#FAF7F1",
          100: "#F2ECE0",
          200: "#EAE1CE",
          300: "#E2D9C6",
          400: "#D2C6AC",
        },
        // Ink — warm-neutral text colors.
        ink: {
          900: "#1C2320",
          600: "#5C665F",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // Semantic additions — "pending review" and informational badges.
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        // Fixed pixel values per the brand spec (cards 12px / inputs+buttons
        // 8px) rather than a proportional calc chain — badges/pills already
        // use Tailwind's built-in `rounded-full` (999px) everywhere.
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        // Soft, low-opacity, brand-tinted (ink-900 tint, not neutral gray)
        // — replaces Tailwind's default gray shadow scale everywhere
        // `shadow-sm`/`shadow`/`shadow-md`/`shadow-lg` are already used.
        sm: "0 2px 8px rgba(20, 47, 43, 0.05)",
        DEFAULT: "0 4px 16px rgba(20, 47, 43, 0.06)",
        md: "0 4px 16px rgba(20, 47, 43, 0.06)",
        lg: "0 8px 24px rgba(20, 47, 43, 0.08)",
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
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
