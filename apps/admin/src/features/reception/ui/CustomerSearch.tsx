import { Button, Flex, Input, Stack, Text } from '@chakra-ui/react';
import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles } from '@rapiexpress/ui/auth-form-styles';
import ListStatus from '@rapiexpress/ui/list-status';
import { useDebouncedValue } from '@rapiexpress/ui/use-debounced-value';
import { useState } from 'react';

import {
  isSearchable,
  RECEPTION_CUSTOMER_LIMIT,
  useReceptionCustomerSearch,
} from '../model/use-reception-customer-search';

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SEARCH_LENGTH = 100;

interface CustomerSearchProps {
  autoFocus?: boolean;
  onChoose: (customer: CustomerSummary) => void;
}

function CustomerSearch({ autoFocus = false, onChoose }: CustomerSearchProps) {
  const [draft, setDraft] = useState('');
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);
  const results = useReceptionCustomerSearch(debounced);
  const draftLength = draft.trim().length;
  const showResults = isSearchable(debounced.trim()) && isSearchable(draft.trim());
  const customers = results.data ?? [];

  return (
    <Stack gap={3}>
      <AuthField label="Buscar cliente" hint="Por nombre, apellido o casillero.">
        <Input
          type="search"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_SEARCH_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          css={{ ...inputStyles, px: 3.5 }}
        />
      </AuthField>

      {draftLength === 1 && (
        <Text fontSize="sm" color="slate.600">
          Escribe al menos 2 caracteres para buscar.
        </Text>
      )}

      {showResults && (
        <ListStatus
          isPending={results.isPending}
          isError={results.isError}
          isEmpty={customers.length === 0}
          errorMessage="No pudimos buscar clientes."
          emptyMessage="No encontramos clientes con esa búsqueda."
          buttonSize="lg"
          onRetry={() => void results.refetch()}
        >
          <Stack
            as="ul"
            gap={2}
            listStyleType="none"
            aria-busy={results.isPlaceholderData}
            opacity={results.isPlaceholderData ? 0.6 : 1}
          >
            {customers.map((customer) => (
              <li key={customer.id}>
                <Button
                  variant="outline"
                  width="full"
                  minH={11}
                  height="auto"
                  py={2.5}
                  px={4}
                  justifyContent="space-between"
                  gap={3}
                  textAlign="start"
                  whiteSpace="normal"
                  onClick={() => onChoose(customer)}
                >
                  <Text
                    as="span"
                    flex="1"
                    minW={0}
                    fontWeight="semibold"
                    color="slate.900"
                    overflowWrap="anywhere"
                  >
                    {customer.name} {customer.lastName}
                  </Text>
                  <Flex as="span" flexShrink={0} fontFamily="mono" fontSize="sm" color="slate.700">
                    {customer.lockerCode ?? 'Sin casillero'}
                  </Flex>
                </Button>
              </li>
            ))}
          </Stack>
          {customers.length >= RECEPTION_CUSTOMER_LIMIT && (
            <Text fontSize="sm" color="slate.600" mt={2}>
              Mostramos los primeros {RECEPTION_CUSTOMER_LIMIT} clientes. Escribe más para afinar la
              búsqueda.
            </Text>
          )}
        </ListStatus>
      )}
    </Stack>
  );
}

export default CustomerSearch;
