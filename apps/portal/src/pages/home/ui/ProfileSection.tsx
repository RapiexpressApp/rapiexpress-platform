import { Button, Flex, Grid, Text } from '@chakra-ui/react';

import { getFirstName, getFullName } from '@/features/auth/model/profile-display';
import { useMe } from '@/features/auth/model/use-me';

import { buildLocker } from '../model/locker';
import GreetingHeader from './GreetingHeader';
import HomeSkeleton from './HomeSkeleton';
import LockerCard from './LockerCard';

interface ProfileSectionProps {
  summary: string;
}

function ProfileSection({ summary }: ProfileSectionProps) {
  const profile = useMe();

  if (profile.data) {
    const locker = buildLocker({
      recipient: getFullName(profile.data),
      suite: profile.data.lockerCode ?? '',
    });

    return (
      <Grid templateColumns={{ base: 'minmax(0, 1fr)', lg: '7fr 5fr' }} gap={{ base: 6, lg: 8 }}>
        <GreetingHeader firstName={getFirstName(profile.data)} summary={summary} />
        <LockerCard locker={locker} />
      </Grid>
    );
  }

  if (profile.isError) {
    return (
      <Flex role="alert" direction="column" align="flex-start" gap={3}>
        <Text color="red.600">No pudimos cargar tu perfil.</Text>
        <Button variant="outline" height={11} px={5} onClick={() => void profile.refetch()}>
          Reintentar
        </Button>
      </Flex>
    );
  }

  return <HomeSkeleton />;
}

export default ProfileSection;
