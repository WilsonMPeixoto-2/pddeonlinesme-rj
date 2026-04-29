import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
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
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Escala numérica/tabular institucional
        "num-xs": ["0.6875rem", { lineHeight: "1", letterSpacing: "0" }],
        "num-sm": ["0.8125rem", { lineHeight: "1.1", letterSpacing: "0" }],
        "num-md": ["0.9375rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        "num-lg": ["1.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "num-xl": ["1.875rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        // Eyebrow / label institucional
        "eyebrow": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.16em" }],
        "label": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.12em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          muted: "hsl(var(--primary-muted))",
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
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
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          foreground: "hsl(var(--neutral-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "hsl(var(--card-elevated))",
          hover: "hsl(var(--card-hover))",
        },
        // Risco — escala graduada
        risk: {
          none: "hsl(var(--risk-none))",
          low: "hsl(var(--risk-low))",
          medium: "hsl(var(--risk-medium))",
          high: "hsl(var(--risk-high))",
          critical: "hsl(var(--risk-critical))",
        },
        // Financeiro — papéis monetários
        fin: {
          positive: "hsl(var(--fin-positive))",
          negative: "hsl(var(--fin-negative))",
          neutral: "hsl(var(--fin-neutral))",
          spent: "hsl(var(--fin-spent))",
          pending: "hsl(var(--fin-pending))",
          capital: "hsl(var(--fin-capital))",
          custeio: "hsl(var(--fin-custeio))",
        },
        // Documentos — ciclo de vida
        doc: {
          pending: "hsl(var(--doc-pending))",
          generated: "hsl(var(--doc-generated))",
          signed: "hsl(var(--doc-signed))",
          rejected: "hsl(var(--doc-rejected))",
          draft: "hsl(var(--doc-draft))",
        },
        // Programa PDDE
        prog: {
          basico: "hsl(var(--prog-basico))",
          qualidade: "hsl(var(--prog-qualidade))",
          equidade: "hsl(var(--prog-equidade))",
        },
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
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        "ds-xs": "var(--shadow-xs)",
        "ds-sm": "var(--shadow-sm)",
        "ds-md": "var(--shadow-md)",
        "ds-lg": "var(--shadow-lg)",
        "ds-xl": "var(--shadow-xl)",
        "ds-glow": "var(--shadow-glow)",
        "ds-inset": "var(--shadow-inset)",
      },
      transitionTimingFunction: {
        "ds-out": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ds-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ds-spring": "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },
      transitionDuration: {
        instant: "80ms",
        fast: "140ms",
        base: "220ms",
        slow: "360ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(6px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.97)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in var(--duration-base, 0.22s) var(--ease-out, ease-out)",
        "fade-out": "fade-out var(--duration-base, 0.22s) var(--ease-out, ease-out)",
        "scale-in": "scale-in var(--duration-base, 0.22s) var(--ease-out, ease-out)",
        "slide-up": "slide-up var(--duration-base, 0.22s) var(--ease-out, ease-out)",
        "slide-in-right": "slide-in-right var(--duration-base, 0.22s) var(--ease-out, ease-out)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
