import { Flex, Image, Text } from '@chakra-ui/react';

import logo from './assets/logo.webp';
import { fadeUp } from './motion.ts';

function AuthMobileBrand() {
  return (
    <Flex
      css={fadeUp('0ms')}
      display={{ base: 'flex', lg: 'none' }}
      align="center"
      gap={2.5}
      mb={10}
    >
      <Image src={logo} alt="" boxSize={9} fit="contain" />
      <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="brand.950">
        Rapiexpress
      </Text>
    </Flex>
  );
}

export default AuthMobileBrand;
