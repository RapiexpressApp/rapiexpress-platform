import type { HomeStats, PreAlert, Shipment } from './types';

export function computeStats(shipments: Shipment[], preAlerts: PreAlert[]): HomeStats {
  return {
    inTransit: shipments.filter((s) => s.status === 'in_transit' || s.status === 'customs').length,
    readyForPickup: shipments.filter((s) => s.status === 'ready').length,
    preAlerts: preAlerts.length,
  };
}

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm;
}

export function describeActivity({ inTransit, readyForPickup }: HomeStats) {
  const parts: string[] = [];

  if (inTransit > 0) {
    parts.push(`${inTransit} ${plural(inTransit, 'paquete', 'paquetes')} en camino`);
  }

  if (readyForPickup > 0) {
    const ready =
      parts.length > 0
        ? plural(readyForPickup, 'listo', 'listos')
        : plural(readyForPickup, 'paquete listo', 'paquetes listos');
    parts.push(`${readyForPickup} ${ready} para retirar`);
  }

  if (parts.length === 0) {
    return 'Por ahora no tienes paquetes en camino ni listos para retirar.';
  }

  return `Tienes ${parts.join(' y ')}.`;
}
