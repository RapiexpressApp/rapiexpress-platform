import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import BrandPanel from './BrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box display="flex" minH="100dvh" bg="white">
      <BrandPanel />
      <Box
        as="main"
        display="flex"
        flex="1"
        alignItems="center"
        justifyContent="center"
        px={6}
        py={{ base: 8, sm: 12 }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default AuthLayout;
