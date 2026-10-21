import { Box, Grid, Text } from '@chakra-ui/react';
import type { MyPackageDetail } from '@rapiexpress/api-client/tracking.schemas';
import type { ReactNode } from 'react';

import { formatDate, formatUsd, formatWeightKg, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL } from '@/shared/model/customs-category';

interface DataRowProps {
  label: string;
  children: ReactNode;
}

function DataRow({ label, children }: DataRowProps) {
  return (
    <Grid
      templateColumns={{ base: 'minmax(0, 1fr)', sm: '12rem minmax(0, 1fr)' }}
      columnGap={4}
      rowGap={0.5}
      py={3.5}
      borderTopWidth="1px"
      borderColor="slate.200"
    >
      <Text as="dt" fontSize="sm" color="slate.600">
        {label}
      </Text>
      <Text as="dd" color="slate.900" fontVariantNumeric="tabular-nums" overflowWrap="anywhere">
        {children}
      </Text>
    </Grid>
  );
}

interface ShipmentDataProps {
  detail: MyPackageDetail;
}

function ShipmentData({ detail }: ShipmentDataProps) {
  return (
    <Box as="section" aria-labelledby="shipment-data-title">
      <Text
        as="h2"
        id="shipment-data-title"
        mb={1}
        fontSize="lg"
        fontWeight="semibold"
        letterSpacing="tight"
        color="slate.900"
      >
        Datos del paquete
      </Text>
      <Box as="dl">
        <DataRow label="Descripción">{detail.description ?? 'Sin descripción'}</DataRow>
        <DataRow label="Peso">{`${formatWeightLb(detail.weightLb)} · ${formatWeightKg(detail.weightKg)}`}</DataRow>
        <DataRow label="Categoría">
          {detail.category ? CATEGORY_LABEL[detail.category] : 'Sin categoría'}
        </DataRow>
        <DataRow label="Valor declarado">
          {detail.declaredValueUsd === null ? 'Sin declarar' : formatUsd(detail.declaredValueUsd)}
        </DataRow>
        <DataRow label="Recibido en bodega">{formatDate(detail.receivedAt)}</DataRow>
      </Box>
    </Box>
  );
}

export default ShipmentData;
