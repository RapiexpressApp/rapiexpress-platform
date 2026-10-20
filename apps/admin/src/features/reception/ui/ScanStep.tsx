import { Button, chakra, Flex, Input, Text } from '@chakra-ui/react';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { type FormEvent, useState } from 'react';

import { parseScannedGuide } from '../model/scan-guide';

interface ScanStepProps {
  initialValue?: string;
  pending: boolean;
  failed: boolean;
  onScan: (trackingNumber: string) => void;
  onRetry: () => void;
}

const LOOKUP_FAILED_MESSAGE = 'No pudimos consultar la guía.';

function ScanStep({ initialValue = '', pending, failed, onScan, onRetry }: ScanStepProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const guide = parseScannedGuide(value);
    if (!guide.ok) {
      setError(guide.message);
      return;
    }
    setError(undefined);
    onScan(guide.trackingNumber);
  }

  return (
    <chakra.form noValidate display="flex" flexDirection="column" gap={4} onSubmit={handleSubmit}>
      <AuthField
        label="Guía de seguimiento"
        error={error}
        hint="Escanea el código o escríbelo y presiona Enter."
      >
        <Input
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="search"
          readOnly={pending}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          css={{ ...inputStyles, px: 3.5, fontFamily: 'mono', fontVariantNumeric: 'tabular-nums' }}
        />
      </AuthField>

      {failed && (
        <Flex role="alert" direction="column" align="flex-start" gap={2}>
          <Text fontSize="sm" color="red.600">
            {LOOKUP_FAILED_MESSAGE}
          </Text>
          <Button variant="outline" height={11} px={5} onClick={onRetry}>
            Reintentar
          </Button>
        </Flex>
      )}

      <Button
        type="submit"
        loading={pending}
        loadingText="Buscando"
        {...submitButtonProps}
        width={{ base: 'full', sm: 'auto' }}
        alignSelf="flex-start"
        px={6}
      >
        Buscar guía
      </Button>
    </chakra.form>
  );
}

export default ScanStep;
