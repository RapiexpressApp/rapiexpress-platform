import { Alert, CloseButton } from '@chakra-ui/react';

interface ReceptionNoticeProps {
  message: string;
  onDismiss: () => void;
}

function ReceptionNotice({ message, onDismiss }: ReceptionNoticeProps) {
  return (
    <Alert.Root role="alert" status="warning" variant="subtle" borderRadius="lg">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
      <CloseButton aria-label="Cerrar aviso" boxSize={11} onClick={onDismiss} />
    </Alert.Root>
  );
}

export default ReceptionNotice;
