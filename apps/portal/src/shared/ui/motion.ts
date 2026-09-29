import type { SystemStyleObject } from '@chakra-ui/react';

export function fadeUp(delay: string): SystemStyleObject {
  return {
    animationName: 'login-fade-up',
    animationDuration: 'slow',
    animationTimingFunction: 'entrance',
    animationFillMode: 'both',
    animationDelay: delay,
    _motionReduce: { animation: 'none' },
  };
}
