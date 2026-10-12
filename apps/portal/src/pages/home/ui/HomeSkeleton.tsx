import { Grid, Skeleton, Stack } from '@chakra-ui/react';

function HomeSkeleton() {
  return (
    <Stack role="status" aria-label="Cargando perfil" gap={{ base: 6, lg: 8 }}>
      <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '7fr 5fr' }} gap={{ base: 6, lg: 8 }}>
        <Stack gap={3} justify="center">
          <Skeleton h={10} w="60%" />
          <Skeleton h={5} w="80%" />
        </Stack>
        <Skeleton h={64} borderRadius="xl" />
      </Grid>
      <Skeleton h={28} borderRadius="xl" />
    </Stack>
  );
}

export default HomeSkeleton;
