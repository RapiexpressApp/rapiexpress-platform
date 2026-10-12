import { Button, chakra, Flex, Input, NativeSelect, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthField from '@rapiexpress/ui/auth-field';
import { inputStyles, submitButtonProps } from '@rapiexpress/ui/auth-form-styles';
import { PasswordInput } from '@rapiexpress/ui/password-input';
import { useForm } from 'react-hook-form';

import { useCreateUser } from '@/features/users/model/use-create-user';
import {
  CREATE_USER_FAILED_MESSAGE,
  EMAIL_TAKEN_MESSAGE,
  isEmailTakenError,
} from '@/features/users/model/user-errors';
import {
  type CreateUserFormInput,
  createUserFormSchema,
  type CreateUserFormValues,
} from '@/features/users/validation/create-user.validation';
import { ROLE_LABELS, STAFF_ROLES } from '@/shared/model/roles';

interface CreateUserFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function CreateUserForm({ onCreated, onCancel }: CreateUserFormProps) {
  const createUser = useCreateUser();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormInput, unknown, CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: '' as CreateUserFormInput['role'],
    },
    mode: 'onSubmit',
  });

  function onSubmit({ confirmPassword: _confirmPassword, ...payload }: CreateUserFormValues) {
    if (createUser.isPending) return;
    createUser.mutate(payload, { onSuccess: onCreated });
  }

  const emailTaken = createUser.isError && isEmailTakenError(createUser.error);
  const emailError = errors.email?.message ?? (emailTaken ? EMAIL_TAKEN_MESSAGE : undefined);
  const genericError = createUser.isError && !emailTaken;

  return (
    <chakra.form
      noValidate
      display="flex"
      flexDirection="column"
      gap={4}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <AuthField label="Nombre" error={errors.name?.message}>
          <Input autoComplete="off" css={{ ...inputStyles, px: 3.5 }} {...register('name')} />
        </AuthField>
        <AuthField label="Apellido" error={errors.lastName?.message}>
          <Input autoComplete="off" css={{ ...inputStyles, px: 3.5 }} {...register('lastName')} />
        </AuthField>
      </Flex>

      <AuthField label="Correo electrónico" error={emailError}>
        <Input
          type="email"
          autoComplete="off"
          css={{ ...inputStyles, px: 3.5 }}
          {...register('email')}
        />
      </AuthField>

      <AuthField label="Teléfono" error={errors.phone?.message} hint="Ejemplo: +58 412 1234567">
        <Input
          type="tel"
          autoComplete="off"
          css={{ ...inputStyles, px: 3.5 }}
          {...register('phone')}
        />
      </AuthField>

      <AuthField label="Rol" error={errors.role?.message}>
        <NativeSelect.Root>
          <NativeSelect.Field css={{ ...inputStyles, px: 3.5 }} {...register('role')}>
            <option value="">Selecciona un rol</option>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </AuthField>

      <AuthField label="Contraseña" error={errors.password?.message}>
        <PasswordInput
          autoComplete="new-password"
          css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
          {...register('password')}
        />
      </AuthField>

      <AuthField label="Confirmar contraseña" error={errors.confirmPassword?.message}>
        <PasswordInput
          autoComplete="new-password"
          css={{ ...inputStyles, paddingStart: 3.5, paddingEnd: 12 }}
          {...register('confirmPassword')}
        />
      </AuthField>

      {genericError && (
        <Text role="alert" fontSize="sm" color="red.500">
          {CREATE_USER_FAILED_MESSAGE}
        </Text>
      )}

      <Flex justify="flex-end" gap={3} mt={2}>
        <Button variant="outline" onClick={onCancel} disabled={createUser.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={createUser.isPending}
          loadingText="Creando"
          {...submitButtonProps}
          width="auto"
          px={6}
        >
          Crear usuario
        </Button>
      </Flex>
    </chakra.form>
  );
}

export default CreateUserForm;
