import { Button, Flex, Text } from '@chakra-ui/react';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  itemCount: number;
  buttonSize?: 'sm' | 'lg';
  onPageChange: (page: number) => void;
}

function ListPagination({
  page,
  pageSize,
  total,
  itemCount,
  buttonSize = 'sm',
  onPageChange,
}: ListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + itemCount;

  return (
    <Flex align="center" justify="space-between" gap={4} wrap="wrap">
      <Text fontSize="sm" color="slate.600">
        {`Mostrando ${from}–${to} de ${total}`}
      </Text>
      <Flex align="center" gap={3}>
        <Button
          size={buttonSize}
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Text fontSize="sm" color="slate.700">
          {`Página ${page} de ${totalPages}`}
        </Text>
        <Button
          size={buttonSize}
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </Flex>
    </Flex>
  );
}

export default ListPagination;
