import {
  type TimelineStep,
  VISIBLE_PACKAGE_STATUSES,
  type VisiblePackageStatus,
} from '@rapiexpress/api-client/tracking.schemas';

import { formatDate } from '@/shared/lib/format';

import { PACKAGE_STATUS_LABEL } from './shipment-labels';

export type StepState = 'done' | 'current' | 'pending';

export interface TimelineStepView {
  label: string;
  state: StepState;
  date?: string;
}

export function buildShipmentTimeline(
  status: VisiblePackageStatus,
  timeline: TimelineStep[]
): TimelineStepView[] {
  const currentIndex = VISIBLE_PACKAGE_STATUSES.indexOf(status);
  const isDelivered = status === 'DELIVERED';

  return VISIBLE_PACKAGE_STATUSES.map((step, index) => {
    const state: StepState =
      index < currentIndex || isDelivered ? 'done' : index === currentIndex ? 'current' : 'pending';
    const reachedAt = state === 'pending' ? undefined : timeline.find((s) => s.status === step);
    const date = reachedAt ? formatDate(reachedAt.reachedAt) : '';

    return { label: PACKAGE_STATUS_LABEL[step], state, ...(date ? { date } : {}) };
  });
}
