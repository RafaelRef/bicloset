import { isAvailable } from '@/lib/availability';
import { garmentColors, type GarmentColorKey } from '@/theme/tokens';
import type { ClothingItem, Occasion, Season } from '@/store/types';

/**
 * Motor de sugestão de looks.
 *
 * Roda 100% no dispositivo: pontua combinações por ocasião, estáção, harmonia
 * de cor e "frescor" (peças menos usadas primeiro). Não e um modelo de IA e
 * não precisa de rede — é o que alimenta as telas de Explorar e o look do dia
 * enquanto a prova virtual continua mockada.
 */

export interface Suggestion {
  /** Determinstico para as mesmas peças, serve como key de lista. */
  id: string;
  itemIds: string[];
  occasion: Occasion;
  label: string;
  score: number;
}

const NEUTRALS: GarmentColorKey[] = ['black', 'grey', 'white', 'beige', 'brown'];

/** Hemisfério sul: dezembro é verão. */
export function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m === 11 || m <= 1) return 'summer';
  if (m <= 4) return 'autumn';
  if (m <= 7) return 'winter';
  return 'spring';
}

const OCCASION_LABELS: Record<Occasion, string> = {
  casual: 'Casual',
  work: 'Trabalho',
  sport: 'Esporte',
  party: 'Festa',
  home: 'Em casa',
};

function occasionScore(item: ClothingItem, occasion: Occasion): number {
  if (item.occasions.length === 0) return 0;
  return item.occasions.includes(occasion) ? 3 : -2.5;
}

function seasonScore(item: ClothingItem, season: Season): number {
  if (item.seasons.length === 0) return 0;
  return item.seasons.includes(season) ? 1 : -0.75;
}

/** Peça pouco usada vale mais — evita sugerir sempre a mesma combinação. */
function freshnessScore(item: ClothingItem): number {
  return 2 - Math.min(item.wearCount, 4) / 2;
}

function harmonyScore(items: ClothingItem[]): number {
  const colors = items.map((i) => i.colorKey);
  const strong = colors.filter((c) => !NEUTRALS.includes(c));
  const unique = new Set(strong);
  if (strong.length === 0) return 1.5; // look todo neutro sempre funciona
  if (unique.size === 1) return 2; // um ponto de cor sobre neutros
  if (unique.size === 2) return 0.5;
  return -1.5; // tres ou mais cores fortes brigando
}

function byCategory(items: ClothingItem[]) {
  const pick = (c: ClothingItem['category']) =>
    items.filter((i) => i.category === c);
  return {
    tops: pick('tops'),
    bottoms: pick('bottoms'),
    dresses: pick('dresses'),
    outerwear: pick('outerwear'),
    shoes: pick('shoes'),
    accessories: pick('accessories'),
  };
}

function scoreCombo(
  items: ClothingItem[],
  occasion: Occasion,
  season: Season,
): number {
  let score = harmonyScore(items);
  for (const item of items) {
    score += occasionScore(item, occasion);
    score += seasonScore(item, season);
    score += freshnessScore(item);
  }
  // Normaliza pelo tamanho para não premiar looks só por terem mais peças.
  return score / items.length;
}

export interface SuggestOptions {
  occasion?: Occasion;
  limit?: number;
  season?: Season;
  /** Ignora o período de lavagem (usado ao montar look manualmente). */
  includeUnavailable?: boolean;
}

export function suggestOutfits(
  allItems: ClothingItem[],
  laundryDays: number,
  options: SuggestOptions = {},
): Suggestion[] {
  const {
    occasion,
    limit = 12,
    season = currentSeason(),
    includeUnavailable = false,
  } = options;

  const now = Date.now();
  const pool = includeUnavailable
    ? allItems
    : allItems.filter((i) => isAvailable(i, laundryDays, now));

  const occasions: Occasion[] = occasion
    ? [occasion]
    : ['casual', 'work', 'party', 'sport', 'home'];

  const results: Suggestion[] = [];

  for (const occ of occasions) {
    // Limita cada categoria para manter a combinatória previsível.
    const relevant = pool
      .filter((i) => i.occasions.length === 0 || i.occasions.includes(occ))
      .sort((a, b) => freshnessScore(b) - freshnessScore(a));
    const g = byCategory(relevant.slice(0, 60));

    const bases: ClothingItem[][] = [];
    for (const top of g.tops.slice(0, 6)) {
      for (const bottom of g.bottoms.slice(0, 6)) bases.push([top, bottom]);
    }
    for (const dress of g.dresses.slice(0, 6)) bases.push([dress]);

    for (const base of bases) {
      const combo = [...base];
      if (g.shoes.length > 0) {
        // Sapato que melhor combina com a base já escolhida.
        const shoe = [...g.shoes]
          .sort(
            (a, b) =>
              scoreCombo([...base, b], occ, season) -
              scoreCombo([...base, a], occ, season),
          )[0];
        if (shoe) combo.push(shoe);
      }
      if (season === 'winter' && g.outerwear.length > 0) {
        combo.push(g.outerwear[0]);
      }

      const itemIds = combo.map((i) => i.id).sort();
      results.push({
        id: `${occ}:${itemIds.join('-')}`,
        itemIds: combo.map((i) => i.id),
        occasion: occ,
        label: OCCASION_LABELS[occ],
        score: scoreCombo(combo, occ, season),
      });
    }
  }

  // Dedupe por conjunto de peças, mantendo o melhor score.
  const best = new Map<string, Suggestion>();
  for (const s of results) {
    const key = [...s.itemIds].sort().join('-');
    const existing = best.get(key);
    if (!existing || s.score > existing.score) best.set(key, s);
  }

  const ranked = [...best.values()].sort((a, b) => b.score - a.score);

  // Espalha o resultado: no máximo 2 sugestões reutilizando a mesma peça-chave.
  const usage = new Map<string, number>();
  const spread: Suggestion[] = [];
  for (const s of ranked) {
    const key = s.itemIds[0];
    const used = usage.get(key) ?? 0;
    if (used >= 2) continue;
    usage.set(key, used + 1);
    spread.push(s);
    if (spread.length >= limit) break;
  }
  return spread;
}

/** Look do dia: a melhor sugestão para a ocasião mais provavel. */
export function suggestOutfitOfTheDay(
  items: ClothingItem[],
  laundryDays: number,
): Suggestion | null {
  const isWeekend = [0, 6].includes(new Date().getDay());
  const occasion: Occasion = isWeekend ? 'casual' : 'work';
  const primary = suggestOutfits(items, laundryDays, { occasion, limit: 1 });
  if (primary.length > 0) return primary[0];
  const fallback = suggestOutfits(items, laundryDays, { limit: 1 });
  return fallback[0] ?? null;
}
