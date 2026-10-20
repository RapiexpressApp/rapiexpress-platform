import { Grid, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface DataRowProps {
  label: string;
  children: ReactNode;
}

function DataRow({ label, children }: DataRowProps) {
  return (
    <Grid
      templateColumns={{ base: 'minmax(0, 1fr)', sm: '11rem minmax(0, 1fr)' }}
      columnGap={4}
      rowGap={0.5}
      py={2.5}
      borderTopWidth="1px"
      borderColor="slate.200"
    >
      <Text as="dt" fontSize="sm" color="slate.600">
        {label}
      </Text>
      <Text as="dd" color="slate.900" fontVariantNumeric="tabular-nums" overflowWrap="anywhere">
        {children}
      </Text>
    </Grid>
  );
}

export default DataRow;
