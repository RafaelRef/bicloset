import { router } from 'expo-router';
import {
  ArrowRight,
  Check,
  Plus,
  Shirt,
  Shuffle,
  Sparkles,
  WashingMachine,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OutfitCard } from '@/components/OutfitCard';
import { TryOnCanvas } from '@/components/TryOnCanvas';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PillButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { getAvailability } from '@/lib/availability';
import { suggestOutfits } from '@/services/stylist';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, shadow, space, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const items = useAppStore((s) => s.items);
  const outfits = useAppStore((s) => s.outfits);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const ownerName = useAppStore((s) => s.settings.ownerName);
  const modelPhotoUri = useAppStore((s) => s.settings.modelPhotoUri);
  const addOutfit = useAppStore((s) => s.addOutfit);
  const wearOutfitToday = useAppStore((s) => s.wearOutfitToday);

  // Indice para trocar a sugestao do dia sem recalcular tudo.
  const [pick, setPick] = useState(0);

  const suggestions = useMemo(
    () => suggestOutfits(items, laundryDays, { limit: 8 }),
    [items, laundryDays],
  );

  const featured = suggestions.length > 0 ? suggestions[pick % suggestions.length] : null;

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const featuredItems = useMemo(
    () =>
      featured
        ? featured.itemIds.map((id) => itemsById.get(id)).filter((i) => i != null)
        : [],
    [featured, itemsById],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    let available = 0;
    let washing = 0;
    for (const item of items) {
      if (getAvailability(item, laundryDays, now).available) available += 1;
      else washing += 1;
    }
    return { available, washing, outfits: outfits.length };
  }, [items, laundryDays, outfits.length]);

  const recentOutfits = useMemo(() => outfits.slice(0, 6), [outfits]);

  const saveFeatured = () => {
    if (!featured) return;
    const outfit = addOutfit({
      name: `Look ${featured.label.toLowerCase()}`,
      itemIds: featured.itemIds,
      personUri: modelPhotoUri,
      occasion: featured.occasion,
      source: 'ai',
    });
    router.push(`/outfit/${outfit.id}` as never);
  };

  const wearFeatured = () => {
    if (!featured) return;
    const outfit = addOutfit({
      name: `Look ${featured.label.toLowerCase()}`,
      itemIds: featured.itemIds,
      personUri: modelPhotoUri,
      occasion: featured.occasion,
      source: 'ai',
    });
    wearOutfitToday(outfit.id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="bicloset"
        wordmark
        right={
          <PillButton
            label="Peca"
            icon={<Plus size={15} color={colors.ink} />}
            onPress={() => router.push('/add-item' as never)}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.greeting}>
            {greeting()}
            {ownerName ? `, ${ownerName}` : ''}
          </Text>
          <Text style={typeStyles.bodyMuted}>
            {items.length === 0
              ? 'Vamos montar seu guarda-roupa.'
              : `${stats.available} pecas prontas para usar hoje.`}
          </Text>
        </Animated.View>

        {items.length === 0 ? (
          <EmptyState
            icon={<Shirt size={34} color={colors.inkFaint} strokeWidth={1.5} />}
            title="Seu closet esta vazio"
            description="Adicione a primeira peca com a camera ou a galeria. Em poucos minutos da para montar looks."
            actionLabel="Adicionar peca"
            onAction={() => router.push('/add-item' as never)}
            secondaryLabel="Carregar closet de exemplo"
            onSecondary={() => router.push('/profile' as never)}
          />
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <View style={styles.sectionHead}>
                <Text style={typeStyles.headline}>Look de hoje</Text>
                {suggestions.length > 1 ? (
                  <Pressable
                    onPress={() => setPick((p) => p + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Sugerir outro look"
                    style={styles.shuffle}
                    hitSlop={8}
                  >
                    <Shuffle size={15} color={colors.inkSoft} />
                    <Text style={typeStyles.caption}>Trocar</Text>
                  </Pressable>
                ) : null}
              </View>

              {featured ? (
                <View style={styles.hero}>
                  <TryOnCanvas
                    personUri={modelPhotoUri}
                    items={featuredItems}
                    height={300}
                    compact
                    style={styles.heroCanvas}
                  />
                  <View style={styles.heroInfo}>
                    <View style={styles.badge}>
                      <Sparkles size={12} color={colors.ai} />
                      <Text style={styles.badgeText}>{featured.label}</Text>
                    </View>
                    <Text style={styles.heroItems} numberOfLines={2}>
                      {featuredItems.map((i) => i.name).join(' · ')}
                    </Text>
                  </View>
                  <View style={styles.heroActions}>
                    <Button
                      label="Abrir look"
                      onPress={saveFeatured}
                      style={styles.heroButton}
                    />
                    <Button
                      label="Usei hoje"
                      variant="secondary"
                      icon={<Check size={16} color={colors.ink} />}
                      onPress={wearFeatured}
                      style={styles.heroButton}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.hero}>
                  <Text style={typeStyles.bodyMuted}>
                    Todas as pecas combinaveis estao na lavanderia. Adicione mais
                    itens ou espere alguns dias.
                  </Text>
                </View>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(120).duration(400)}
              style={styles.statsRow}
            >
              <StatTile
                value={String(stats.available)}
                label="disponiveis"
                icon={<Shirt size={14} color={colors.inkSoft} />}
              />
              <StatTile
                value={String(stats.washing)}
                label="na lavanderia"
                icon={<WashingMachine size={14} color={colors.laundry} />}
                tone="laundry"
              />
              <StatTile
                value={String(stats.outfits)}
                label="looks salvos"
                icon={<Sparkles size={14} color={colors.ai} />}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
              <View style={styles.sectionHead}>
                <Text style={typeStyles.headline}>Ideias para voce</Text>
                <Pressable
                  onPress={() => router.push('/explore' as never)}
                  accessibilityRole="button"
                  style={styles.shuffle}
                  hitSlop={8}
                >
                  <Text style={typeStyles.caption}>Ver todas</Text>
                  <ArrowRight size={14} color={colors.inkSoft} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hRow}
              >
                {suggestions.slice(0, 6).map((suggestion) => {
                  const suggestionItems = suggestion.itemIds
                    .map((id) => itemsById.get(id))
                    .filter((i) => i != null);
                  return (
                    <Pressable
                      key={suggestion.id}
                      onPress={() => router.push('/explore' as never)}
                      style={styles.ideaCard}
                    >
                      <TryOnCanvas
                        personUri={modelPhotoUri}
                        items={suggestionItems}
                        height={150}
                        compact
                        style={styles.ideaCanvas}
                      />
                      <Text style={styles.ideaLabel}>{suggestion.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {recentOutfits.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(240).duration(400)}>
                <View style={styles.sectionHead}>
                  <Text style={typeStyles.headline}>Seus looks</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hRow}
                >
                  {recentOutfits.map((outfit) => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      items={outfit.itemIds
                        .map((id) => itemsById.get(id))
                        .filter((i) => i != null)}
                      width={150}
                      height={160}
                      onPress={() => router.push(`/outfit/${outfit.id}` as never)}
                    />
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  value,
  label,
  icon,
  tone,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  tone?: 'laundry';
}) {
  return (
    <View style={[styles.stat, tone === 'laundry' && styles.statLaundry]}>
      <View style={styles.statTop}>
        {icon}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: TAB_BAR_HEIGHT + space.xxxl + space.xl,
    gap: space.xxl,
  },
  greeting: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  shuffle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 1,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.md,
    ...shadow.card,
  },
  heroCanvas: {
    borderRadius: radius.lg,
  },
  heroInfo: {
    paddingHorizontal: space.sm,
    paddingTop: space.md,
    gap: space.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 1,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.aiTint,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.ai,
  },
  heroItems: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  heroActions: {
    flexDirection: 'row',
    gap: space.sm,
    paddingTop: space.md,
  },
  heroButton: {
    flex: 1,
    paddingHorizontal: space.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    gap: 2,
    ...shadow.card,
  },
  statLaundry: {
    backgroundColor: colors.laundryTint,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
  },
  statValue: {
    fontFamily: fonts.semibold,
    fontSize: 19,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  hRow: {
    gap: space.md,
    paddingRight: space.xl,
  },
  ideaCard: {
    width: 128,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    ...shadow.card,
  },
  ideaCanvas: {
    borderRadius: radius.md,
  },
  ideaLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkSoft,
    paddingTop: space.sm,
    paddingHorizontal: space.xs,
  },
});
