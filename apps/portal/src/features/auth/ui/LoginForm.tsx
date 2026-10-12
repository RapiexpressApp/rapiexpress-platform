import { Box, Button, chakra, Field, Input, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { getLoginErrorMessage } from '@/features/auth/model/auth-errors';
import { useLogin } from '@/features/auth/model/use-login';
import { loginSchema, type LoginSchemaType } from '@/features/auth/validation/login.validation';
import { fadeUp } from '@/shared/ui/motion';
import { PasswordInput } from '@/shared/ui/password-input';

import { inputStyles, submitButtonProps } from './auth-form-styles';
import AuthMobileBrand from './AuthMobileBrand';

function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  function onSubmit(values: LoginSchemaType) {
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
        Bienvenido de nuevo
      </Text>

      <Text css={fadeUp('120ms')} mt={2} fontSize="sm" color="slate.600">
        Ingresa para seguir tus paquetes y gestionar tu casillero.
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
            placeholder="tucorreo@ejemplo.com"
            css={{ ...inputStyles, px: 3.5 }}
            {...register('email')}
          />
          {errors.email && (
            <Field.ErrorText color="red.500">{errors.email?.message}</Field.ErrorText>
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
            <Field.ErrorText color="red.500">{errors.password?.message}</Field.ErrorText>
          )}
        </Field.Root>

        {login.isError && (
          <Text role="alert" fontSize="sm" color="red.500">
            {getLoginErrorMessage(login.error)}
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

      <Text css={fadeUp('240ms')} mt={6} textAlign="center" fontSize="sm" color="slate.600">
        ¿Aún no tienes casillero?
      </Text>
    </Box>
  );
}

export default LoginForm;
