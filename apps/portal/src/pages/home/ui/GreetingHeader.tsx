import { Button, Flex, Text } from '@chakra-ui/react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router';

import { focusRing, pressable } from '@/shared/ui/interaction';
import { fadeUp } from '@/shared/ui/motion';

interface GreetingHeaderProps {
  firstName: string;
  summary: string;
}

function GreetingHeader({ firstName, summary }: GreetingHeaderProps) {
  return (
    <Flex direction="column" justify="center" css={fadeUp('0ms')}>
      <Text
        as="h1"
        fontSize={{ base: '3xl', md: '4xl' }}
        fontWeight="semibold"
        letterSpacing="tight"
        lineHeight="1.15"
        color="slate.900"
      >
        Hola, {firstName}
      </Text>
      <Text mt={2} maxW="md" fontSize="md" color="slate.600">
        {summary}
      </Text>

      <Flex direction={{ base: 'column', sm: 'row' }} gap={3} mt={6}>
        <Button
          asChild
          colorPalette="brand"
          height={11}
          px={5}
          fontSize="sm"
          fontWeight="semibold"
          borderRadius="lg"
          css={pressable}
        >
          <Link to="/pre-alerts">
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
            Pre-alertar una compra
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          height={11}
          px={5}
          fontSize="sm"
          fontWeight="semibold"
          borderRadius="lg"
          borderColor="slate.300"
          bg="white"
          color="slate.700"
          touchAction="manipulation"
          transition="background-color 150ms ease, border-color 150ms ease, transform 150ms ease"
          _hover={{ bg: 'slate.50', borderColor: 'slate.400', translateY: '-2px' }}
          _active={{ transform: 'scale(0.98)' }}
          _focusVisible={focusRing}
        >
          <Link to="/tracking">
            <Search size={18} strokeWidth={2.25} aria-hidden="true" />
            Rastrear un envío
          </Link>
        </Button>
      </Flex>
    </Flex>
  );
}

export default GreetingHeader;
