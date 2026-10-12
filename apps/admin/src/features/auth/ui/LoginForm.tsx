import { Box, Button, chakra, Field, Input, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginPayload, loginPayloadSchema } from '@rapiexpress/api-client/auth.schemas';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import AuthMobileBrand from '@rapiexpress/ui/auth-mobile-brand';
import { fadeUp } from '@rapiexpress/ui/motion';
import { PasswordInput } from '@rapiexpress/ui/password-input';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router';

import { getLoginErrorMessage, NO_PANEL_ACCESS_MESSAGE } from '@/features/auth/model/auth-errors';
import { useLogin } from '@/features/auth/model/use-login';
import type { LoginRedirectState } from '@/features/auth/model/use-logout';

function LoginForm() {
  const login = useLogin();
  const location = useLocation();
  const redirectState = location.state as LoginRedirectState | null;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginPayloadSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const errorMessage = login.isError
    ? getLoginErrorMessage(login.error)
    : redirectState?.noPanelAccess
      ? NO_PANEL_ACCESS_MESSAGE
      : null;

  function onSubmit(values: LoginPayload) {
    if (login.isPending) return;
    login.mutate(values);
  }

  return (
    <Box w="full" maxW="380px">
      <AuthMobileBrand />

      <Text
        as="h1"
        css={fadeUp('60ms')}
        fontSize="3xl"
        fontWeight="semibold"
        letterSpacing="tight"
        color="slate.900"
      >
        Panel administrativo
      </Text>

      <Text css={fadeUp('120ms')} mt={2} fontSize="sm" color="slate.600">
        Ingresa con tu cuenta del personal de Rapiexpress.
      </Text>

      <chakra.form
        noValidate
        css={{ ...fadeUp('180ms'), display: 'flex', flexDirection: 'column', gap: 5 }}
        mt={8}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Field.Root invalid={!!errors.email}>
          <Field.Label color="slate.700">Correo electrónico</Field.Label>
          <Input
            type="email"
            placeholder="tucorreo@rapiexpress.com"
            css={{ ...inputStyles, px: 3.5 }}
            {...register('email')}
          />
          {errors.email && (
            <Field.ErrorText color="red.500">{errors.email.message}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.password}>
          <Field.Label color="slate.700">Contraseña</Field.Label>
          <PasswordInput
            placeholder="Tu contraseña"
            css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
            {...register('password')}
          />
          {errors.password && (
            <Field.ErrorText color="red.500">{errors.password.message}</Field.ErrorText>
          )}
        </Field.Root>

        {errorMessage && (
          <Text role="alert" fontSize="sm" color="red.500">
            {errorMessage}
          </Text>
        )}

        <Button
          type="submit"
          loading={login.isPending}
          loadingText="Ingresando"
          {...submitButtonProps}
        >
          Entrar
        </Button>
      </chakra.form>
    </Box>
  );
}

export default LoginForm;
