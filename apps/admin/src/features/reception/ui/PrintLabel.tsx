import { Box, Text } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import type { PackageLabel } from '@rapiexpress/api-client/packages.schemas';
import { createPortal } from 'react-dom';

interface PrintLabelProps {
  label: PackageLabel;
}

const printStyles = {
  '@page': { margin: '8mm' },
  '@media print': {
    'body > *:not([data-print-label])': { display: 'none !important' },
  },
};

function PrintLabel({ label }: PrintLabelProps) {
  return createPortal(
    <>
      <Global styles={printStyles} />
      <Box
        data-print-label=""
        role="group"
        aria-label="Etiqueta de bodega"
        display="none"
        _print={{ display: 'flex' }}
        flexDirection="column"
        alignItems="center"
        gap="6mm"
        textAlign="center"
        color="black"
        bg="white"
      >
        <Text fontFamily="mono" fontWeight="bold" fontSize="72px" lineHeight="1">
          {label.warehouseNumber}
        </Text>
        <Text fontWeight="semibold" fontSize="32px" lineHeight="1.2">
          {label.customerName ?? 'Sin asignar'}
        </Text>
        {label.lockerCode && (
          <Text fontFamily="mono" fontWeight="semibold" fontSize="32px" lineHeight="1.2">
            {label.lockerCode}
          </Text>
        )}
        {/* TODO(TBD-02): render the barcode once the label format and printer are decided. */}
      </Box>
    </>,
    document.body
  );
}

export default PrintLabel;
