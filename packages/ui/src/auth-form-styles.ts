import type { ButtonProps, SystemStyleObject } from '@chakra-ui/react';

export const inputStyles: SystemStyleObject = {
  height: 11,
  width: 'full',
  fontSize: 'md',
  color: 'slate.900',
  borderColor: 'slate.300',
  bg: 'white',
  touchAction: 'manipulation',
  _placeholder: { color: 'slate.500' },
  _focusVisible: {
    borderColor: 'brand.500',
    boxShadow: '0 0 0 2px {colors.brand.500/25}',
  },
};

export const submitButtonProps: ButtonProps = {
  colorPalette: 'brand',
  width: 'full',
  height: 11,
  fontSize: 'md',
  fontWeight: 'semibold',
  borderRadius: 'lg',
  touchAction: 'manipulation',
  transition: 'background-color 150ms ease, transform 150ms ease',
  _hover: { bg: 'brand.700', translateY: '-2px' },
  _active: { transform: 'scale(0.98)' },
  _focusVisible: {
    outline: 'none',
    boxShadow: '0 0 0 2px white, 0 0 0 4px {colors.brand.600}',
  },
};
