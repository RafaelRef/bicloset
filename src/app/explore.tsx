import { router } from 'expo-router';
import { ChevronLeft, RefreshCw, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TryOnCanvas } from '@/components/TryOnCanvas';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconCircle, ScreenHeader } from '@/components/ui/ScreenHeader';
import { suggestOutfits } from '@/services/stylist';
import { useAppStore } from '@/store/useAppStore';
import { OCCASIONS, type Occasion } from '@/store/types';
import { colors, radius, shadow, space } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

const GUTTER = space.md;
const H_PADDING = space.xl;
const COLUMN_WIDTH = (Dimensions.get('window').width - H_PADDING * 2 - GUTTER) / 2;

export default function ExploreScreen() {
  const items = useAppStore((s) => s.items);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const modelPhotoUri = useAppStore((s) => s.settings.modelPhotoUri);
  const addOutfit = useAppStore((s) => s.addOutfit);

  const [occasion, setOccasion] = useState<Occasion | 'all'>('all');
  // Muda a semente para reembaralhar sem tocar no closet.
  const [refreshKey, setRefreshKey] = useState(0);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const suggestions = useMemo(() => {
    const all = suggestOutfits(items, laundryDays, {
      occasion: occasion === 'all' ? undefined : occasion,
      limit: 24,
    });
    if (refreshKey === 0) return all;
    // Rotaciona a lista: mesma qualidade, ordem diferente.
    const offset = (refreshKey * 3) % Math.max(all.length, 1);
    return [...all.slice(offset), ...all.slice(0, offset)];
  }, [items, laundryDays, occasion, refreshKey]);

  const saveSuggestion = (itemIds: string[], label: string, occ: Occasion) => {
    const outfit = addOutfit({
      name: `Look ${label.toLowerCase()}`,
      itemIds,
      personUri: modelPhotoUri,
      occasion: occ,
      source: 'ai',
    });
    router.push(`/outfit/${outfit.id}` as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Explorar"
        left={
          <IconCircle
            icon={<ChevronLeft size={18} color={colors.ink} />}
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
          />
        }
        right={
          <IconCircle
            icon={<RefreshCw size={16} color={colors.ink} />}
            accessibilityLabel="Gerar outras sugestoes"
            onPress={() => setRefreshKey((k) => k + 1)}
          />
        }
      />

      <FlatList
        data={suggestions}
        keyExtractor={(suggestion) => suggestion.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typeStyles.bodyMuted}>
              Combinacoes montadas com as pecas disponiveis no seu closet.
            </Text>
            <ChipRow paddingHorizontal={0}>
              <Chip
                label="Todas"
                selected={occasion === 'all'}
                onPress={() => setOccasion('all')}
              />
              {OCCASIONS.map((entry) => (
                <Chip
                  key={entry.key}
                  label={entry.label}
                  selected={occasion === entry.key}
                  onPress={() => setOccasion(entry.key)}
                />
              ))}
            </ChipRow>
          </View>
        }
        renderItem={({ item: suggestion, index }) => {
          const suggestionItems = suggestion.itemIds
            .map((id) => itemsById.get(id))
            .filter((i) => i != null);
          return (
            <Animated.View entering={FadeIn.delay(Math.min(index, 8) * 40).duration(280)}>
              <Pressable
                style={[styles.card, { width: COLUMN_WIDTH }]}
                onPress={() =>
                  saveSuggestion(suggestion.itemIds, suggestion.label, suggestion.occasion)
                }
                accessibilityRole="button"
                accessibilityLabel={`Salvar look ${suggestion.label}`}
              >
                <TryOnCanvas
                  personUri={modelPhotoUri}
                  items={suggestionItems}
                  height={200}
                  compact
                  style={styles.canvas}
                />
                <View style={styles.badge}>
                  <Sparkles size={11} color={colors.ai} />
                  <Text style={styles.badgeText}>{suggestion.label}</Text>
                </View>
                <Text style={styles.itemNames} numberOfLines={2}>
                  {suggestionItems.map((i) => i.name).join(' · ')}
                </Text>
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<Sparkles size={32} color={colors.inkFaint} strokeWidth={1.5} />}
            title={items.length === 0 ? 'Closet vazio' : 'Sem combinacoes agora'}
            description={
              items.length === 0
                ? 'Cadastre pecas para o bicloset comecar a sugerir looks.'
                : 'Faltam pecas disponiveis para montar um look completo. Espere sair da lavanderia ou cadastre mais itens.'
            }
            actionLabel="Adicionar peca"
            onAction={() => router.push('/add-item' as never)}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: {
    paddingHorizontal: H_PADDING,
    paddingBottom: space.xxxl,
    gap: GUTTER,
  },
  column: {
    gap: GUTTER,
  },
  header: {
    gap: space.md,
    paddingBottom: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow.card,
  },
  canvas: {
    borderRadius: radius.md,
  },
  badge: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.aiTint,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.ai,
  },
  itemNames: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    paddingHorizontal: space.xs,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
});
