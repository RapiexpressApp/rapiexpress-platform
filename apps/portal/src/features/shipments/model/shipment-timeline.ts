export type StepState = 'done' | 'current' | 'pending';

export interface TimelineStepView {
  label: string;
  state: StepState;
  date?: string;
}
