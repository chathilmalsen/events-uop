import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Campus Connect",
        short_name: "CampusConnect",
        description: "The campus notice board for every faculty",
        start_url: "/",
        display: "standalone",
        background_color: "#FAF6EC",
        theme_color: "#060A12",
        icons: [
          { src: "/logo192.png", sizes: "192x192", type: "image/png" },
          { src: "/logo512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});