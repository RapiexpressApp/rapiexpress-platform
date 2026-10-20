import { Button, Flex } from '@chakra-ui/react';
import {
  VISIBLE_PACKAGE_STATUSES,
  type VisiblePackageStatus,
} from '@rapiexpress/api-client/tracking.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';

import { PACKAGE_STATUS_LABEL } from '../model/shipment-labels';

interface PackageStatusFilterProps {
  value: VisiblePackageStatus | null;
  onChange: (status: VisiblePackageStatus | null) => void;
}

const OPTIONS: { value: VisiblePackageStatus | null; label: string }[] = [
  { value: null, label: 'Todos' },
  ...VISIBLE_PACKAGE_STATUSES.map((status) => ({
    value: status,
    label: PACKAGE_STATUS_LABEL[status],
  })),
];

function PackageStatusFilter({ value, onChange }: PackageStatusFilterProps) {
  return (
    <Flex role="group" aria-label="Filtrar por estado" wrap="wrap" gap={2}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.label}
            variant="outline"
            aria-pressed={selected}
            minH={11}
            px={4}
            fontSize="sm"
            fontWeight={selected ? 'semibold' : 'medium'}
            borderRadius="lg"
            borderColor={selected ? 'brand.600' : 'slate.300'}
            bg={selected ? 'brand.50' : 'white'}
            color={selected ? 'brand.700' : 'slate.700'}
            touchAction="manipulation"
            _hover={{ bg: selected ? 'brand.50' : 'slate.50' }}
            _focusVisible={focusRing}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </Flex>
  );
}

export default PackageStatusFilter;
