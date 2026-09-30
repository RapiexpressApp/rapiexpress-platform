import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { ClipboardList, type LucideIcon, PackageCheck, Truck } from 'lucide-react';

import { fadeUp } from '@/shared/ui/motion';

import type { HomeStats } from '../model/types';

interface StatCardsProps {
  stats: HomeStats;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
  hero?: boolean;
}

function StatCard({ icon: Icon, label, value, helper, hero = false }: StatCardProps) {
  return (
    <Flex
      as="li"
      direction="column"
      justify={{ base: 'space-between', md: 'flex-start' }}
      gap={3}
      p={{ base: 4, md: 5 }}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={hero ? 'brand.100' : 'slate.200'}
      bg={hero ? 'brand.50' : 'white'}
      gridColumn={hero ? { base: 'span 2', md: 'auto' } : undefined}
    >
      <Flex align="center" gap={2} color={hero ? 'brand.700' : 'slate.600'}>
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      </Flex>
      <Box>
        <Text
          fontSize={hero ? { base: '4xl', md: '5xl' } : { base: '3xl', md: '4xl' }}
          fontWeight="bold"
          letterSpacing="-0.02em"
          lineHeight="1"
          fontVariantNumeric="tabular-nums"
          color={hero ? 'brand.700' : 'slate.900'}
        >
          {value}
        </Text>
        <Text mt={2} fontSize="sm" color="slate.600">
          {helper}
        </Text>
      </Box>
    </Flex>
  );
}

function StatCards({ stats }: StatCardsProps) {
  return (
    <Box as="section" aria-label="Resumen de tus paquetes" css={fadeUp('140ms')}>
      <Grid
        as="ul"
        listStyleType="none"
        gap={{ base: 3, md: 4 }}
        templateColumns={{
          base: 'repeat(2, minmax(0, 1fr))',
          md: 'minmax(0, 1.4fr) repeat(2, minmax(0, 1fr))',
        }}
      >
        <StatCard
          hero
          icon={Truck}
          label="En tránsito"
          value={stats.inTransit}
          helper="En camino a tu agencia"
        />
        <StatCard
          icon={PackageCheck}
          label="Listos para retirar"
          value={stats.readyForPickup}
          helper="Esperándote en agencia"
        />
        <StatCard
          icon={ClipboardList}
          label="Pre-alertas"
          value={stats.preAlerts}
          helper="Esperando llegar a Miami"
        />
      </Grid>
    </Box>
  );
}

export default StatCards;
