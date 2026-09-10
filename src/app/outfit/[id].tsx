import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Heart,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { TryOnCanvas } from '@/components/TryOnCanvas';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconCircle, ScreenHeader } from '@/components/ui/ScreenHeader';
import { friendlyDate } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { OCCASIONS } from '@/store/types';
import { colors, radius, shadow, space } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

export default function OutfitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const items = useAppStore((s) => s.items);
  const outfits = useAppStore((s) => s.outfits);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const toggleFavorite = useAppStore((s) => s.toggleOutfitFavorite);
  const removeOutfit = useAppStore((s) => s.removeOutfit);
  const wearOutfitToday = useAppStore((s) => s.wearOutfitToday);

  const outfit = useMemo(() => outfits.find((o) => o.id === id), [outfits, id]);

  const outfitItems = useMemo(() => {
    if (!outfit) return [];
    const byId = new Map(items.map((i) => [i.id, i]));
    return outfit.itemIds.map((itemId) => byId.get(itemId)).filter((i) => i != null);
  }, [outfit, items]);

  if (!outfit) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Look"
          left={
            <IconCircle
              icon={<ChevronLeft size={18} color={colors.ink} />}
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
            />
          }
        />
        <EmptyState
          icon={<Trash2 size={30} color={colors.inkFaint} strokeWidth={1.5} />}
          title="Look não encontrado"
          description="Ele pode ter sido removido junto com uma das peças."
          actionLabel="Voltar ao closet"
          onAction={() => router.replace('/closet' as never)}
        />
      </SafeAreaView>
    );
  }

  const occasionLabel = OCCASIONS.find((o) => o.key === outfit.occasion)?.label;

  const share = async () => {
    await Share.share({
      message: `${outfit.name} — ${outfitItems.map((i) => i.name).join(', ')} (bicloset)`,
    });
  };

  const confirmDelete = () => {
    Alert.alert('Remover look', `"${outfit.name}" sai dos seus looks e da agenda.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removeOutfit(outfit.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Look"
        left={
          <IconCircle
            icon={<ChevronLeft size={18} color={colors.ink} />}
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
          />
        }
        right={
          <View style={styles.headerRight}>
            <IconCircle
              icon={
                <Heart
                  size={16}
                  color={outfit.favorite ? colors.heart : colors.ink}
                  fill={outfit.favorite ? colors.heart : 'transparent'}
                />
              }
              accessibilityLabel="Favoritar"
              onPress={() => toggleFavorite(outfit.id)}
            />
            <IconCircle
              icon={<Share2 size={16} color={colors.ink} />}
              accessibilityLabel="Compartilhar"
              onPress={share}
            />
            <IconCircle
              icon={<Trash2 size={16} color={colors.danger} />}
              accessibilityLabel="Remover look"
              onPress={confirmDelete}
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <TryOnCanvas
            personUri={outfit.personUri}
            items={outfitItems}
            height={400}
          />
        </Animated.View>

        <View style={styles.info}>
          <Text style={typeStyles.title}>{outfit.name}</Text>
          <Text style={typeStyles.bodyMuted}>
            {[
              occasionLabel,
              `${outfitItems.length} peças`,
              outfit.wearCount > 0 ? `usado ${outfit.wearCount}x` : 'nunca usado',
              outfit.lastWornAt
                ? `última vez ${friendlyDate(new Date(outfit.lastWornAt)).toLowerCase()}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Usei hoje"
            icon={<Check size={16} color={colors.onInk} />}
            onPress={() => wearOutfitToday(outfit.id)}
            style={styles.action}
          />
          <Button
            label="Agendar"
            variant="secondary"
            icon={<CalendarDays size={16} color={colors.ink} />}
            onPress={() => router.push('/plan' as never)}
            style={styles.action}
          />
        </View>

        <View style={styles.laundryNote}>
          <Text style={typeStyles.caption}>
            Ao marcar como usado, as {outfitItems.length} peças ficam indisponíveis por{' '}
            {laundryDays} dias.
          </Text>
        </View>

        <View>
          <Text style={[typeStyles.headline, styles.sectionTitle]}>Peças do look</Text>
          <View style={styles.grid}>
            {outfitItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                width={112}
                onPress={() => router.push(`/add-item?id=${item.id}` as never)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRight: {
    flexDirection: 'row',
    gap: space.sm,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.xl,
  },
  info: {
    gap: space.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  action: {
    flex: 1,
    paddingHorizontal: space.md,
  },
  laundryNote: {
    backgroundColor: colors.laundryTint,
    borderRadius: radius.md,
    padding: space.md,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
});
