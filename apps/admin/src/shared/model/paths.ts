export const PACKAGES_PATH = '/paquetes';

export function packagePath(id: string): string {
  return `${PACKAGES_PATH}/${id}`;
}
