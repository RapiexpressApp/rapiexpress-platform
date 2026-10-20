import { Box } from '@chakra-ui/react';
import type { PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';

import { formatDate, formatUsd, formatWeightKg, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL, PACKAGE_TYPE_LABEL } from '@/shared/model/package-labels';

import DataRow from './DataRow';
import DetailSection from './DetailSection';

interface PackageDataSectionProps {
  detail: PackageStaffDetail;
}

function PackageDataSection({ detail }: PackageDataSectionProps) {
  return (
    <DetailSection title="Datos del paquete">
      <Box as="dl">
        <DataRow label="Guía">{detail.trackingNumber}</DataRow>
        <DataRow label="Tipo">{PACKAGE_TYPE_LABEL[detail.packageType]}</DataRow>
        <DataRow label="Categoría">
          {detail.category ? CATEGORY_LABEL[detail.category] : 'Sin categoría'}
        </DataRow>
        <DataRow label="Peso">
          {`${formatWeightLb(detail.weightLb)} · ${formatWeightKg(detail.weightKg)}`}
        </DataRow>
        <DataRow label="Valor declarado">
          {detail.declaredValueUsd === null
            ? 'Sin valor declarado'
            : formatUsd(detail.declaredValueUsd)}
        </DataRow>
        <DataRow label="Descripción">{detail.description ?? 'Sin descripción'}</DataRow>
        <DataRow label="Notas">{detail.notes ?? 'Sin notas'}</DataRow>
        <DataRow label="Guía repetida">
          {detail.duplicateConfirmed ? 'Sí, se confirmó pese a una guía repetida' : 'No'}
        </DataRow>
        <DataRow label="Recibido">{formatDate(detail.createdAt)}</DataRow>
      </Box>
    </DetailSection>
  );
}

export default PackageDataSection;
