import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://jurrutxurtu.github.io',
  base: process.env.BASE_PATH || '/',
  compressHTML: true,
});
