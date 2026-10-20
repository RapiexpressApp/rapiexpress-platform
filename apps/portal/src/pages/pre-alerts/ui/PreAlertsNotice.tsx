import { Alert, CloseButton } from '@chakra-ui/react';

interface PreAlertsNoticeProps {
  status: 'success' | 'warning';
  message: string;
  onDismiss: () => void;
}

function PreAlertsNotice({ status, message, onDismiss }: PreAlertsNoticeProps) {
  return (
    <Alert.Root role="status" status={status} variant="subtle" borderRadius="lg">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
      <CloseButton aria-label="Cerrar aviso" boxSize={11} onClick={onDismiss} />
    </Alert.Root>
  );
}

export default PreAlertsNotice;
