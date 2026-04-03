import { defineConfig } from 'vite';

// Use './' so assets work on GitHub Pages project sites and local preview.
export default defineConfig({
  base: './',
  server: {
    host: true,
  },
});
