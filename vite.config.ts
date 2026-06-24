import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
// Vite 8.1 — Rolldown bundler nativo + plugin-react com Oxc (Rust)
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "templates/demonstrativo-basico-4cre-template.xlsx"],
      manifest: {
        name: "PDDE Online 2026",
        short_name: "PDDE Online",
        description: "Sistema de acompanhamento financeiro e prestação de contas do PDDE - 4ª CRE / SME-RJ",
        theme_color: "#0a1024",
        background_color: "#0a1024",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,png,svg,xlsx,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raluxyojqosfzrfozmpz\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Vite 8.1: Rolldown nativo — codeSplitting groups substitui manualChunks
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-charts",
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 20,
            },
            {
              name: "vendor-motion",
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 20,
            },
            {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
}));
