import type { ClothingItem } from '@/store/types';

type DemoItem = Omit<
  ClothingItem,
  'id' | 'createdAt' | 'lastWornAt' | 'wearCount' | 'favorite'
>;

const base = {
  imageUri: null,
  originalUri: null,
  bgRemoved: false,
} as const;

/**
 * Closet de exemplo para conhecer o app sem fotografar nada.
 * Sem imagens: cada peça cai na silhueta vetorial, entao continua offline.
 */
export function buildDemoCloset(): DemoItem[] {
  return [
    // Tops
    { ...base, name: 'Camiseta branca', category: 'tops', colorKey: 'white', occasions: ['casual', 'home'], seasons: ['summer', 'spring'] },
    { ...base, name: 'Camiseta preta', category: 'tops', colorKey: 'black', occasions: ['casual'], seasons: ['summer', 'autumn', 'spring'] },
    { ...base, name: 'Blusa de seda', category: 'tops', colorKey: 'beige', occasions: ['work', 'party'], seasons: ['spring', 'autumn'] },
    { ...base, name: 'Regata verde', category: 'tops', colorKey: 'green', occasions: ['casual', 'sport'], seasons: ['summer'] },
    { ...base, name: 'Camisa listrada', category: 'tops', colorKey: 'blue', occasions: ['work', 'casual'], seasons: ['spring', 'autumn'] },
    { ...base, name: 'Cropped rosa', category: 'tops', colorKey: 'pink', occasions: ['party', 'casual'], seasons: ['summer'] },

    // Bottoms
    { ...base, name: 'Jeans reto', category: 'bottoms', colorKey: 'blue', occasions: ['casual', 'work'], seasons: ['autumn', 'winter', 'spring'] },
    { ...base, name: 'Calça alfaiataria', category: 'bottoms', colorKey: 'black', occasions: ['work', 'party'], seasons: ['autumn', 'winter'] },
    { ...base, name: 'Saia plissada', category: 'bottoms', colorKey: 'beige', occasions: ['work', 'casual'], seasons: ['spring', 'summer'] },
    { ...base, name: 'Short de linho', category: 'bottoms', colorKey: 'white', occasions: ['casual', 'home'], seasons: ['summer'] },
    { ...base, name: 'Legging', category: 'bottoms', colorKey: 'black', occasions: ['sport', 'home'], seasons: ['autumn', 'winter', 'spring', 'summer'] },

    // Vestidos
    { ...base, name: 'Vestido midi', category: 'dresses', colorKey: 'green', occasions: ['party', 'work'], seasons: ['spring', 'summer'] },
    { ...base, name: 'Vestido preto', category: 'dresses', colorKey: 'black', occasions: ['party'], seasons: ['autumn', 'winter'] },

    // Casacos
    { ...base, name: 'Blazer bege', category: 'outerwear', colorKey: 'beige', occasions: ['work'], seasons: ['autumn', 'spring'] },
    { ...base, name: 'Jaqueta jeans', category: 'outerwear', colorKey: 'blue', occasions: ['casual'], seasons: ['autumn', 'spring'] },
    { ...base, name: 'Trench coat', category: 'outerwear', colorKey: 'brown', occasions: ['work', 'casual'], seasons: ['winter'] },

    // Sapatos
    { ...base, name: 'Tênis branco', category: 'shoes', colorKey: 'white', occasions: ['casual', 'sport'], seasons: ['spring', 'summer', 'autumn'] },
    { ...base, name: 'Scarpin preto', category: 'shoes', colorKey: 'black', occasions: ['work', 'party'], seasons: ['autumn', 'winter', 'spring'] },
    { ...base, name: 'Sandália', category: 'shoes', colorKey: 'beige', occasions: ['casual', 'party'], seasons: ['summer'] },
    { ...base, name: 'Bota de couro', category: 'shoes', colorKey: 'brown', occasions: ['casual', 'work'], seasons: ['winter', 'autumn'] },

    // Acessórios
    { ...base, name: 'Bolsa estruturada', category: 'accessories', colorKey: 'black', occasions: ['work', 'party'], seasons: [] },
    { ...base, name: 'Bolsa de palha', category: 'accessories', colorKey: 'beige', occasions: ['casual'], seasons: ['summer'] },
    { ...base, name: 'Cinto marrom', category: 'accessories', colorKey: 'brown', occasions: ['work', 'casual'], seasons: [] },
  ];
}
