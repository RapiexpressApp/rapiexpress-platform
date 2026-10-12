import { Input } from '@chakra-ui/react';
import { inputStyles } from '@rapiexpress/ui/auth-form-styles';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/shared/lib/use-debounced-value';

const SEARCH_DEBOUNCE_MS = 300;

interface ListSearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  label: string;
}

function ListSearchInput({ value, onSearch, placeholder, label }: ListSearchInputProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debounced.trim() !== value) onSearch(debounced);
  }, [debounced, value, onSearch]);

  return (
    <Input
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      css={{ ...inputStyles, px: 3.5, maxW: 'sm' }}
    />
  );
}

export default ListSearchInput;
