import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import type { StaffPurchase } from '@rapiexpress/api-client/purchases.schemas';
import { focusRing } from '@rapiexpress/ui/interaction';
import { Check } from 'lucide-react';

import { formatCustomer } from '@/features/reception/model/reception-format';
import { formatDate, formatUsd, formatWeightLb } from '@/shared/lib/format';

interface PurchaseOptionProps {
  purchase: StaffPurchase;
  selected: boolean;
  disabled: boolean;
  onChoose: (purchase: StaffPurchase) => void;
}

function PurchaseOption({ purchase, selected, disabled, onChoose }: PurchaseOptionProps) {
  return (
    <Button
      variant="outline"
      width="full"
      height="auto"
      minH={11}
      py={2.5}
      px={4}
      justifyContent="space-between"
      gap={3}
      textAlign="start"
      whiteSpace="normal"
      aria-pressed={selected}
      disabled={disabled}
      borderColor={selected ? 'brand.600' : 'slate.300'}
      bg={selected ? 'brand.50' : 'white'}
      touchAction="manipulation"
      _hover={{ bg: selected ? 'brand.50' : 'slate.50' }}
      _focusVisible={focusRing}
      onClick={() => onChoose(purchase)}
    >
      <Stack as="span" gap={0.5} flex="1" minW={0} align="flex-start">
        <Flex as="span" gap={2} wrap="wrap" align="baseline">
          <Text as="span" fontWeight="semibold" color="slate.900">
            {purchase.store}
          </Text>
          <Text as="span" fontFamily="mono" fontSize="sm" color="slate.700" overflowWrap="anywhere">
            {purchase.trackingNumber}
          </Text>
        </Flex>
        <Text as="span" fontSize="sm" fontWeight="normal" color="slate.700">
          {formatCustomer(purchase.customer)}
        </Text>
        <Text
          as="span"
          fontSize="sm"
          fontWeight="normal"
          color="slate.600"
          fontVariantNumeric="tabular-nums"
        >
          {`${formatUsd(purchase.declaredValueUsd)} · ${formatWeightLb(purchase.estimatedWeightLb)} · ${formatDate(purchase.createdAt)}`}
        </Text>
      </Stack>
      {selected && <Check size={18} strokeWidth={2.5} aria-hidden="true" />}
    </Button>
  );
}

export default PurchaseOption;
