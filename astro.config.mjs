// @ts-check
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),

  server: {
    host: "0.0.0.0",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [solidJs()],
});
