import { Badge } from '@chakra-ui/react';
import { TriangleAlert } from 'lucide-react';

function OpenIncidentFlag() {
  return (
    <Badge colorPalette="orange" variant="subtle" size="md" gap={1.5} whiteSpace="nowrap">
      <TriangleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
      Incidencia abierta
    </Badge>
  );
}

export default OpenIncidentFlag;
