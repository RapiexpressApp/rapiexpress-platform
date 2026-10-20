import { Box, Text } from '@chakra-ui/react';
import type { PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';

import DataRow from './DataRow';
import DetailSection from './DetailSection';

interface PackageCustomerSectionProps {
  customer: PackageStaffDetail['customer'];
}

function PackageCustomerSection({ customer }: PackageCustomerSectionProps) {
  return (
    <DetailSection title="Cliente">
      {customer ? (
        <Box as="dl">
          <DataRow label="Nombre">{`${customer.name} ${customer.lastName}`}</DataRow>
          <DataRow label="Casillero">{customer.lockerCode ?? 'Sin casillero'}</DataRow>
        </Box>
      ) : (
        <Text color="slate.700">Sin asignar</Text>
      )}
    </DetailSection>
  );
}

export default PackageCustomerSection;
