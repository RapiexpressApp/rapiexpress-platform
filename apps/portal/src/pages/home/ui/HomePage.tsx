import { Stack } from '@chakra-ui/react';
import { useEffect } from 'react';

import { resolveFeaturedShipment } from '../model/featured';
import { FEATURED_SHIPMENT, PRE_ALERTS, SHIPMENTS } from '../model/mock-data';
import { computeStats, describeActivity } from '../model/stats';
import FeaturedShipment from './FeaturedShipment';
import PendingPreAlerts from './PendingPreAlerts';
import ProfileSection from './ProfileSection';
import RecentShipments from './RecentShipments';
import StatCards from './StatCards';

const STATS = computeStats(SHIPMENTS, PRE_ALERTS);
const FEATURED = resolveFeaturedShipment(SHIPMENTS, FEATURED_SHIPMENT);

function HomePage() {
  useEffect(() => {
    document.title = 'Panel principal · Rapiexpress';
  }, []);

  return (
    <Stack gap={{ base: 6, lg: 8 }}>
      <ProfileSection summary={describeActivity(STATS)} />
      <StatCards stats={STATS} />
      {FEATURED && <FeaturedShipment featured={FEATURED} />}
      <RecentShipments />
      <PendingPreAlerts />
    </Stack>
  );
}

export default HomePage;
