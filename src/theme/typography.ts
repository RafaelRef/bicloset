import { StyleSheet } from 'react-native';
import { colors } from './tokens';

/**
 * Inter para toda a interface (como no case do Behance) e Playfair Display
 * apenas para a marca — um aceno ao wordmark serifado do app publicado.
 */
export const fonts = {
  display: 'PlayfairDisplay_700Bold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  bodyMuted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  /** Rotulo de secao: pequeno, cinza, como "Type" / "Colour" no case. */
  section: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkFaint,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkSoft,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.1,
  },
});
