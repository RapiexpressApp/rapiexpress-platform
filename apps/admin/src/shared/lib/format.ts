const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}
