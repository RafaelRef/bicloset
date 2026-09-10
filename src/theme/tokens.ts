/**
 * Design tokens extraidos do case "Closetly — AI-Powered Virtual Wardrobe App"
 * (Andrey Klimenkov, Behance) + da UI publicada na App Store.
 *
 * Linguagem visual: fundo cinza neutro claro, cards brancos com cantos muito
 * arredondados, CTAs em pilula grafite, chips com borda fina e estado
 * selecionado solido, barra de abas flutuante.
 */

export const colors = {
  /** Fundo das telas */
  bg: '#F1F1F1',
  /** Fundo levemente mais claro para blocos internos */
  bgSoft: '#F7F7F7',
  /** Cards, sheets, pills */
  surface: '#FFFFFF',
  /** Trilho de segmented control / preenchimento sutil */
  track: '#E8E8E8',

  /** Texto primario e preenchimento dos CTAs */
  ink: '#1C1C1C',
  /** Texto secundario */
  inkSoft: '#6B6B6B',
  /** Texto terciario, placeholders, icones inativos */
  inkFaint: '#A2A2A2',
  /** Texto sobre superficies escuras */
  onInk: '#FFFFFF',

  border: '#E4E4E4',
  borderStrong: '#D6D6D6',

  /** Botao desabilitado */
  disabled: '#9B9B9B',

  heart: '#FF2D2D',
  success: '#4C9A5A',
  danger: '#D0342C',

  /** Estado "na lavanderia" — puxa do tom pessego da marca */
  laundry: '#B0793C',
  laundryTint: '#F6E7D3',

  /** Realce de IA / sugestoes */
  ai: '#6B72C4',
  aiTint: '#ECEDF8',
} as const;

/** Paleta de cores atribuiveis a uma peca. */
export const garmentColors = {
  black: { label: 'Preto', hex: '#1C1C1C' },
  grey: { label: 'Cinza', hex: '#9A9A9A' },
  white: { label: 'Branco', hex: '#FFFFFF' },
  beige: { label: 'Bege', hex: '#D9C7A7' },
  brown: { label: 'Marrom', hex: '#7B5230' },
  green: { label: 'Verde', hex: '#3F7A4E' },
  blue: { label: 'Azul', hex: '#2F5FA8' },
  red: { label: 'Vermelho', hex: '#D0342C' },
  pink: { label: 'Rosa', hex: '#E58BA8' },
  yellow: { label: 'Amarelo', hex: '#E2B33C' },
  purple: { label: 'Roxo', hex: '#7A5AA8' },
} as const;

export type GarmentColorKey = keyof typeof garmentColors;
export const garmentColorKeys = Object.keys(garmentColors) as GarmentColorKey[];

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Sombra suave e difusa — nunca dura. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

/** Altura da barra de abas flutuante + folga, para padding de listas. */
export const TAB_BAR_HEIGHT = 64;
