import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Portafolio",
        short_name: "Portafolio",
        lang: "es",
        description: "Control personal de inversiones y estados de cuenta",
        theme_color: "#0c0e1d",
        background_color: "#0c0e1d",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // El SDK de Firebase es pesado (~700kB) y lo usan tanto modulos
        // eager (AppLayout/BackupDialog) como casi todas las paginas
        // lazy-loaded; sin esto, el chunking automatico a veces decide
        // fusionarlo al bundle principal (que carga incluso antes del
        // login), en vez de dejarlo separado.
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "firebase";
          }
        },
      },
    },
  },
});
