import { Image } from 'expo-image';
import { PersonStanding } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GarmentGlyph } from './GarmentGlyph';
import { layersForItems, type BodyZone } from '@/services/tryOn';
import type { ClothingItem } from '@/store/types';
import { colors, radius, space } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/**
 * Composicao local da prova virtual.
 *
 * Enquanto `services/tryOn` estiver mockado, e este componente que produz o
 * "resultado": sobrepoe cada peca na zona do corpo correspondente sobre a foto
 * de referencia. Quando a integracao real entrar, `compositeUri` chega
 * preenchido e substitui as camadas por uma imagem unica.
 */

/** Retangulos em fracao do canvas — ajustados para uma foto de corpo inteiro. */
const ZONE_RECTS: Record<BodyZone, { top: number; height: number; width: number }> = {
  head: { top: 0.04, height: 0.14, width: 0.26 },
  torso: { top: 0.2, height: 0.32, width: 0.54 },
  legs: { top: 0.48, height: 0.34, width: 0.42 },
  feet: { top: 0.8, height: 0.14, width: 0.34 },
  side: { top: 0.3, height: 0.16, width: 0.18 },
};

interface Props {
  personUri: string | null;
  items: ClothingItem[];
  compositeUri?: string | null;
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** Esconde o selo Preview em miniaturas. */
  compact?: boolean;
}

export function TryOnCanvas({
  personUri,
  items,
  compositeUri = null,
  height = 420,
  style,
  compact,
}: Props) {
  const layers = layersForItems(items);
  const byId = new Map(items.map((i) => [i.id, i]));

  if (compositeUri) {
    return (
      <View style={[styles.canvas, { height }, style]}>
        <Image source={{ uri: compositeUri }} style={styles.fill} contentFit="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.canvas, { height }, style]}>
      {personUri ? (
        <Image source={{ uri: personUri }} style={styles.fill} contentFit="cover" />
      ) : (
        <View style={[styles.fill, styles.placeholder]}>
          <PersonStanding size={compact ? 40 : 92} color={colors.borderStrong} />
        </View>
      )}

      {layers.map((layer) => {
        const item = byId.get(layer.itemId);
        if (!item) return null;
        const rect = ZONE_RECTS[layer.zone];
        const boxHeight = height * rect.height;
        const isSide = layer.zone === 'side';

        return (
          <View
            key={item.id}
            pointerEvents="none"
            style={[
              styles.layer,
              {
                top: height * rect.top,
                height: boxHeight,
                width: `${rect.width * 100}%`,
                zIndex: layer.z,
              },
              isSide
                ? styles.layerSide
                : { left: `${((1 - rect.width) / 2) * 100}%` },
            ]}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.fill}
                contentFit="contain"
              />
            ) : (
              <GarmentGlyph
                category={item.category}
                colorKey={item.colorKey}
                size={boxHeight}
              />
            )}
          </View>
        );
      })}

      {!compact ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Preview</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgSoft,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerSide: {
    right: '5%',
  },
  badge: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28,28,28,0.75)',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.onInk,
    letterSpacing: 0.3,
  },
});
