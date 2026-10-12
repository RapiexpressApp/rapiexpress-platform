import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Bell, LogOut } from 'lucide-react';

import { getFullName, getInitials } from '@/features/auth/model/profile-display';
import { useLogout } from '@/features/auth/model/use-logout';
import { useMe } from '@/features/auth/model/use-me';
import BrandLink from '@/shared/ui/brand-link';

function Topbar() {
  const logout = useLogout();
  const { data: profile } = useMe();
  const fullName = profile ? getFullName(profile) : '';

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
            {profile ? getInitials(profile) : null}
          </Flex>
          <Text srOnly>{fullName}</Text>
          <Text
            aria-hidden="true"
            display={{ base: 'none', md: 'block' }}
            fontSize="sm"
            fontWeight="medium"
            color="slate.700"
          >
            {fullName}
          </Text>
        </Flex>

        <IconButton
          aria-label="Cerrar sesión"
          variant="ghost"
          h={11}
          minW={11}
          borderRadius="full"
          color="slate.600"
          loading={logout.isPending}
          onClick={() => logout.mutate()}
          _hover={{ bg: 'slate.100', color: 'slate.900' }}
          _focusVisible={focusRing}
        >
          <LogOut size={20} aria-hidden="true" />
        </IconButton>
      </Flex>
    </Flex>
  );
}

export default Topbar;
