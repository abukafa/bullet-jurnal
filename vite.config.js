import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from 'fs';
import path from 'path';

function apiMiddleware() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/')) {
          try {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            await new Promise(resolve => req.on('end', resolve));
            try { req.body = JSON.parse(body); } catch(e) { req.body = {}; }
            
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };

            const urlPath = req.url.split('?')[0];
            let filePath = path.resolve('.' + urlPath + '.js');
            if (!fs.existsSync(filePath)) {
              filePath = path.resolve('.' + urlPath + '/index.js');
            }
            
            if (fs.existsSync(filePath)) {
               const module = await import('file://' + filePath + '?t=' + Date.now());
               if (module.default) {
                 await module.default(req, res);
                 return;
               }
            }
            res.status(404).json({ error: 'Not found' });
            return;
          } catch (error) {
            console.error('API Middleware Error:', error);
            res.status(500).json({ error: error.message });
            return;
          }
        }
        next();
      });
    }
  }
}

export default defineConfig(({ mode }) => {
  // Load env variables into process.env so API routes can use them
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
    },
    plugins: [
      react(),
      apiMiddleware(),
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
  };
});
