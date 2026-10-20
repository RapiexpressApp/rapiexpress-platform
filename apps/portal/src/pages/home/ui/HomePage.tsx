import { Stack } from '@chakra-ui/react';
import { useEffect } from 'react';

import { describeActivity } from '../model/stats';
import { useHomeStats } from '../model/use-home-stats';
import FeaturedShipment from './FeaturedShipment';
import PendingPreAlerts from './PendingPreAlerts';
import ProfileSection from './ProfileSection';
import RecentShipments from './RecentShipments';
import StatCards from './StatCards';

function HomePage() {
  const { stats, retry } = useHomeStats();

  useEffect(() => {
    document.title = 'Panel principal · Rapiexpress';
  }, []);

  return (
    <Stack gap={{ base: 6, lg: 8 }}>
      <ProfileSection summary={describeActivity(stats.inTransit, stats.atAgency)} />
      <StatCards stats={stats} onRetry={retry} />
      <FeaturedShipment />
      <RecentShipments />
      <PendingPreAlerts />
    </Stack>
  );
}

export default HomePage;
