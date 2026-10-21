import { Alert, Button, CloseButton } from '@chakra-ui/react';

import type { PackageNoticeContent } from '../model/package-notice';

interface PackageNoticeProps {
  notice: PackageNoticeContent;
  onDismiss: () => void;
  onShowIncidents: () => void;
}

function PackageNotice({ notice, onDismiss, onShowIncidents }: PackageNoticeProps) {
  return (
    <Alert.Root role="alert" status="warning" variant="subtle" borderRadius="lg">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{notice.message}</Alert.Title>
        {notice.showIncidents && (
          <Button
            variant="outline"
            size="sm"
            alignSelf="flex-start"
            mt={2}
            onClick={onShowIncidents}
          >
            Ver incidencias
          </Button>
        )}
      </Alert.Content>
      <CloseButton aria-label="Cerrar aviso" boxSize={11} onClick={onDismiss} />
    </Alert.Root>
  );
}

export default PackageNotice;
