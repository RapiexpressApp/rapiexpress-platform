export type StatState =
  { status: 'pending' } | { status: 'error' } | { status: 'ready'; value: number };

export interface HomeStats {
  inTransit: StatState;
  atAgency: StatState;
  preAlerts: StatState;
}

export function combineStats(a: StatState, b: StatState): StatState {
  if (a.status === 'error' || b.status === 'error') return { status: 'error' };
  if (a.status === 'pending' || b.status === 'pending') return { status: 'pending' };
  return { status: 'ready', value: a.value + b.value };
}

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm;
}

export function describeActivity(inTransit: StatState, atAgency: StatState): string {
  if (inTransit.status !== 'ready' || atAgency.status !== 'ready') {
    return 'Aquí tienes el resumen de tus paquetes.';
  }

  const parts: string[] = [];

  if (inTransit.value > 0) {
    parts.push(`${inTransit.value} ${plural(inTransit.value, 'paquete', 'paquetes')} en camino`);
  }

  if (atAgency.value > 0) {
    parts.push(
      parts.length > 0
        ? `${atAgency.value} en tu agencia`
        : `${atAgency.value} ${plural(atAgency.value, 'paquete', 'paquetes')} en tu agencia`
    );
  }

  if (parts.length === 0) return 'Por ahora no tienes paquetes en camino ni en tu agencia.';

  return `Tienes ${parts.join(' y ')}.`;
}
