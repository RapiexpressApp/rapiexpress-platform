import { Field } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AuthFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function AuthField({ label, error, hint, children }: AuthFieldProps) {
  return (
    <Field.Root invalid={!!error}>
      <Field.Label color="slate.700">{label}</Field.Label>
      {children}
      {error ? (
        <Field.ErrorText color="red.600">{error}</Field.ErrorText>
      ) : (
        hint && <Field.HelperText color="slate.500">{hint}</Field.HelperText>
      )}
    </Field.Root>
  );
}

export default AuthField;
