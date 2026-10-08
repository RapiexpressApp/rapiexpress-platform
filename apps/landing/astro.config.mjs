// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// `site` drives canonical URLs, Open Graph URLs and sitemap generation.
// TODO: replace with the real production domain once confirmed.
export default defineConfig({
  site: 'https://rapiexpress.ec',
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      // Self-hosted: removes the render-blocking Google Fonts stylesheet
      // and the third-party connection it required.
      // Rounded and friendly without reading comic: Nunito over Inter per
      // client feedback on brand personality.
      provider: fontProviders.fontsource(),
      name: 'Nunito',
      cssVariable: '--font-nunito',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],
});
