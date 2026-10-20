import { Button, Flex } from '@chakra-ui/react';
import { PURCHASE_STATUSES, type PurchaseStatus } from '@rapiexpress/api-client/purchases.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';

import { PURCHASE_STATUS_FILTER_LABEL } from '../model/purchase-labels';

interface PurchaseStatusFilterProps {
  value: PurchaseStatus | null;
  onChange: (status: PurchaseStatus | null) => void;
}

const OPTIONS: { value: PurchaseStatus | null; label: string }[] = [
  { value: null, label: 'Todas' },
  ...PURCHASE_STATUSES.map((status) => ({
    value: status,
    label: PURCHASE_STATUS_FILTER_LABEL[status],
  })),
];

function PurchaseStatusFilter({ value, onChange }: PurchaseStatusFilterProps) {
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

export default PurchaseStatusFilter;
