import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icons/icon-192x192-v2.png",
        "icons/icon-512x512-v2.png",
      ],
      manifest: {
        name: "Bullet Journal",
        short_name: "BuJo",
        description: "A minimalist digital bullet journal",
        theme_color: "#f2efe9",
        background_color: "#f2efe9",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192x192-v2.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512x512-v2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512-maskable-v2.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
