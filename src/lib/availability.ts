import { DAY_MS } from './date';
import type { ClothingItem } from '@/store/types';

export interface Availability {
  available: boolean;
  /** Dias restantes ate a peca voltar ao guarda-roupa. 0 quando disponivel. */
  daysLeft: number;
  /** Timestamp em que a peca volta a ficar disponivel. */
  readyAt: number | null;
}

/**
 * Uma peca fica indisponivel por `laundryDays` a partir do ultimo uso
 * confirmado, e volta sozinha assim que o periodo passa — nao existe acao
 * de "tirar da lavanderia", o tempo resolve.
 */
export function getAvailability(
  item: ClothingItem,
  laundryDays: number,
  now: number = Date.now(),
): Availability {
  if (item.lastWornAt == null) {
    return { available: true, daysLeft: 0, readyAt: null };
  }
  const readyAt = item.lastWornAt + laundryDays * DAY_MS;
  if (now >= readyAt) {
    return { available: true, daysLeft: 0, readyAt };
  }
  return {
    available: false,
    daysLeft: Math.max(1, Math.ceil((readyAt - now) / DAY_MS)),
    readyAt,
  };
}

export function isAvailable(
  item: ClothingItem,
  laundryDays: number,
  now: number = Date.now(),
): boolean {
  return getAvailability(item, laundryDays, now).available;
}
