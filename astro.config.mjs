// @ts-check
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";

import sitemap from "@astrojs/sitemap";

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
  site: "https://informati.dev",
  integrations: [solidJs(), sitemap()],
});
