import { Box, Flex, Image, Stack, Text } from '@chakra-ui/react';
import logo from '@rapiexpress/ui/assets/logo.webp';
import { focusRing } from '@rapiexpress/ui/interaction';
import { NavLink } from 'react-router';

import type { NavItem } from '@/shared/model/nav-item';

interface SidebarProps {
  items: NavItem[];
}

function Sidebar({ items }: SidebarProps) {
  return (
    <Flex
      as="aside"
      direction="column"
      gap={6}
      display={{ base: 'none', lg: 'flex' }}
      position="fixed"
      top={0}
      bottom={0}
      left={0}
      w={64}
      px={4}
      py={5}
      bg="white"
      borderRightWidth="1px"
      borderColor="slate.200"
      overflowY="auto"
    >
      <Flex align="center" gap={2.5} px={2}>
        <Image src={logo} alt="" boxSize={9} fit="contain" />
        <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="brand.950">
          Rapiexpress
        </Text>
      </Flex>

      <Box as="nav" aria-label="Navegación principal">
        <Stack as="ul" gap={1} listStyleType="none">
          {items.map((item) => (
            <li key={item.to}>
              <Flex
                asChild
                align="center"
                gap={3}
                minH={11}
                px={3}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="medium"
                color="slate.600"
                transition="background-color 150ms ease, color 150ms ease"
                _hover={{ bg: 'slate.100', color: 'slate.900' }}
                _currentPage={{ bg: 'brand.50', color: 'brand.700', fontWeight: 'semibold' }}
                _focusVisible={focusRing}
              >
                <NavLink to={item.to}>
                  <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                  {item.label}
                </NavLink>
              </Flex>
            </li>
          ))}
        </Stack>
      </Box>
    </Flex>
  );
}

export default Sidebar;
