import { Grid, Stack } from '@chakra-ui/react';
import { useEffect } from 'react';

import { CUSTOMER_FIRST_NAME, LOCKER, PRE_ALERTS, SHIPMENTS } from '../model/mock-data';
import { computeStats, describeActivity } from '../model/stats';
import GreetingHeader from './GreetingHeader';
import LockerCard from './LockerCard';
import StatCards from './StatCards';

const STATS = computeStats(SHIPMENTS, PRE_ALERTS);

function HomePage() {
  useEffect(() => {
    document.title = 'Panel principal · Rapiexpress';
  }, []);

  return (
    <Stack gap={{ base: 6, lg: 8 }}>
      <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '7fr 5fr' }} gap={{ base: 6, lg: 8 }}>
        <GreetingHeader firstName={CUSTOMER_FIRST_NAME} summary={describeActivity(STATS)} />
        <LockerCard locker={LOCKER} />
      </Grid>
      <StatCards stats={STATS} />
    </Stack>
  );
}

export default HomePage;
