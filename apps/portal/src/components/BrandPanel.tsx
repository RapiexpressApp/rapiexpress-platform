import { Box, chakra, Flex, Grid, Image, Stack, Text } from '@chakra-ui/react';
import { type LucideIcon, Package, ShieldCheck, Truck } from 'lucide-react';

import logo from '../assets/logo.webp';

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Package, label: 'Seguimiento en línea de tus paquetes' },
  { icon: ShieldCheck, label: 'Tus comprobantes y datos, protegidos' },
  { icon: Truck, label: 'Entrega a domicilio o retiro en agencia' },
];

function BrandPanel() {
  return (
    <Flex
      as="aside"
      direction="column"
      display={{ base: 'none', lg: 'flex' }}
      w="42%"
      maxW="2xl"
      p={{ base: 10, xl: 14 }}
      bgGradient="to-b"
      gradientFrom="brand.50"
      gradientTo="brand.100/50"
    >
      <Flex align="center" gap={3}>
        <Image src={logo} alt="" boxSize={11} fit="contain" />
        <Text fontSize="xl" fontWeight="bold" letterSpacing="tight" color="brand.950">
          Rapiexpress
        </Text>
      </Flex>

      <Grid placeItems="center" flex="1" py={10}>
        <Box>
          <Box aria-hidden="true" position="relative">
            <chakra.svg
              viewBox="0 0 160 96"
              fill="none"
              position="absolute"
              top={-12}
              right={0}
              w={36}
              color="brand.300"
              focusable="false"
              animationName="login-fade-in"
              animationDuration="slow"
              animationFillMode="both"
              animationDelay="600ms"
              animationTimingFunction="entrance"
              _motionReduce={{ animation: 'none' }}
            >
              <path
                d="M6 88 C 30 34, 92 10, 136 28"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="0.5 9"
              />
              <g transform="translate(132 2) rotate(16 12 12)">
                <chakra.g
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animationName="login-plane"
                  animationDuration="4s"
                  animationIterationCount="infinite"
                  animationDelay="900ms"
                  _motionReduce={{ animation: 'none' }}
                >
                  <path d="M22 2 L11 13" />
                  <path d="M22 2 L15 22 L11 13 L2 9 Z" />
                </chakra.g>
              </g>
            </chakra.svg>

            <Box
              position="relative"
              zIndex={10}
              animationName="login-float"
              animationDuration="5s"
              animationTimingFunction="ease-in-out"
              animationIterationCount="infinite"
              _motionReduce={{ animation: 'none' }}
            >
              <chakra.svg
                viewBox="60 100 280 280"
                h="auto"
                w={{ base: 64, sm: 72 }}
                focusable="false"
                aria-hidden="true"
              >
                <path d="M200 110 L320 170 L200 230 L80 170 Z" fill="#8aa4ea" />
                <path d="M80 170 L200 230 L200 380 L80 320 Z" fill="#2a5ce5" />
                <path d="M200 230 L320 170 L320 320 L200 380 Z" fill="#1041c6" />
                <path d="M128 146 L152 134 L272 194 L248 206 Z" fill="#facc15" />
                <path d="M248 206 L272 194 L272 344 L248 356 Z" fill="#eab308" />
                <path d="M104 220 L176 256 L176 316 L104 280 Z" fill="#ffffff" />
                <path d="M114 238 L166 264 L166 273 L114 248 Z" fill="#cbd5e1" />
                <path d="M114 257 L146 274 L146 283 L114 266 Z" fill="#cbd5e1" />
              </chakra.svg>
            </Box>

            <Box mx="auto" mt={1} h={3.5} w={44} borderRadius="full" bg="brand.950/10" />
          </Box>

          <Text mt={7} textAlign="center" fontSize="sm" fontWeight="medium" color="brand.800">
            De la bodega a tu puerta
          </Text>

          <Stack as="ul" mx="auto" mt={8} w="fit-content" gap={3.5} listStyleType="none">
            {FEATURES.map((feature) => (
              <Flex as="li" key={feature.label} align="center" gap={3}>
                <Box display="flex" flexShrink={0} color="brand.600">
                  <feature.icon size={20} strokeWidth={2} aria-hidden="true" />
                </Box>
                <Text fontSize="sm" color="slate.600">
                  {feature.label}
                </Text>
              </Flex>
            ))}
          </Stack>
        </Box>
      </Grid>

      <Flex align="center" justify="space-between" fontSize="xs" color="slate.500">
        <span>© 2026 Rapiexpress</span>
        <span>Conexión cifrada (HTTPS)</span>
      </Flex>
    </Flex>
  );
}

export default BrandPanel;
