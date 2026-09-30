import { Box, chakra } from '@chakra-ui/react';
import { Outlet } from 'react-router';

import { focusRing } from '@/shared/ui/interaction';
import MobileNav from '@/widgets/mobile-nav/ui/MobileNav';
import Sidebar from '@/widgets/sidebar/ui/Sidebar';
import Topbar from '@/widgets/topbar/ui/Topbar';

import { NAV_ITEMS } from './nav-items';

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.showInMobileNav);

function DashboardLayout() {
  return (
    <Box minH="100dvh" bg="slate.50">
      <chakra.a
        href="#main-content"
        position="fixed"
        top={3}
        left={3}
        zIndex="skipLink"
        px={4}
        py={2.5}
        borderRadius="lg"
        bg="white"
        color="brand.700"
        fontSize="sm"
        fontWeight="semibold"
        boxShadow="md"
        transform="translateY(-200%)"
        _focusVisible={{ ...focusRing, transform: 'translateY(0)' }}
      >
        Ir al contenido
      </chakra.a>

      <Sidebar items={NAV_ITEMS} />

      <Box pl={{ lg: 64 }}>
        <Topbar />
        <Box
          as="main"
          id="main-content"
          tabIndex={-1}
          outline="none"
          px={{ base: 4, md: 6, lg: 8 }}
          pt={{ base: 6, lg: 8 }}
          pb={{ base: 'calc(6rem + env(safe-area-inset-bottom))', lg: 10 }}
        >
          <Box maxW="1120px" mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Box>

      <MobileNav items={MOBILE_NAV_ITEMS} />
    </Box>
  );
}

export default DashboardLayout;
