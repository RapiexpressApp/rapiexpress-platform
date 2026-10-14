// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';

// `site` drives canonical URLs, Open Graph URLs and sitemap generation.
// TODO: replace with the real production domain once confirmed.
export default defineConfig({
  site: 'https://rapiexpress.ec',
  vite: { plugins: [tailwindcss()] },
  env: {
    schema: {
      PUBLIC_PORTAL_URL: envField.string({
        context: 'client',
        access: 'public',
        url: true,
        default: 'https://portal-pearl-one-62.vercel.app/',
      }),
    },
  },
  fonts: [
    {
      // Bundled in the repo: no render-blocking stylesheet, and builds never
      // need to reach a font CDN (Docker builds start without a font cache).
      // Rounded and friendly without reading comic: Nunito over Inter per
      // client feedback on brand personality.
      provider: fontProviders.local(),
      name: 'Nunito',
      cssVariable: '--font-nunito',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/nunito-latin-wght-normal.woff2'],
            weight: '200 1000',
            style: 'normal',
          },
        ],
      },
    },
  ],
});
