import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    body: { fontFamily: 'brand' },
    'h1, h2, h3, h4, h5, h6': { textWrap: 'balance' },
    p: { textWrap: 'pretty' },
  },
  theme: {
    tokens: {
      fonts: {
        brand: { value: 'Inter Variable' },
      },
      durations: {
        fast: { value: '120ms' },
        base: { value: '200ms' },
        medium: { value: '280ms' },
        slow: { value: '400ms' },
      },
      easings: {
        entrance: { value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      },
      colors: {
        brand: {
          50: { value: '#f3f5fc' },
          100: { value: '#dde4f8' },
          200: { value: '#bac9f2' },
          300: { value: '#8aa4ea' },
          400: { value: '#567de6' },
          500: { value: '#2a5ce5' },
          600: { value: '#164ada' },
          700: { value: '#1041c6' },
          800: { value: '#0937b3' },
          900: { value: '#062e9d' },
          950: { value: '#031f6d' },
        },
        slate: {
          50: { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1e293b' },
          900: { value: '#0f172a' },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: '{colors.brand.600}' },
          contrast: { value: '#ffffff' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.300}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
    keyframes: {
      'login-fade-up': {
        from: { opacity: 0, transform: 'translateY(12px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      'login-fade-in': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      'login-float': {
        '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
        '50%': { transform: 'translate3d(0, -8px, 0)' },
      },
      'login-plane': {
        '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
        '50%': { transform: 'translate3d(3px, -5px, 0)' },
      },
      'login-icon-pop': {
        from: { opacity: 0, transform: 'scale(0.7)' },
        to: { opacity: 1, transform: 'scale(1)' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
