import type { ClothingItem } from '@/store/types';

/**
 * Prova virtual (virtual try-on).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MOCKADO. Não existe modelo de difusao aqui: devolvemos uma "receita" de
 * composição que o componente <TryOnCanvas> renderiza sobrepondo as peças na
 * foto de referência, por zona do corpo. O resultado e claramente marcado
 * como Preview.
 *
 * TODO: integrar com Replicate (ex.: `cuuupid/idm-vton`) — precisa de API key
 * do usuário. Trocar apenas o corpo de `generateTryOn`; a assinatura
 * (foto da pessoa + peças -> imagem combinada) já é a final.
 *
 * Exemplo (Replicate):
 *   const res = await fetch('https://api.replicate.com/v1/predictions', {
 *     method: 'POST',
 *     headers: {
 *       Authorization: `Bearer ${process.env.EXPO_PUBLIC_REPLICATE_TOKEN}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({ version: '<model-version>', input: { human_img, garm_img } }),
 *   });
 *   // -> { compositeUri: prediction.output, mocked: false }
 * ─────────────────────────────────────────────────────────────────────────
 */

export type BodyZone = 'head' | 'torso' | 'legs' | 'feet' | 'side';

export interface TryOnLayer {
  itemId: string;
  zone: BodyZone;
  /** Ordem de empilhamento: casaco cobre o top. */
  z: number;
}

export interface TryOnResult {
  /** Imagem final combinada. null enquanto o serviço estiver mockado. */
  compositeUri: string | null;
  /** Camadas para o fallback de composição local. */
  layers: TryOnLayer[];
  mocked: boolean;
}

/** Mapeamento síncrono peça -> zona do corpo, compartilhado com o canvas. */
export function layersForItems(items: ClothingItem[]): TryOnLayer[] {
  return items.map(zoneFor).sort((a, b) => a.z - b.z);
}

function zoneFor(item: ClothingItem): TryOnLayer {
  switch (item.category) {
    case 'tops':
      return { itemId: item.id, zone: 'torso', z: 1 };
    case 'dresses':
      return { itemId: item.id, zone: 'torso', z: 1 };
    case 'outerwear':
      return { itemId: item.id, zone: 'torso', z: 2 };
    case 'bottoms':
      return { itemId: item.id, zone: 'legs', z: 1 };
    case 'shoes':
      return { itemId: item.id, zone: 'feet', z: 1 };
    case 'accessories':
    default:
      return { itemId: item.id, zone: 'side', z: 3 };
  }
}

export async function generateTryOn(input: {
  personUri: string | null;
  items: ClothingItem[];
}): Promise<TryOnResult> {
  // Latência artificial: a tela de prova mostra o estado "gerando".
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return {
    compositeUri: null,
    layers: layersForItems(input.items),
    mocked: true,
  };
}
