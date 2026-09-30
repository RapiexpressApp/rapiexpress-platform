import { Text } from '@chakra-ui/react';
import { useEffect } from 'react';

function HomePage() {
  useEffect(() => {
    document.title = 'Panel principal · Rapiexpress';
  }, []);

  return (
    <Text as="h1" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="slate.900">
      Hola, Carlos
    </Text>
  );
}

export default HomePage;
