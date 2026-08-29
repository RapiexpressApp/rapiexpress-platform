import rapiConfig from '@rapiexpress/eslint-config';

export default [
  ...rapiConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', '.vercel/**'],
  },
];
