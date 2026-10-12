import type { SystemStyleObject } from '@chakra-ui/react';

export const focusRing: SystemStyleObject = {
  outline: 'none',
  boxShadow: '0 0 0 2px white, 0 0 0 4px {colors.brand.600}',
};

export const pressable: SystemStyleObject = {
  touchAction: 'manipulation',
  transition: 'background-color 150ms ease, transform 150ms ease',
  _hover: { bg: 'brand.700', translateY: '-2px' },
  _active: { transform: 'scale(0.98)' },
  _focusVisible: focusRing,
};
