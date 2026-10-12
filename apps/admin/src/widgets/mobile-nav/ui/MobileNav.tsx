import { Box, Flex } from '@chakra-ui/react';
import { focusRing } from '@rapiexpress/ui/interaction';
import { NavLink } from 'react-router';

import type { NavItem } from '@/shared/model/nav-item';

interface MobileNavProps {
  items: NavItem[];
}

function MobileNav({ items }: MobileNavProps) {
  return (
    <Box
      as="nav"
      aria-label="Navegación móvil"
      display={{ base: 'block', lg: 'none' }}
      bg="white"
      borderBottomWidth="1px"
      borderColor="slate.200"
      px={2}
    >
      <Flex as="ul" listStyleType="none" gap={1}>
        {items.map((item) => (
          <li key={item.to}>
            <Flex
              asChild
              align="center"
              gap={2}
              minH={11}
              px={3}
              borderRadius="lg"
              fontSize="sm"
              fontWeight="medium"
              color="slate.600"
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
      </Flex>
    </Box>
  );
}

export default MobileNav;
