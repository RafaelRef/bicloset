import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  compact?: boolean;
}

/** Chip do case: borda fina quando inativo, grafite solido quando ativo. */
export function Chip({ label, selected, onPress, leading, compact }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        selected ? styles.chipOn : styles.chipOff,
        pressed && styles.pressed,
      ]}
    >
      {leading}
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: selected ? colors.onInk : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Linha de chips com rolagem horizontal e sangria ate a borda da tela. */
export function ChipRow({
  children,
  paddingHorizontal = space.xl,
}: {
  children: ReactNode;
  paddingHorizontal?: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal }]}
    >
      {children}
    </ScrollView>
  );
}

/** Bolinha de cor usada nos filtros e no formulario da peca. */
export function ColorDot({ hex, size = 14 }: { hex: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: hex,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.22)',
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space.sm,
    paddingVertical: space.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    height: 34,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
  compact: {
    height: 30,
    paddingHorizontal: space.md,
  },
  chipOff: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
  labelCompact: {
    fontSize: 12.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
