import { Box, Flex, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';

import type { StepState, TimelineStep } from '../model/types';

const STATE_DESCRIPTION: Record<StepState, string> = {
  done: 'completado',
  current: 'paso actual',
  pending: 'pendiente',
};

const LABEL_COLOR: Record<StepState, string> = {
  done: 'slate.900',
  current: 'brand.700',
  pending: 'slate.500',
};

function StepMarker({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <Flex
        aria-hidden="true"
        position="relative"
        zIndex={1}
        align="center"
        justify="center"
        flexShrink={0}
        boxSize={6}
        borderRadius="full"
        bg="brand.600"
        color="white"
      >
        <Check size={14} strokeWidth={3} />
      </Flex>
    );
  }

  if (state === 'current') {
    return (
      <Flex
        aria-hidden="true"
        position="relative"
        zIndex={1}
        align="center"
        justify="center"
        flexShrink={0}
        boxSize={6}
        borderRadius="full"
        bg="white"
        borderWidth="2px"
        borderColor="brand.600"
        boxShadow="0 0 0 4px {colors.brand.100}"
      >
        <Box boxSize={2} borderRadius="full" bg="brand.600" />
      </Flex>
    );
  }

  return (
    <Box
      aria-hidden="true"
      position="relative"
      zIndex={1}
      flexShrink={0}
      boxSize={6}
      borderRadius="full"
      bg="white"
      borderWidth="2px"
      borderColor="slate.300"
    />
  );
}

interface ShipmentTimelineProps {
  steps: TimelineStep[];
}

function ShipmentTimeline({ steps }: ShipmentTimelineProps) {
  return (
    <Flex as="ol" direction={{ base: 'column', md: 'row' }} listStyleType="none">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <Flex
            as="li"
            key={step.label}
            aria-current={step.state === 'current' ? 'step' : undefined}
            position="relative"
            flex="1"
            minW={0}
            direction={{ base: 'row', md: 'column' }}
            align={{ base: 'flex-start', md: 'center' }}
            gap={{ base: 4, md: 3 }}
            pb={{ base: isLast ? 0 : 6, md: 0 }}
            textAlign={{ base: 'left', md: 'center' }}
            _after={
              isLast
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    bg: step.state === 'done' ? 'brand.500' : 'slate.200',
                    top: { base: '28px', md: '11px' },
                    bottom: { base: '4px', md: 'auto' },
                    left: { base: '11px', md: 'calc(50% + 16px)' },
                    width: { base: '2px', md: 'calc(100% - 32px)' },
                    height: { base: 'auto', md: '2px' },
                  }
            }
          >
            <StepMarker state={step.state} />
            <Box>
              <Text
                fontSize="sm"
                fontWeight={step.state === 'pending' ? 'medium' : 'semibold'}
                lineHeight="1.5"
                color={LABEL_COLOR[step.state]}
              >
                {step.label}
                <Text as="span" srOnly>
                  {`, ${STATE_DESCRIPTION[step.state]}`}
                </Text>
              </Text>
              {step.date && (
                <Text fontSize="xs" color="slate.600">
                  {step.date}
                </Text>
              )}
            </Box>
          </Flex>
        );
      })}
    </Flex>
  );
}

export default ShipmentTimeline;
