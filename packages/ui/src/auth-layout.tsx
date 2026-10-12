import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  panel: ReactNode;
  children: ReactNode;
}

function AuthLayout({ panel, children }: AuthLayoutProps) {
  return (
    <Box display="flex" minH="100dvh" bg="white">
      {panel}
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
