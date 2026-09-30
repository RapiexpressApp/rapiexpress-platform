import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Check, CircleAlert, Copy, MapPin } from 'lucide-react';

import { type CopyStatus, useCopyToClipboard } from '@/shared/lib/use-copy-to-clipboard';
import { fadeUp } from '@/shared/ui/motion';

import { getLockerLines } from '../model/locker';
import type { Locker } from '../model/types';

interface LockerCardProps {
  locker: Locker;
}

const COPY_LABEL: Record<CopyStatus, string> = {
  idle: 'Copiar dirección',
  copied: 'Copiado',
  failed: 'No se pudo copiar',
};

function LockerCard({ locker }: LockerCardProps) {
  const { status, copy } = useCopyToClipboard();
  const lines = getLockerLines(locker);
  const [recipient, suite, ...rest] = lines;
  const StatusIcon = status === 'copied' ? Check : status === 'failed' ? CircleAlert : Copy;

  return (
    <Flex
      as="section"
      aria-labelledby="locker-title"
      direction="column"
      gap={5}
      p={{ base: 5, md: 6 }}
      borderRadius="xl"
      bg="brand.600"
      color="white"
      css={fadeUp('80ms')}
    >
      <Flex align="center" gap={3}>
        <Flex
          aria-hidden="true"
          align="center"
          justify="center"
          boxSize={10}
          borderRadius="lg"
          bg="white/15"
        >
          <MapPin size={20} />
        </Flex>
        <Text as="h2" id="locker-title" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
          Tu casillero en Miami
        </Text>
      </Flex>

      <Box as="address" fontStyle="normal">
        <Text fontSize="sm" color="white/80">
          {recipient}
        </Text>
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          letterSpacing="tight"
          lineHeight="1.2"
        >
          {suite}
        </Text>
        <Box mt={3} fontSize="sm" lineHeight="1.6" color="white/90">
          {rest.map((line) => (
            <Text key={line} fontVariantNumeric="tabular-nums">
              {line}
            </Text>
          ))}
        </Box>
      </Box>

      <Button
        alignSelf="flex-start"
        height={11}
        px={5}
        fontSize="sm"
        fontWeight="semibold"
        borderRadius="lg"
        bg="white"
        color="brand.700"
        touchAction="manipulation"
        transition="background-color 150ms ease, transform 150ms ease"
        _hover={{ bg: 'brand.50', translateY: '-2px' }}
        _active={{ transform: 'scale(0.98)' }}
        _focusVisible={{
          outline: 'none',
          boxShadow: '0 0 0 2px {colors.brand.600}, 0 0 0 4px white',
        }}
        onClick={() => void copy(lines.join('\n'))}
      >
        <StatusIcon size={18} strokeWidth={2.25} aria-hidden="true" />
        {COPY_LABEL[status]}
      </Button>
      <Text role="status" aria-live="polite" srOnly>
        {status === 'idle' ? '' : COPY_LABEL[status]}
      </Text>
    </Flex>
  );
}

export default LockerCard;
