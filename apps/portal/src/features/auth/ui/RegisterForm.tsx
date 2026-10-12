import { Box, Button, chakra, Grid, Input, Link as ChakraLink, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import {
  EMAIL_TAKEN_MESSAGE,
  getRegisterErrorMessage,
  isEmailTakenError,
} from '@/features/auth/model/auth-errors';
import { useRegister } from '@/features/auth/model/use-register';
import {
  type RegisterFormValues,
  registerSchema,
  type RegisterSchemaType,
} from '@/features/auth/validation/register.validation';
import { fadeUp } from '@/shared/ui/motion';
import { PasswordInput } from '@/shared/ui/password-input';

import { inputStyles, submitButtonProps } from './auth-form-styles';
import AuthField from './AuthField';
import AuthMobileBrand from './AuthMobileBrand';

function RegisterForm() {
  const registration = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  function onSubmit({ name, lastName, email, phone, password }: RegisterSchemaType) {
    if (registration.isPending) return;
    registration.mutate({ name, lastName, email, phone, password });
  }

  const emailTaken = registration.isError && isEmailTakenError(registration.error);
  const emailError = errors.email?.message ?? (emailTaken ? EMAIL_TAKEN_MESSAGE : undefined);

  return (
    <Box w="full" maxW="440px">
      <AuthMobileBrand />

      <Text
        as="h1"
        css={fadeUp('60ms')}
        fontSize="3xl"
        fontWeight="semibold"
        letterSpacing="tight"
        color="slate.900"
      >
        Crea tu casillero
      </Text>

      <Text css={fadeUp('120ms')} mt={2} fontSize="sm" color="slate.600">
        Regístrate para recibir tus compras en Miami y seguirlas en línea.
      </Text>

      <chakra.form
        noValidate
        css={{ ...fadeUp('180ms'), display: 'flex', flexDirection: 'column', gap: 5 }}
        mt={8}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={5}>
          <AuthField label="Nombre" error={errors.name?.message}>
            <Input
              autoComplete="given-name"
              placeholder="Jane"
              css={{ ...inputStyles, px: 3.5 }}
              {...register('name')}
            />
          </AuthField>

          <AuthField label="Apellido" error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              placeholder="Doe"
              css={{ ...inputStyles, px: 3.5 }}
              {...register('lastName')}
            />
          </AuthField>
        </Grid>

        <AuthField label="Correo electrónico" error={emailError}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            css={{ ...inputStyles, px: 3.5 }}
            {...register('email')}
          />
        </AuthField>

        <AuthField label="Teléfono" error={errors.phone?.message} hint="Ejemplo: +58 412 1234567">
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="+58 412 1234567"
            css={{ ...inputStyles, px: 3.5 }}
            {...register('phone')}
          />
        </AuthField>

        <AuthField label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
            {...register('password')}
          />
        </AuthField>

        <AuthField label="Confirmar contraseña" error={errors.confirmPassword?.message}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
            {...register('confirmPassword')}
          />
        </AuthField>

        {registration.isError && !emailTaken && (
          <Text role="alert" fontSize="sm" color="red.500">
            {getRegisterErrorMessage(registration.error)}
          </Text>
        )}

        <Button
          type="submit"
          loading={registration.isPending}
          loadingText="Creando cuenta"
          {...submitButtonProps}
        >
          Crear cuenta
        </Button>
      </chakra.form>

      <Text css={fadeUp('240ms')} mt={6} textAlign="center" fontSize="sm" color="slate.600">
        ¿Ya tienes cuenta?{' '}
        <ChakraLink asChild fontWeight="semibold" color="brand.700">
          <Link to="/">Inicia sesión</Link>
        </ChakraLink>
      </Text>
    </Box>
  );
}

export default RegisterForm;
