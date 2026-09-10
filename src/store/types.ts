import type { GarmentColorKey } from '@/theme/tokens';

export type Category =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories';

export type Occasion = 'casual' | 'work' | 'sport' | 'party' | 'home';
export type Season = 'summer' | 'autumn' | 'winter' | 'spring';

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Baixo' },
  { key: 'dresses', label: 'Vestidos' },
  { key: 'outerwear', label: 'Casacos' },
  { key: 'shoes', label: 'Sapatos' },
  { key: 'accessories', label: 'Acessórios' },
];

export const OCCASIONS: { key: Occasion; label: string }[] = [
  { key: 'casual', label: 'Casual' },
  { key: 'work', label: 'Trabalho' },
  { key: 'sport', label: 'Esporte' },
  { key: 'party', label: 'Festa' },
  { key: 'home', label: 'Em casa' },
];

export const SEASONS: { key: Season; label: string }[] = [
  { key: 'summer', label: 'Verão' },
  { key: 'autumn', label: 'Outono' },
  { key: 'winter', label: 'Inverno' },
  { key: 'spring', label: 'Primavera' },
];

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  colorKey: GarmentColorKey;
  occasions: Occasion[];
  seasons: Season[];
  /** URI local da foto já processada. null => renderiza a silhueta vetorial. */
  imageUri: string | null;
  /** Foto original, antes da remoção de fundo. */
  originalUri: string | null;
  /** true quando passou pelo serviço de remoção de fundo (hoje mockado). */
  bgRemoved: boolean;
  favorite: boolean;
  createdAt: number;
  /** Timestamp do ultimo uso confirmado — base do calculo de lavanderia. */
  lastWornAt: number | null;
  wearCount: number;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  /** Foto de referência da pessoa usada na prova virtual, se houver. */
  personUri: string | null;
  occasion: Occasion | null;
  favorite: boolean;
  createdAt: number;
  lastWornAt: number | null;
  wearCount: number;
  source: 'tryon' | 'ai' | 'manual';
}

export interface PlanEntry {
  id: string;
  /** Chave YYYY-MM-DD. */
  date: string;
  outfitId: string;
  eventLabel: string | null;
  /** Quando true, as peças do look entraram no período de lavagem. */
  worn: boolean;
  confirmedAt: number | null;
}

export interface Settings {
  ownerName: string;
  avatarUri: string | null;
  /** Foto de corpo inteiro usada como base da prova virtual. */
  modelPhotoUri: string | null;
  /** Dias que uma peça fica indisponível depois de usada. */
  laundryDays: number;
  onboarded: boolean;
}
