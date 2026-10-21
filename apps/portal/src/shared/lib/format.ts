const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });
const usdFormatter = new Intl.NumberFormat('es', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const weightFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

export function formatUsd(value: number): string {
  return `USD ${usdFormatter.format(value)}`;
}

export function formatWeightLb(value: number): string {
  return `${weightFormatter.format(value)} lb`;
}

export function formatWeightKg(value: number): string {
  return `${weightFormatter.format(value)} kg`;
}
