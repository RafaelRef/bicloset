import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/id';
import { dateKey, keyToDate } from '@/lib/date';
import { deleteImage } from '@/lib/media';
import type { ClothingItem, Occasion, Outfit, PlanEntry, Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  ownerName: '',
  avatarUri: null,
  modelPhotoUri: null,
  laundryDays: 7,
  onboarded: false,
};

/**
 * `lastWornAt` e `wearCount` são cache derivado: a verdade são as entradas do
 * calendário confirmadas como usadas. Recalcular a partir delas deixa o
 * desfazer correto de graca e evita contadores dessincronizados.
 */
function recomputeWear(
  items: ClothingItem[],
  outfits: Outfit[],
  plans: PlanEntry[],
): { items: ClothingItem[]; outfits: Outfit[] } {
  const nextItems = new Map(
    items.map((i) => [i.id, { ...i, lastWornAt: null as number | null, wearCount: 0 }]),
  );
  const nextOutfits = new Map(
    outfits.map((o) => [o.id, { ...o, lastWornAt: null as number | null, wearCount: 0 }]),
  );

  for (const plan of plans) {
    if (!plan.worn) continue;
    const at = plan.confirmedAt ?? keyToDate(plan.date).getTime();
    const outfit = nextOutfits.get(plan.outfitId);
    if (!outfit) continue;

    outfit.wearCount += 1;
    outfit.lastWornAt = Math.max(outfit.lastWornAt ?? 0, at);

    for (const itemId of outfit.itemIds) {
      const item = nextItems.get(itemId);
      if (!item) continue;
      item.wearCount += 1;
      item.lastWornAt = Math.max(item.lastWornAt ?? 0, at);
    }
  }

  return { items: [...nextItems.values()], outfits: [...nextOutfits.values()] };
}

type NewItem = Omit<
  ClothingItem,
  'id' | 'createdAt' | 'lastWornAt' | 'wearCount' | 'favorite'
> &
  Partial<Pick<ClothingItem, 'favorite'>>;

type NewOutfit = Omit<
  Outfit,
  'id' | 'createdAt' | 'lastWornAt' | 'wearCount' | 'favorite'
> &
  Partial<Pick<Outfit, 'favorite'>>;

export interface AppState {
  items: ClothingItem[];
  outfits: Outfit[];
  plans: PlanEntry[];
  settings: Settings;
  hydrated: boolean;

  addItem(input: NewItem): ClothingItem;
  updateItem(id: string, patch: Partial<ClothingItem>): void;
  removeItem(id: string): void;
  toggleItemFavorite(id: string): void;

  addOutfit(input: NewOutfit): Outfit;
  removeOutfit(id: string): void;
  toggleOutfitFavorite(id: string): void;

  planOutfit(input: {
    date: string;
    outfitId: string;
    eventLabel?: string | null;
  }): PlanEntry;
  removePlan(id: string): void;
  /** Gatilho do período de lavagem. */
  setPlanWorn(id: string, worn: boolean): void;
  /** Atalho de usei esse look hoje, fora do calendário. */
  wearOutfitToday(outfitId: string): void;

  updateSettings(patch: Partial<Settings>): void;
  replaceAll(data: {
    items: ClothingItem[];
    outfits: Outfit[];
    plans: PlanEntry[];
  }): void;
  clearWardrobe(): void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      outfits: [],
      plans: [],
      settings: DEFAULT_SETTINGS,
      hydrated: false,

      addItem(input) {
        const item: ClothingItem = {
          favorite: false,
          ...input,
          id: createId('item'),
          createdAt: Date.now(),
          lastWornAt: null,
          wearCount: 0,
        };
        set((s) => ({ items: [item, ...s.items] }));
        return item;
      },

      updateItem(id, patch) {
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch, id: i.id } : i)),
        }));
      },

      removeItem(id) {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          void deleteImage(item.imageUri);
          if (item.originalUri !== item.imageUri) void deleteImage(item.originalUri);
        }
        set((s) => {
          // Looks que ficariam vazios sem a peça saem junto, com seus planos.
          const outfits = s.outfits
            .map((o) => ({ ...o, itemIds: o.itemIds.filter((i) => i !== id) }))
            .filter((o) => o.itemIds.length > 0);
          const validOutfitIds = new Set(outfits.map((o) => o.id));
          const plans = s.plans.filter((p) => validOutfitIds.has(p.outfitId));
          const items = s.items.filter((i) => i.id !== id);
          return { ...recomputeWear(items, outfits, plans), plans };
        });
      },

      toggleItemFavorite(id) {
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
        }));
      },

      addOutfit(input) {
        const outfit: Outfit = {
          favorite: false,
          ...input,
          id: createId('fit'),
          createdAt: Date.now(),
          lastWornAt: null,
          wearCount: 0,
        };
        set((s) => ({ outfits: [outfit, ...s.outfits] }));
        return outfit;
      },

      removeOutfit(id) {
        set((s) => {
          const outfits = s.outfits.filter((o) => o.id !== id);
          const plans = s.plans.filter((p) => p.outfitId !== id);
          return { ...recomputeWear(s.items, outfits, plans), plans };
        });
      },

      toggleOutfitFavorite(id) {
        set((s) => ({
          outfits: s.outfits.map((o) =>
            o.id === id ? { ...o, favorite: !o.favorite } : o,
          ),
        }));
      },

      planOutfit({ date, outfitId, eventLabel = null }) {
        const entry: PlanEntry = {
          id: createId('plan'),
          date,
          outfitId,
          eventLabel,
          worn: false,
          confirmedAt: null,
        };
        set((s) => ({ plans: [...s.plans, entry] }));
        return entry;
      },

      removePlan(id) {
        set((s) => {
          const plans = s.plans.filter((p) => p.id !== id);
          return { ...recomputeWear(s.items, s.outfits, plans), plans };
        });
      },

      setPlanWorn(id, worn) {
        set((s) => {
          const plans = s.plans.map((p) => {
            if (p.id !== id) return p;
            if (!worn) return { ...p, worn: false, confirmedAt: null };
            // Confirmar um look planejado para o futuro começa a contagem
            // agora, nunca numa data que ainda não chegou.
            const planned = keyToDate(p.date);
            planned.setHours(12, 0, 0, 0);
            const at = Math.min(planned.getTime(), Date.now());
            return { ...p, worn: true, confirmedAt: at };
          });
          return { ...recomputeWear(s.items, s.outfits, plans), plans };
        });
      },

      wearOutfitToday(outfitId) {
        set((s) => {
          const entry: PlanEntry = {
            id: createId('plan'),
            date: dateKey(new Date()),
            outfitId,
            eventLabel: null,
            worn: true,
            confirmedAt: Date.now(),
          };
          const plans = [...s.plans, entry];
          return { ...recomputeWear(s.items, s.outfits, plans), plans };
        });
      },

      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      replaceAll({ items, outfits, plans }) {
        set({ ...recomputeWear(items, outfits, plans), plans });
      },

      clearWardrobe() {
        for (const item of get().items) {
          void deleteImage(item.imageUri);
        }
        set({ items: [], outfits: [], plans: [] });
      },
    }),
    {
      name: 'bicloset-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        items: s.items,
        outfits: s.outfits,
        plans: s.plans,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        useAppStore.setState({ hydrated: true });
        if (state) {
          // Recalcula na abertura: o período de lavagem depende do relogio.
          const { items, outfits } = recomputeWear(state.items, state.outfits, state.plans);
          useAppStore.setState({ items, outfits });
        }
      },
    },
  ),
);

/** Ocasião padrão sugerida ao salvar um look novo. */
export function defaultOccasion(): Occasion {
  return [0, 6].includes(new Date().getDay()) ? 'casual' : 'work';
}
