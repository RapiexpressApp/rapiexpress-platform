import { Stack, Text } from '@chakra-ui/react';
import { CUSTOMS_CATEGORIES } from '@rapiexpress/api-client/field-schemas';

import { CATEGORY_LABEL } from '@/shared/model/package-labels';
import { CATEGORY_RULE } from '@/shared/model/purchase-labels';

interface CategoryGuideProps {
  id: string;
  selected: string;
}

function CategoryGuide({ id, selected }: CategoryGuideProps) {
  return (
    <Stack as="ul" id={id} gap={1} listStyleType="none" fontSize="sm" color="slate.600">
      {CUSTOMS_CATEGORIES.map((category) => {
        const isSelected = category === selected;
        return (
          <li key={category}>
            <Text
              as="span"
              fontWeight={isSelected ? 'semibold' : 'medium'}
              color={isSelected ? 'slate.900' : 'slate.700'}
            >
              {CATEGORY_LABEL[category]}:
            </Text>{' '}
            {CATEGORY_RULE[category]}
          </li>
        );
      })}
      <li>Es una sugerencia: la categoría final se define al recibir el paquete en bodega.</li>
    </Stack>
  );
}

export default CategoryGuide;
