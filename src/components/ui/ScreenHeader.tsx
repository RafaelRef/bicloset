import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

/** Pilula branca com ícone + rótulo, como "Search" / "+ Upload" no case. */
export function PillButton({
  label,
  icon,
  onPress,
  tone = 'default',
}: {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        dark ? styles.pillDark : styles.pillLight,
        pressed && styles.pressed,
      ]}
    >
      {icon}
      <Text
        style={[styles.pillLabel, { color: dark ? colors.onInk : colors.ink }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Botao circular branco de 36pt (voltar, fechar, mais). */
export function IconCircle({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
    >
      {icon}
    </Pressable>
  );
}

interface HeaderProps {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Marca serifada no lugar do título (usada na Home). */
  wordmark?: boolean;
}

export function ScreenHeader({ title, left, right, wordmark }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>{left}</View>
      <Text
        style={wordmark ? typeStyles.wordmark : typeStyles.title}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: space.sm,
  },
  side: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    height: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  pillLight: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillDark: {
    backgroundColor: colors.ink,
  },
  pillLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
});
