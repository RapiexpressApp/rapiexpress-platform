import { Grid, Skeleton, Stack } from '@chakra-ui/react';

function HomeSkeleton() {
  return (
    <Grid
      role="status"
      aria-label="Cargando perfil"
      templateColumns={{ base: 'minmax(0, 1fr)', lg: '7fr 5fr' }}
      gap={{ base: 6, lg: 8 }}
    >
      <Stack gap={3} justify="center">
        <Skeleton h={10} w="60%" />
        <Skeleton h={5} w="80%" />
      </Stack>
      <Skeleton h={64} borderRadius="xl" />
    </Grid>
  );
}

export default HomeSkeleton;
