import { Box, Text } from '@chakra-ui/react';
import type { PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';

import { formatDate, formatUsd, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL } from '@/shared/model/package-labels';

import DataRow from './DataRow';
import DetailSection from './DetailSection';

interface PackagePurchaseSectionProps {
  purchase: PackageStaffDetail['purchase'];
}

function PackagePurchaseSection({ purchase }: PackagePurchaseSectionProps) {
  return (
    <DetailSection title="Compra vinculada">
      {purchase ? (
        <Box as="dl">
          <DataRow label="Tienda">{purchase.store}</DataRow>
          <DataRow label="Guía">{purchase.trackingNumber}</DataRow>
          <DataRow label="Valor declarado">{formatUsd(purchase.declaredValueUsd)}</DataRow>
          <DataRow label="Peso estimado">{formatWeightLb(purchase.estimatedWeightLb)}</DataRow>
          <DataRow label="Categoría sugerida">{CATEGORY_LABEL[purchase.suggestedCategory]}</DataRow>
          <DataRow label="Pre-alertada">{formatDate(purchase.createdAt)}</DataRow>
        </Box>
      ) : (
        <Text color="slate.700">Sin compra vinculada</Text>
      )}
    </DetailSection>
  );
}

export default PackagePurchaseSection;
