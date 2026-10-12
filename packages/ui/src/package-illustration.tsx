import { chakra, type HTMLChakraProps } from '@chakra-ui/react';

export function PackageIllustration(props: HTMLChakraProps<'svg'>) {
  return (
    <chakra.svg viewBox="60 100 280 280" focusable="false" aria-hidden="true" {...props}>
      <path d="M200 110 L320 170 L200 230 L80 170 Z" fill="#8aa4ea" />
      <path d="M80 170 L200 230 L200 380 L80 320 Z" fill="#2a5ce5" />
      <path d="M200 230 L320 170 L320 320 L200 380 Z" fill="#1041c6" />
      <path d="M128 146 L152 134 L272 194 L248 206 Z" fill="#facc15" />
      <path d="M248 206 L272 194 L272 344 L248 356 Z" fill="#eab308" />
      <path d="M104 220 L176 256 L176 316 L104 280 Z" fill="#ffffff" />
      <path d="M114 238 L166 264 L166 273 L114 248 Z" fill="#cbd5e1" />
      <path d="M114 257 L146 274 L146 283 L114 266 Z" fill="#cbd5e1" />
    </chakra.svg>
  );
}
