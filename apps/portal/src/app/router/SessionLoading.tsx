import { Flex, Spinner } from '@chakra-ui/react';

function SessionLoading() {
  return (
    <Flex role="status" aria-label="Cargando sesión" minH="100dvh" align="center" justify="center">
      <Spinner color="brand.600" size="lg" />
    </Flex>
  );
}

export default SessionLoading;
