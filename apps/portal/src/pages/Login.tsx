import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';

import BrandPanel from '../components/BrandPanel';
import LoginForm from '../features/auth/ui/LoginForm';

function Login() {
  useEffect(() => {
    document.title = 'Iniciar sesión · Rapiexpress';
  }, []);

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
        <LoginForm />
      </Box>
    </Box>
  );
}

export default Login;
