import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router';

import { useMe } from '@/features/auth/model/use-me';
import { isPanelRole } from '@/shared/model/roles';
import MobileNav from '@/widgets/mobile-nav/ui/MobileNav';
import Sidebar from '@/widgets/sidebar/ui/Sidebar';
import Topbar from '@/widgets/topbar/ui/Topbar';

import { getNavItems } from './nav-items';

function AdminLayout() {
  const { data: profile } = useMe();
  const items = profile && isPanelRole(profile.role) ? getNavItems(profile.role) : [];

  return (
    <Box minH="100dvh" bg="slate.50">
      <Sidebar items={items} />
      <Box pl={{ lg: 64 }}>
        <Topbar />
        <MobileNav items={items} />
        <Box as="main" id="main-content" px={{ base: 4, md: 6, lg: 8 }} py={{ base: 6, lg: 8 }}>
          <Box maxW="1120px" mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
