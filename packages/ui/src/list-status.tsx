import { Button, Flex, Skeleton, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface ListStatusProps {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string;
  emptyMessage: string;
  onRetry: () => void;
  children: ReactNode;
}

const SKELETON_ROWS = 6;

function ListStatus({
  isPending,
  isError,
  isEmpty,
  errorMessage,
  emptyMessage,
  onRetry,
  children,
}: ListStatusProps) {
  if (isPending) {
    return (
      <Stack role="status" aria-label="Cargando listado" gap={3}>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} h={10} borderRadius="md" />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Flex role="alert" direction="column" align="center" gap={3} py={12}>
        <Text color="slate.700">{errorMessage}</Text>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </Flex>
    );
  }

  if (isEmpty) {
    return (
      <Flex justify="center" py={12}>
        <Text color="slate.600">{emptyMessage}</Text>
      </Flex>
    );
  }

  return children;
}

export default ListStatus;
