import type { UserProfile } from '@/shared/api/auth.schemas';

type NamedProfile = Pick<UserProfile, 'name' | 'lastName'>;

export function getFirstName({ name }: NamedProfile): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

export function getFullName({ name, lastName }: NamedProfile): string {
  return `${name} ${lastName}`.trim();
}

export function getInitials({ name, lastName }: NamedProfile): string {
  return [name, lastName].map((part) => part.trim().charAt(0).toUpperCase()).join('');
}
