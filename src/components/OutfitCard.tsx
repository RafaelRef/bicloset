import { Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TryOnCanvas } from './TryOnCanvas';
import { useAppStore } from '@/store/useAppStore';
import { OCCASIONS, type ClothingItem, type Outfit } from '@/store/types';
import { colors, radius, shadow, space } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props {
  outfit: Outfit;
  items: ClothingItem[];
  onPress?: () => void;
  width?: number;
  height?: number;
}

export function OutfitCard({ outfit, items, onPress, width, height = 190 }: Props) {
  const toggleFavorite = useAppStore((s) => s.toggleOutfitFavorite);
  const occasionLabel = OCCASIONS.find((o) => o.key === outfit.occasion)?.label;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={outfit.name}
      style={({ pressed }) => [
        styles.card,
        width != null && { width },
        pressed && styles.pressed,
      ]}
    >
      <TryOnCanvas
        personUri={outfit.personUri}
        items={items}
        height={height}
        compact
        style={styles.canvas}
      />

      <Pressable
        onPress={() => toggleFavorite(outfit.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          outfit.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
        }
        style={styles.heart}
      >
        <Heart
          size={17}
          color={outfit.favorite ? colors.heart : colors.inkFaint}
          fill={outfit.favorite ? colors.heart : 'transparent'}
        />
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>
          {outfit.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[occasionLabel, `${items.length} peças`]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow.card,
  },
  canvas: {
    borderRadius: radius.md,
  },
  heart: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: space.xs,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  pressed: {
    opacity: 0.9,
  },
});
