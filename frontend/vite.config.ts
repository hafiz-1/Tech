import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const srcDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(srcDirectory),
      },
    },
  },
});
