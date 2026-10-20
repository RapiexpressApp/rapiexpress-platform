import { Box, Flex, Heading } from '@chakra-ui/react';
import { type ReactNode, useId } from 'react';

interface DetailSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

function DetailSection({ title, action, children }: DetailSectionProps) {
  const titleId = useId();

  return (
    <Box as="section" aria-labelledby={titleId}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap" mb={2}>
        <Heading as="h2" id={titleId} size="md" color="slate.900">
          {title}
        </Heading>
        {action}
      </Flex>
      {children}
    </Box>
  );
}

export default DetailSection;
