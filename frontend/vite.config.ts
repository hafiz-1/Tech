import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  vite: {
    // Port 8080 is often taken by other local servers (Apache, the Postgres
    // installer web UI). Pin 8081 so the dev server always lands on a port
    // that is listed in the backend's APP_ORIGIN.
    server: {
      port: 8081,
    },
    resolve: {
      alias: {
        "@": path.resolve(srcDirectory),
      },
    },
  },
});
