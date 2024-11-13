import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    /**
     * We're using `SharedArrayBuffer`s in our code,
     * which requires either HTTPS or localhost, and it requires cross origin isolation.
     * So we're enabling the CORS headers here for development mode.
     *
     * Do note that your production server will need HTTPS and CORS headers set up correctly.
     * If you cannot control the HTTP headers that your production server sends back (like on GitHub pages),
     * then there's a workaround using a service worker. See https://dev.to/stefnotch/enabling-coop-coep-without-touching-the-server-2d3n
     */
    {
      // Plugin code is from https://github.com/chaosprint/vite-plugin-cross-origin-isolation
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
});
