import { Flex, Image, Text } from '@chakra-ui/react';
import logo from '@rapiexpress/ui/assets/logo.webp';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Link } from 'react-router';

function BrandLink() {
  return (
    <Flex
      asChild
      align="center"
      gap={2.5}
      alignSelf="flex-start"
      borderRadius="md"
      _focusVisible={focusRing}
    >
      <Link to="/dashboard" aria-label="Rapiexpress, ir al panel principal">
        <Image src={logo} alt="" boxSize={9} fit="contain" />
        <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="brand.950">
          Rapiexpress
        </Text>
      </Link>
    </Flex>
  );
}

export default BrandLink;
