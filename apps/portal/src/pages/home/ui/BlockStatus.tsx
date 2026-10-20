import { Button, Flex, Skeleton, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface BlockStatusProps {
  isPending: boolean;
  isError: boolean;
  isEmpty: boolean;
  loadingLabel: string;
  errorMessage: string;
  empty: ReactNode;
  onRetry: () => void;
  children: ReactNode;
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <Flex
      direction="column"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="slate.200"
      bg="white"
      overflow="hidden"
    >
      {children}
    </Flex>
  );
}

function BlockStatus({
  isPending,
  isError,
  isEmpty,
  loadingLabel,
  errorMessage,
  empty,
  onRetry,
  children,
}: BlockStatusProps) {
  if (isPending) {
    return (
      <Panel>
        <Stack role="status" aria-label={loadingLabel} gap={3} p={5}>
          <Skeleton h={5} w="45%" />
          <Skeleton h={4} w="70%" />
          <Skeleton h={4} w="60%" />
        </Stack>
      </Panel>
    );
  }

  if (isError) {
    return (
      <Panel>
        <Flex role="alert" direction="column" align="center" gap={3} px={6} py={10}>
          <Text color="slate.700">{errorMessage}</Text>
          <Button variant="outline" height={11} px={5} onClick={onRetry}>
            Reintentar
          </Button>
        </Flex>
      </Panel>
    );
  }

  if (isEmpty) return <Panel>{empty}</Panel>;

  return children;
}

export default BlockStatus;
