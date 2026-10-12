import { Grid, Stack, Text } from '@chakra-ui/react';
import { useEffect } from 'react';

import { getFirstName, getFullName } from '@/features/auth/model/profile-display';
import { useMe } from '@/features/auth/model/use-me';

import { resolveFeaturedShipment } from '../model/featured';
import { buildLocker } from '../model/locker';
import { FEATURED_SHIPMENT, PRE_ALERTS, SHIPMENTS } from '../model/mock-data';
import { computeStats, describeActivity } from '../model/stats';
import FeaturedShipment from './FeaturedShipment';
import GreetingHeader from './GreetingHeader';
import HomeSkeleton from './HomeSkeleton';
import LockerCard from './LockerCard';
import RecentShipments from './RecentShipments';
import StatCards from './StatCards';

const STATS = computeStats(SHIPMENTS, PRE_ALERTS);
const FEATURED = resolveFeaturedShipment(SHIPMENTS, FEATURED_SHIPMENT);

function HomePage() {
  const { data: profile, isError } = useMe();

  useEffect(() => {
    document.title = 'Panel principal · Rapiexpress';
  }, []);

  if (isError) {
    return (
      <Text role="alert" color="red.500">
        No pudimos cargar tu perfil. Recarga la página para intentarlo de nuevo.
      </Text>
    );
  }

  if (!profile) return <HomeSkeleton />;

  const locker = buildLocker({ recipient: getFullName(profile), suite: profile.lockerCode ?? '' });

  return (
    <Stack gap={{ base: 6, lg: 8 }}>
      <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '7fr 5fr' }} gap={{ base: 6, lg: 8 }}>
        <GreetingHeader firstName={getFirstName(profile)} summary={describeActivity(STATS)} />
        <LockerCard locker={locker} />
      </Grid>
      <StatCards stats={STATS} />
      {FEATURED && <FeaturedShipment featured={FEATURED} />}
      <RecentShipments shipments={SHIPMENTS} />
    </Stack>
  );
}

export default HomePage;
