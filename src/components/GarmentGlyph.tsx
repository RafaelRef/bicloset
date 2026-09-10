import Svg, { Path, G } from 'react-native-svg';

import { garmentColors, type GarmentColorKey } from '@/theme/tokens';
import type { Category } from '@/store/types';

/**
 * Silhueta vetorial da peca. Serve para dois casos:
 * 1. peca sem foto (closet de exemplo, ou foto perdida);
 * 2. camadas da prova virtual, sobrepostas na foto de referencia.
 *
 * Mantem o app 100% offline: nenhuma imagem remota, nenhum asset binario.
 */

const PATHS: Record<Category, string[]> = {
  tops: [
    'M30 22 L43 15 Q50 24 57 15 L70 22 L80 35 L69 45 L66 41 L66 85 L34 85 L34 41 L31 45 L20 35 Z',
  ],
  bottoms: [
    'M32 15 H68 L70 50 L66 89 H53 L50 53 L47 89 H34 L30 50 Z',
  ],
  dresses: [
    'M37 18 L44 13 Q50 20 56 13 L63 18 L59 35 L75 88 H25 L41 35 Z',
  ],
  outerwear: [
    'M30 20 L43 13 L50 25 L57 13 L70 20 L79 36 L69 43 L68 88 H32 L31 43 L21 36 Z',
    'M50 25 L50 88',
  ],
  shoes: [
    'M20 58 H33 L43 68 Q60 73 74 73 L80 79 V87 H20 Z',
  ],
  accessories: [
    'M31 41 H69 L73 88 H27 Z',
    'M40 41 V33 A10 10 0 0 1 60 33 V41',
  ],
};

interface Props {
  category: Category;
  colorKey: GarmentColorKey;
  size?: number;
  /** Suaviza a peca quando ela esta indisponivel. */
  dimmed?: boolean;
}

export function GarmentGlyph({ category, colorKey, size = 96, dimmed }: Props) {
  const fill = garmentColors[colorKey].hex;
  const [body, ...details] = PATHS[category];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={dimmed ? 0.4 : 1}>
      <G>
        <Path
          d={body}
          fill={fill}
          stroke="rgba(0,0,0,0.16)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {details.map((d) => (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke="rgba(0,0,0,0.16)"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        ))}
      </G>
    </Svg>
  );
}
