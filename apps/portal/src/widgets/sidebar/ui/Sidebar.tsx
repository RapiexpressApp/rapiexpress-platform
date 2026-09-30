import { Box, Button, Flex, Stack } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { Link, NavLink } from 'react-router';

import type { NavItem } from '@/shared/model/nav-item';
import BrandLink from '@/shared/ui/brand-link';
import { focusRing, pressable } from '@/shared/ui/interaction';

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
      overscrollBehavior="contain"
    >
      <Box px={2}>
        <BrandLink />
      </Box>

      <Button
        asChild
        colorPalette="brand"
        height={11}
        fontSize="sm"
        fontWeight="semibold"
        borderRadius="lg"
        css={pressable}
      >
        <Link to="/pre-alerts">
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          Pre-alertar compra
        </Link>
      </Button>

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
                <NavLink to={item.to} end={item.to === '/dashboard'}>
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
