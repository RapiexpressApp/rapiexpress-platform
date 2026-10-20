import { Box, Flex, Heading } from '@chakra-ui/react';
import { type ReactNode, type Ref, useId } from 'react';

interface DetailSectionProps {
  title: string;
  action?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}

function DetailSection({ title, action, headingRef, children }: DetailSectionProps) {
  const titleId = useId();

  return (
    <Box as="section" aria-labelledby={titleId}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap" mb={2}>
        <Heading
          ref={headingRef}
          as="h2"
          id={titleId}
          size="md"
          color="slate.900"
          tabIndex={headingRef ? -1 : undefined}
          outline="none"
        >
          {title}
        </Heading>
        {action}
      </Flex>
      {children}
    </Box>
  );
}

export default DetailSection;
