import { Box, Stack, Text } from '@chakra-ui/react';
import type { PackageIncident, PackageStaffDetail } from '@rapiexpress/api-client/packages.schemas';
import type { ReactNode, Ref } from 'react';

import { formatDateTime } from '@/shared/lib/format';
import { INCIDENT_TYPE_LABEL } from '@/shared/model/package-labels';

import DetailSection from './DetailSection';

interface PackageIncidentsSectionProps {
  openIncident: PackageStaffDetail['openIncident'];
  incidents: PackageIncident[];
  headingRef?: Ref<HTMLHeadingElement>;
  action?: ReactNode;
  resolveAction?: ReactNode;
}

function staffName({ name, lastName }: PackageIncident['openedBy']): string {
  return `${name} ${lastName}`;
}

function OpenIncident({
  incident,
  resolveAction,
}: {
  incident: PackageIncident;
  resolveAction?: ReactNode;
}) {
  return (
    <Box
      role="group"
      aria-label="Incidencia abierta"
      borderStartWidth="3px"
      borderColor="orange.500"
      ps={4}
      py={1}
    >
      <Text fontWeight="semibold" color="slate.900">
        {INCIDENT_TYPE_LABEL[incident.type]}
      </Text>
      <Text color="slate.800" overflowWrap="anywhere">
        {incident.reason}
      </Text>
      <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
        {`Abierta por ${staffName(incident.openedBy)} · ${formatDateTime(incident.openedAt)}`}
      </Text>
      {resolveAction}
    </Box>
  );
}

function ResolvedIncident({ incident }: { incident: PackageIncident }) {
  return (
    <Box as="li" py={3} borderTopWidth="1px" borderColor="slate.200" _first={{ borderTopWidth: 0 }}>
      <Text fontWeight="medium" color="slate.900">
        {INCIDENT_TYPE_LABEL[incident.type]}
      </Text>
      <Text color="slate.800" overflowWrap="anywhere">
        {incident.reason}
      </Text>
      <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
        {`Abierta por ${staffName(incident.openedBy)} · ${formatDateTime(incident.openedAt)}`}
      </Text>
      <Text fontSize="sm" color="slate.600" fontVariantNumeric="tabular-nums">
        {incident.resolvedBy && incident.resolvedAt
          ? `Resuelta por ${staffName(incident.resolvedBy)} · ${formatDateTime(incident.resolvedAt)}`
          : 'Resuelta'}
      </Text>
      <Text fontSize="sm" color="slate.700" overflowWrap="anywhere">
        {incident.resolutionNote ?? 'Sin nota de resolución'}
      </Text>
    </Box>
  );
}

function PackageIncidentsSection({
  openIncident,
  incidents,
  headingRef,
  action,
  resolveAction,
}: PackageIncidentsSectionProps) {
  const resolved = incidents.filter((incident) => incident.resolvedAt !== null);

  return (
    <DetailSection title="Incidencias" headingRef={headingRef} action={action}>
      <Stack gap={4}>
        {openIncident ? (
          <OpenIncident incident={openIncident} resolveAction={resolveAction} />
        ) : (
          <Text color="slate.700">
            {resolved.length === 0
              ? 'Sin incidencias registradas'
              : 'No hay ninguna incidencia abierta.'}
          </Text>
        )}
        {resolved.length > 0 && (
          <Stack gap={1}>
            <Text as="h3" fontSize="sm" fontWeight="semibold" color="slate.700">
              Incidencias resueltas
            </Text>
            <Stack as="ul" aria-label="Incidencias resueltas" gap={0} listStyleType="none">
              {resolved.map((incident) => (
                <ResolvedIncident key={incident.id} incident={incident} />
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </DetailSection>
  );
}

export default PackageIncidentsSection;
