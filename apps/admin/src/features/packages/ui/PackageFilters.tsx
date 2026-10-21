import { Button, Flex, NativeSelect } from '@chakra-ui/react';
import { PACKAGE_STATUSES, packageStatusSchema } from '@rapiexpress/api-client/packages.schemas';
import { inputStyles } from '@rapiexpress/ui/auth-form-styles';
import { focusRing } from '@rapiexpress/ui/interaction';

import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';

import type { PackageFilters as Filters } from '../model/package-list-params';

interface PackageFiltersProps {
  filters: Filters;
  onChange: (changes: Partial<Filters>) => void;
}

interface ToggleProps {
  label: string;
  pressed: boolean;
  onToggle: (next: boolean) => void;
}

function FilterToggle({ label, pressed, onToggle }: ToggleProps) {
  return (
    <Button
      variant="outline"
      aria-pressed={pressed}
      minH={11}
      px={3.5}
      fontSize="sm"
      fontWeight={pressed ? 'semibold' : 'medium'}
      borderRadius="lg"
      borderColor={pressed ? 'brand.600' : 'slate.300'}
      bg={pressed ? 'brand.50' : 'white'}
      color={pressed ? 'brand.700' : 'slate.700'}
      touchAction="manipulation"
      _hover={{ bg: pressed ? 'brand.50' : 'slate.50' }}
      _focusVisible={focusRing}
      onClick={() => onToggle(!pressed)}
    >
      {label}
    </Button>
  );
}

function PackageFilters({ filters, onChange }: PackageFiltersProps) {
  return (
    <Flex role="group" aria-label="Filtros de paquetes" wrap="wrap" align="center" gap={2}>
      <NativeSelect.Root width={{ base: 'full', sm: '14rem' }}>
        <NativeSelect.Field
          aria-label="Estado"
          css={{ ...inputStyles, px: 3.5 }}
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({ status: packageStatusSchema.safeParse(event.target.value).data ?? null })
          }
        >
          <option value="">Todos los estados</option>
          {PACKAGE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PACKAGE_STATUS_LABEL[status]}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <FilterToggle
        label="Sin cliente asignado"
        pressed={filters.unassigned}
        onToggle={(next) => onChange({ unassigned: next })}
      />
      <FilterToggle
        label="Con incidencia abierta"
        pressed={filters.hasIncident}
        onToggle={(next) => onChange({ hasIncident: next })}
      />
    </Flex>
  );
}

export default PackageFilters;
