import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import { Bell } from 'lucide-react';

import BrandLink from '@/shared/ui/brand-link';
import { focusRing } from '@/shared/ui/interaction';

function Topbar() {
  return (
    <Flex
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      align="center"
      justify="space-between"
      gap={4}
      h={16}
      px={{ base: 4, md: 6, lg: 8 }}
      bg="white/85"
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor="slate.200"
    >
      <Box display={{ base: 'block', lg: 'none' }}>
        <BrandLink />
      </Box>

      <Flex align="center" gap={2} ml="auto">
        <IconButton
          aria-label="Notificaciones"
          variant="ghost"
          position="relative"
          h={11}
          minW={11}
          borderRadius="full"
          color="slate.600"
          _hover={{ bg: 'slate.100', color: 'slate.900' }}
          _focusVisible={focusRing}
        >
          <Bell size={20} aria-hidden="true" />
          <Box
            aria-hidden="true"
            position="absolute"
            top={2.5}
            right={2.5}
            boxSize={2}
            borderRadius="full"
            bg="brand.600"
            borderWidth="2px"
            borderColor="white"
          />
        </IconButton>

        <Flex align="center" gap={2.5} pl={1}>
          <Flex
            aria-hidden="true"
            align="center"
            justify="center"
            boxSize={9}
            borderRadius="full"
            bg="brand.100"
            color="brand.700"
            fontSize="sm"
            fontWeight="semibold"
          >
            CM
          </Flex>
          <Text srOnly>Carlos Mendoza</Text>
          <Text
            aria-hidden="true"
            display={{ base: 'none', md: 'block' }}
            fontSize="sm"
            fontWeight="medium"
            color="slate.700"
          >
            Carlos Mendoza
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default Topbar;
