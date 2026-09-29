import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';

import logo from '@/shared/assets/logo.webp';
import { fadeUp } from '@/shared/ui/motion';
import { PackageIllustration } from '@/shared/ui/package-illustration';

function NotFoundPage() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = 'Página no encontrada · Rapiexpress';
  }, []);

  return (
    <Flex
      minH="100dvh"
      direction="column"
      bgGradient="to-b"
      gradientFrom="brand.50"
      gradientTo="white"
      px={{ base: 6, md: 10 }}
      py={{ base: 6, md: 8 }}
    >
      <Flex
        asChild
        align="center"
        gap={2.5}
        alignSelf="flex-start"
        borderRadius="md"
        _focusVisible={{ outline: '2px solid', outlineColor: 'brand.500', outlineOffset: '4px' }}
      >
        <Link to="/">
          <Image src={logo} alt="" boxSize={9} fit="contain" />
          <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="brand.950">
            Rapiexpress
          </Text>
        </Link>
      </Flex>

      <Flex
        as="main"
        flex="1"
        direction="column"
        align="center"
        justify="center"
        py={12}
        textAlign="center"
      >
        <Flex
          aria-hidden="true"
          css={fadeUp('0ms')}
          align="center"
          justify="center"
          gap={{ base: 1, md: 2 }}
          fontSize={{ base: '7rem', sm: '9rem', md: '11rem' }}
          fontWeight="extrabold"
          lineHeight="1"
          letterSpacing="-0.04em"
          color="brand.200"
        >
          <span>4</span>
          <Box
            display="flex"
            animationName="login-float"
            animationDuration="5s"
            animationTimingFunction="ease-in-out"
            animationIterationCount="infinite"
            _motionReduce={{ animation: 'none' }}
          >
            <PackageIllustration boxSize="0.85em" />
          </Box>
          <span>4</span>
        </Flex>

        <Text
          as="h1"
          css={fadeUp('80ms')}
          mt={6}
          fontSize={{ base: '2xl', md: '4xl' }}
          fontWeight="semibold"
          letterSpacing="tight"
          color="slate.900"
        >
          No encontramos esta página
        </Text>

        <Text css={fadeUp('140ms')} mt={3} maxW="md" fontSize="md" color="slate.600">
          La dirección que buscas no existe o cambió de lugar. Tus paquetes y tu casillero no se ven
          afectados.
        </Text>

        <Text
          as="code"
          css={fadeUp('200ms')}
          mt={5}
          maxW="full"
          px={3}
          py={1.5}
          borderRadius="md"
          borderWidth="1px"
          borderColor="slate.300"
          bg="white"
          fontFamily="mono"
          fontSize="sm"
          color="slate.700"
          wordBreak="break-all"
        >
          {pathname}
        </Text>

        <Button
          asChild
          css={fadeUp('260ms')}
          mt={8}
          colorPalette="brand"
          height={11}
          px={7}
          fontSize="md"
          fontWeight="semibold"
          borderRadius="lg"
          touchAction="manipulation"
          transition="background-color 150ms ease, transform 150ms ease"
          _hover={{ bg: 'brand.700', translateY: '-2px' }}
          _active={{ transform: 'scale(0.98)' }}
          _focusVisible={{
            outline: 'none',
            boxShadow: '0 0 0 2px white, 0 0 0 4px {colors.brand.600}',
          }}
        >
          <Link to="/">Ir al inicio</Link>
        </Button>
      </Flex>
    </Flex>
  );
}

export default NotFoundPage;
