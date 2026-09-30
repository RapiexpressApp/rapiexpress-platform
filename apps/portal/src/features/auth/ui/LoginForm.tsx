import {
  Box,
  Button,
  chakra,
  Field,
  Flex,
  Image,
  Input,
  type SystemStyleObject,
  Text,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod/src/zod.js';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { loginSchema, type LoginSchemaType } from '@/features/auth/validation/login.validation';
import logo from '@/shared/assets/logo.webp';
import { fadeUp } from '@/shared/ui/motion';
import { PasswordInput } from '@/shared/ui/password-input';

const inputStyles: SystemStyleObject = {
  height: 11,
  width: 'full',
  fontSize: 'md',
  color: 'slate.900',
  borderColor: 'slate.300',
  bg: 'white',
  touchAction: 'manipulation',
  _placeholder: { color: 'slate.500' },
  _focusVisible: {
    borderColor: 'brand.500',
    boxShadow: '0 0 0 2px {colors.brand.500/25}',
  },
};

function LoginForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit'
  });
  // TODO: wire auth once packages/contracts and the API exist
  function onSubmit() {
    navigate('/dashboard', { replace: true });
  }

  return (
    <Box w="full" maxW="380px">
      <Flex
        css={fadeUp('0ms')}
        display={{ base: 'flex', lg: 'none' }}
        align="center"
        gap={2.5}
        mb={10}
      >
        <Image src={logo} alt="" boxSize={9} fit="contain" />
        <Text fontSize="lg" fontWeight="bold" letterSpacing="tight" color="brand.950">
          Rapiexpress
        </Text>
      </Flex>

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
          {
            errors.email && <Field.ErrorText color="red.500">{errors.email?.message}</Field.ErrorText>
          }
        </Field.Root>

        <Field.Root invalid={!!errors.password}>
          <Field.Label color="slate.700">Contraseña</Field.Label>
          <PasswordInput
            placeholder="Tu contraseña"
            css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
            {...register('password')}
          />
          {
            errors.password && <Field.ErrorText color="red.500">{errors.password?.message}</Field.ErrorText>
          }
        </Field.Root>

        <Button
          type="submit"
          colorPalette="brand"
          width="full"
          height={11}
          fontSize="md"
          fontWeight="semibold"
          borderRadius="lg"
          touchAction="manipulation"
          transition="background-color 150ms ease, transform 150ms ease"
          _hover={{ bg: 'brand.700', translateY: '-2px' }}
          _active={{ transform: 'scale(0.98)' }}
          _focusVisible={{
            outline: 'none',
            boxShadow: '0 0 0 2px white, 0 0 0 4px {colors.brand.600}',
          }}
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
