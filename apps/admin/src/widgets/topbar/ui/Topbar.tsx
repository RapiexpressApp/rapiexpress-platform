import { Badge, Button, Flex, Text } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';
import { LogOut } from 'lucide-react';

import { useLogout } from '@/features/auth/model/use-logout';
import { useMe } from '@/features/auth/model/use-me';
import { getRoleLabel } from '@/shared/model/roles';

function Topbar() {
  const logout = useLogout();
  const { data: profile } = useMe();

  return (
    <Flex
      as="header"
      position="sticky"
      top={0}
      zIndex="sticky"
      align="center"
      justify="flex-end"
      gap={3}
      h={16}
      px={{ base: 4, md: 6, lg: 8 }}
      bg="white/85"
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor="slate.200"
    >
      {profile && (
        <Flex align="center" gap={2.5}>
          <Text display={{ base: 'none', md: 'block' }} fontSize="sm" fontWeight="medium">
            {`${profile.name} ${profile.lastName}`}
          </Text>
          <Badge colorPalette="brand" variant="subtle">
            {getRoleLabel(profile.role)}
          </Badge>
        </Flex>
      )}
      <Button
        variant="ghost"
        size="sm"
        color="slate.600"
        loading={logout.isPending}
        onClick={() => logout.mutate({})}
        _hover={{ bg: 'slate.100', color: 'slate.900' }}
        _focusVisible={focusRing}
      >
        <LogOut size={16} aria-hidden="true" />
        Cerrar sesión
      </Button>
    </Flex>
  );
}

export default Topbar;
