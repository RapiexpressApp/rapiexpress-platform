import { DataList } from '@chakra-ui/react';
import type { ReceptionMatch } from '@rapiexpress/api-client/packages.schemas';

import { formatUsd, formatWeightLb } from '@/shared/lib/format';
import { CATEGORY_LABEL } from '@/shared/model/package-labels';

import { formatCustomer } from '../model/reception-format';

interface MatchDetailsProps {
  match: ReceptionMatch;
}

function MatchDetails({ match }: MatchDetailsProps) {
  return (
    <DataList.Root orientation="horizontal" size="sm" gap={1.5}>
      <DataList.Item>
        <DataList.ItemLabel>Cliente</DataList.ItemLabel>
        <DataList.ItemValue fontWeight="semibold">
          {formatCustomer(match.customer)}
        </DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Tienda</DataList.ItemLabel>
        <DataList.ItemValue>{match.store}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Descripción</DataList.ItemLabel>
        <DataList.ItemValue>{match.description}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Valor declarado</DataList.ItemLabel>
        <DataList.ItemValue fontVariantNumeric="tabular-nums">
          {formatUsd(match.declaredValueUsd)}
        </DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Peso estimado</DataList.ItemLabel>
        <DataList.ItemValue fontVariantNumeric="tabular-nums">
          {formatWeightLb(match.estimatedWeightLb)}
        </DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Categoría</DataList.ItemLabel>
        <DataList.ItemValue>{CATEGORY_LABEL[match.suggestedCategory]}</DataList.ItemValue>
      </DataList.Item>
    </DataList.Root>
  );
}

export default MatchDetails;
