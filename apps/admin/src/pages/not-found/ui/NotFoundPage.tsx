import { Button, Flex, Text } from '@chakra-ui/react';
import { Link } from 'react-router';

function NotFoundPage() {
  return (
    <Flex as="main" minH="100dvh" direction="column" align="center" justify="center" gap={4}>
      <Text as="h1" fontSize="2xl" fontWeight="semibold" color="slate.900">
        No encontramos esta página
      </Text>
      <Button asChild colorPalette="brand">
        <Link to="/">Ir al inicio</Link>
      </Button>
    </Flex>
  );
}

export default NotFoundPage;
