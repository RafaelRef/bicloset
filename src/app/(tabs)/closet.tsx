import { router } from 'expo-router';
import { Plus, Search, Shirt, SlidersHorizontal, Sparkles, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { OutfitCard } from '@/components/OutfitCard';
import { Button } from '@/components/ui/Button';
import { Chip, ChipRow, ColorDot } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PillButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { isAvailable } from '@/lib/availability';
import { useAppStore } from '@/store/useAppStore';
import {
  CATEGORIES,
  OCCASIONS,
  SEASONS,
  type Category,
  type Occasion,
  type Season,
} from '@/store/types';
import {
  colors,
  garmentColorKeys,
  garmentColors,
  radius,
  space,
  TAB_BAR_HEIGHT,
  type GarmentColorKey,
} from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

const GUTTER = space.md;
const H_PADDING = space.xl;
const COLUMN_WIDTH =
  (Dimensions.get('window').width - H_PADDING * 2 - GUTTER) / 2;

type Tab = 'items' | 'outfits';
type QuickFilter = 'all' | 'favorites' | 'available' | Category;

export default function ClosetScreen() {
  const items = useAppStore((s) => s.items);
  const outfits = useAppStore((s) => s.outfits);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const toggleItemFavorite = useAppStore((s) => s.toggleItemFavorite);

  const [tab, setTab] = useState<Tab>('items');
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [colorFilter, setColorFilter] = useState<GarmentColorKey[]>([]);
  const [seasonFilter, setSeasonFilter] = useState<Season[]>([]);
  const [occasionFilter, setOccasionFilter] = useState<Occasion[]>([]);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const activeFilterCount =
    colorFilter.length + seasonFilter.length + occasionFilter.length;

  const visibleItems = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (quick === 'favorites' && !item.favorite) return false;
      if (quick === 'available' && !isAvailable(item, laundryDays, now)) return false;
      if (quick !== 'all' && quick !== 'favorites' && quick !== 'available') {
        if (item.category !== quick) return false;
      }
      if (colorFilter.length > 0 && !colorFilter.includes(item.colorKey)) return false;
      if (
        seasonFilter.length > 0 &&
        !seasonFilter.some((s) => item.seasons.includes(s))
      ) {
        return false;
      }
      if (
        occasionFilter.length > 0 &&
        !occasionFilter.some((o) => item.occasions.includes(o))
      ) {
        return false;
      }
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, quick, laundryDays, colorFilter, seasonFilter, occasionFilter, query]);

  const visibleOutfits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return outfits.filter((outfit) => {
      if (quick === 'favorites' && !outfit.favorite) return false;
      if (q && !outfit.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [outfits, quick, query]);

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const clearFilters = () => {
    setColorFilter([]);
    setSeasonFilter([]);
    setOccasionFilter([]);
  };

  const header = (
    <View>
      <Segmented
        options={[
          { key: 'items' as const, label: 'Peças' },
          { key: 'outfits' as const, label: 'Looks' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {searching ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.searchRow}>
          <Search size={16} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar no closet"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          <Pressable
            onPress={() => {
              setQuery('');
              setSearching(false);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar busca"
          >
            <X size={16} color={colors.inkSoft} />
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={styles.filterLine}>
        <ChipRow paddingHorizontal={0}>
          <Chip
            label="Favoritos"
            selected={quick === 'favorites'}
            onPress={() => setQuick(quick === 'favorites' ? 'all' : 'favorites')}
          />
          <Chip label="Todos" selected={quick === 'all'} onPress={() => setQuick('all')} />
          {tab === 'items' ? (
            <>
              <Chip
                label="Disponíveis"
                selected={quick === 'available'}
                onPress={() => setQuick(quick === 'available' ? 'all' : 'available')}
              />
              {CATEGORIES.map((category) => (
                <Chip
                  key={category.key}
                  label={category.label}
                  selected={quick === category.key}
                  onPress={() => setQuick(category.key)}
                />
              ))}
            </>
          ) : null}
        </ChipRow>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Closet"
        left={
          <PillButton
            label="Buscar"
            icon={<Search size={14} color={colors.ink} />}
            onPress={() => setSearching((s) => !s)}
          />
        }
        right={
          <View style={styles.headerRight}>
            {tab === 'items' ? (
              <Pressable
                onPress={() => setFiltersOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Filtros"
                style={styles.filterButton}
                hitSlop={6}
              >
                <SlidersHorizontal size={16} color={colors.ink} />
                {activeFilterCount > 0 ? (
                  <View style={styles.filterDot}>
                    <Text style={styles.filterDotText}>{activeFilterCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
            <PillButton
              label="Peça"
              icon={<Plus size={15} color={colors.onInk} />}
              tone="dark"
              onPress={() => router.push('/add-item' as never)}
            />
          </View>
        }
      />

      {tab === 'items' ? (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeIn.delay(Math.min(index, 8) * 35).duration(260)}
              layout={LinearTransition.duration(220)}
            >
              <ItemCard
                item={item}
                width={COLUMN_WIDTH}
                onPress={() => router.push(`/add-item?id=${item.id}` as never)}
                onToggleFavorite={() => toggleItemFavorite(item.id)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            items.length === 0 ? (
              <EmptyState
                icon={<Shirt size={34} color={colors.inkFaint} strokeWidth={1.5} />}
                title="Nenhuma peça ainda"
                description="Fotografe suas roupas ou escolha da galeria. Cada peça entra com categoria, cor e ocasião."
                actionLabel="Adicionar primeira peça"
                onAction={() => router.push('/add-item' as never)}
              />
            ) : (
              <EmptyState
                icon={<Search size={30} color={colors.inkFaint} strokeWidth={1.5} />}
                title="Nada com esses filtros"
                description="Ajuste os filtros ou limpe a busca para ver o closet inteiro."
                actionLabel="Limpar filtros"
                onAction={() => {
                  clearFilters();
                  setQuick('all');
                  setQuery('');
                }}
              />
            )
          }
        />
      ) : (
        <FlatList
          data={visibleOutfits}
          keyExtractor={(outfit) => outfit.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: outfit, index }) => (
            <Animated.View
              entering={FadeIn.delay(Math.min(index, 8) * 35).duration(260)}
              layout={LinearTransition.duration(220)}
            >
              <OutfitCard
                outfit={outfit}
                items={outfit.itemIds
                  .map((id) => itemsById.get(id))
                  .filter((i) => i != null)}
                width={COLUMN_WIDTH}
                onPress={() => router.push(`/outfit/${outfit.id}` as never)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Sparkles size={32} color={colors.inkFaint} strokeWidth={1.5} />}
              title="Nenhum look salvo"
              description="Monte uma combinação na prova virtual ou salve uma sugestão da tela Explorar."
              actionLabel="Ir para a prova virtual"
              onAction={() => router.push('/tryon' as never)}
            />
          }
        />
      )}

      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros"
        footer={
          <View style={styles.sheetFooter}>
            <Button
              label="Limpar"
              variant="secondary"
              onPress={clearFilters}
              style={styles.sheetButton}
            />
            <Button
              label="Aplicar"
              onPress={() => setFiltersOpen(false)}
              style={styles.sheetButton}
            />
          </View>
        }
      >
        <View style={styles.sheetSection}>
          <Text style={typeStyles.section}>Cor</Text>
          <View style={styles.wrap}>
            {garmentColorKeys.map((key) => (
              <Chip
                key={key}
                compact
                label={garmentColors[key].label}
                selected={colorFilter.includes(key)}
                leading={<ColorDot hex={garmentColors[key].hex} size={12} />}
                onPress={() => toggle(colorFilter, key, setColorFilter)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={typeStyles.section}>Estação</Text>
          <View style={styles.wrap}>
            {SEASONS.map((season) => (
              <Chip
                key={season.key}
                compact
                label={season.label}
                selected={seasonFilter.includes(season.key)}
                onPress={() => toggle(seasonFilter, season.key, setSeasonFilter)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={typeStyles.section}>Ocasião</Text>
          <View style={styles.wrap}>
            {OCCASIONS.map((occasion) => (
              <Chip
                key={occasion.key}
                compact
                label={occasion.label}
                selected={occasionFilter.includes(occasion.key)}
                onPress={() => toggle(occasionFilter, occasion.key, setOccasionFilter)}
              />
            ))}
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  filterButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDotText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    color: colors.onInk,
  },
  list: {
    paddingHorizontal: H_PADDING,
    paddingBottom: TAB_BAR_HEIGHT + space.xxxl + space.xl,
    gap: GUTTER,
  },
  column: {
    gap: GUTTER,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    height: 42,
    marginBottom: space.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.ink,
    padding: 0,
  },
  filterLine: {
    marginBottom: space.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  sheetSection: {
    gap: space.md,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: space.sm,
  },
  sheetButton: {
    flex: 1,
  },
});
