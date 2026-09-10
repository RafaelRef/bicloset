import { Image } from 'expo-image';
import { Check, Heart, WashingMachine } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GarmentGlyph } from './GarmentGlyph';
import { getAvailability } from '@/lib/availability';
import { useAppStore } from '@/store/useAppStore';
import type { ClothingItem } from '@/store/types';
import { colors, radius, shadow, space } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  /** Modo selecao (montagem de look): mostra check em vez de coracao. */
  selectable?: boolean;
  selected?: boolean;
  width?: number;
}

export function ItemCard({
  item,
  onPress,
  onToggleFavorite,
  selectable,
  selected,
  width,
}: Props) {
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const availability = getAvailability(item, laundryDays);
  const unavailable = !availability.available;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected: !!selected, disabled: false }}
      style={({ pressed }) => [
        styles.card,
        width != null && { width },
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.media}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={[styles.image, unavailable && styles.dimmed]}
            contentFit="contain"
            transition={180}
          />
        ) : (
          <GarmentGlyph
            category={item.category}
            colorKey={item.colorKey}
            size={78}
            dimmed={unavailable}
          />
        )}
      </View>

      {selectable ? (
        selected ? (
          <View style={styles.checkOn}>
            <Check size={14} color={colors.onInk} strokeWidth={3} />
          </View>
        ) : (
          <View style={styles.checkOff} />
        )
      ) : (
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
          }
          style={styles.heart}
        >
          <Heart
            size={17}
            color={item.favorite ? colors.heart : colors.inkFaint}
            fill={item.favorite ? colors.heart : 'transparent'}
          />
        </Pressable>
      )}

      {unavailable ? (
        <View style={styles.laundry}>
          <WashingMachine size={12} color={colors.laundry} />
          <Text style={styles.laundryText}>{availability.daysLeft}d</Text>
        </View>
      ) : null}

      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    ...shadow.card,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.ink,
    padding: space.md - 2,
  },
  media: {
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dimmed: {
    opacity: 0.4,
  },
  heart: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
  },
  checkOn: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  laundry: {
    position: 'absolute',
    left: space.sm,
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.laundryTint,
  },
  laundryText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.laundry,
  },
  pressed: {
    opacity: 0.85,
  },
  name: {
    marginTop: space.sm,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.ink,
  },
});
