import { Box, Flex, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router';

import type { NavItem } from '@/shared/model/nav-item';
import { focusRing } from '@/shared/ui/interaction';

interface MobileNavProps {
  items: NavItem[];
}

function MobileNav({ items }: MobileNavProps) {
  return (
    <Box
      as="nav"
      aria-label="Navegación principal"
      display={{ base: 'block', lg: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex="sticky"
      bg="white"
      borderTopWidth="1px"
      borderColor="slate.200"
      pb="env(safe-area-inset-bottom)"
    >
      <Flex as="ul" listStyleType="none" px={1}>
        {items.map((item) => (
          <Box as="li" key={item.to} flex="1" minW={0}>
            <Flex
              asChild
              direction="column"
              align="center"
              justify="center"
              gap={0.5}
              minH={16}
              borderRadius="lg"
              fontSize="11px"
              fontWeight="medium"
              color="slate.500"
              touchAction="manipulation"
              transition="color 150ms ease"
              _currentPage={{ color: 'brand.700', fontWeight: 'bold' }}
              _focusVisible={focusRing}
            >
              <NavLink to={item.to} end={item.to === '/dashboard'}>
                {({ isActive }) => (
                  <>
                    <Flex
                      align="center"
                      justify="center"
                      w={12}
                      h={7}
                      borderRadius="full"
                      bg={isActive ? 'brand.50' : 'transparent'}
                      transition="background-color 150ms ease"
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                    </Flex>
                    <Text as="span">{item.mobileLabel}</Text>
                  </>
                )}
              </NavLink>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Box>
  );
}

export default MobileNav;
