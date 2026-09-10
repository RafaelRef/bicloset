import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Info, PersonStanding, Shirt, Sparkles, WandSparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { TryOnCanvas } from '@/components/TryOnCanvas';
import { Button } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PillButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { isAvailable } from '@/lib/availability';
import { persistImage } from '@/lib/media';
import { generateTryOn, type TryOnResult } from '@/services/tryOn';
import { defaultOccasion, useAppStore } from '@/store/useAppStore';
import { CATEGORIES, type Category } from '@/store/types';
import { colors, radius, shadow, space, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

/** Categorias que aceitam apenas uma peca por look. */
const SINGLE_PICK: Category[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes'];

export default function TryOnScreen() {
  const items = useAppStore((s) => s.items);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const modelPhotoUri = useAppStore((s) => s.settings.modelPhotoUri);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const addOutfit = useAppStore((s) => s.addOutfit);

  const [category, setCategory] = useState<Category>('tops');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<TryOnResult | null>(null);

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const selectedItems = useMemo(
    () => selectedIds.map((id) => itemsById.get(id)).filter((i) => i != null),
    [selectedIds, itemsById],
  );

  const strip = useMemo(() => {
    const now = Date.now();
    return items.filter(
      (item) =>
        item.category === category &&
        (showUnavailable || isAvailable(item, laundryDays, now)),
    );
  }, [items, category, showUnavailable, laundryDays]);

  const toggleItem = (id: string) => {
    const item = itemsById.get(id);
    if (!item) return;
    setResult(null);
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((i) => i !== id);
      if (SINGLE_PICK.includes(item.category)) {
        // Uma peca por zona: escolher outro top troca o anterior.
        const withoutSameCategory = current.filter(
          (existing) => itemsById.get(existing)?.category !== item.category,
        );
        return [...withoutSameCategory, id];
      }
      return [...current, id];
    });
  };

  const pickModelPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissao necessaria',
        'Libere o acesso as fotos para escolher a imagem de referencia.',
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled) return;
    const stored = await persistImage(picked.assets[0].uri);
    updateSettings({ modelPhotoUri: stored });
  };

  const handleGenerate = async () => {
    if (selectedItems.length === 0) return;
    setGenerating(true);
    try {
      const generated = await generateTryOn({
        personUri: modelPhotoUri,
        items: selectedItems,
      });
      setResult(generated);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (selectedItems.length === 0) return;
    const outfit = addOutfit({
      name: `Look de ${new Date().getDate()}/${new Date().getMonth() + 1}`,
      itemIds: selectedIds,
      personUri: modelPhotoUri,
      occasion: defaultOccasion(),
      source: 'tryon',
    });
    setSelectedIds([]);
    setResult(null);
    router.push(`/outfit/${outfit.id}` as never);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Prova virtual" />
        <EmptyState
          icon={<WandSparkles size={32} color={colors.inkFaint} strokeWidth={1.5} />}
          title="Nada para provar ainda"
          description="Cadastre algumas pecas no closet e volte aqui para montar o look sobre a sua foto."
          actionLabel="Adicionar peca"
          onAction={() => router.push('/add-item' as never)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Prova virtual"
        right={
          <PillButton
            label={modelPhotoUri ? 'Trocar foto' : 'Sua foto'}
            icon={<PersonStanding size={14} color={colors.ink} />}
            onPress={pickModelPhoto}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <TryOnCanvas
            personUri={modelPhotoUri}
            items={selectedItems}
            compositeUri={result?.compositeUri ?? null}
            height={400}
          />
        </Animated.View>

        {result?.mocked ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.notice}>
            <Info size={14} color={colors.ai} />
            <Text style={styles.noticeText}>
              Composicao local. A prova virtual com IA precisa de uma chave de API —
              veja o README.
            </Text>
          </Animated.View>
        ) : null}

        {!modelPhotoUri ? (
          <Pressable onPress={pickModelPhoto} style={styles.hint}>
            <PersonStanding size={16} color={colors.inkSoft} />
            <Text style={typeStyles.bodyMuted}>
              Escolha uma foto de corpo inteiro para ver o look sobre voce.
            </Text>
          </Pressable>
        ) : null}

        <View>
          <View style={styles.sectionHead}>
            <Text style={typeStyles.headline}>Escolha as pecas</Text>
            <Text style={typeStyles.caption}>
              {selectedItems.length} selecionada
              {selectedItems.length === 1 ? '' : 's'}
            </Text>
          </View>

          <ChipRow paddingHorizontal={0}>
            {CATEGORIES.map((entry) => (
              <Chip
                key={entry.key}
                label={entry.label}
                selected={category === entry.key}
                onPress={() => setCategory(entry.key)}
              />
            ))}
          </ChipRow>

          <View style={styles.availabilityRow}>
            <Chip
              compact
              label={showUnavailable ? 'Mostrando tudo' : 'So disponiveis'}
              selected={!showUnavailable}
              onPress={() => setShowUnavailable((v) => !v)}
            />
          </View>

          {strip.length === 0 ? (
            <View style={styles.emptyStrip}>
              <Shirt size={20} color={colors.inkFaint} />
              <Text style={typeStyles.bodyMuted}>
                {showUnavailable
                  ? 'Nenhuma peca nesta categoria.'
                  : 'Tudo nesta categoria esta na lavanderia.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.strip}
            >
              {strip.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  width={116}
                  selectable
                  selected={selectedIds.includes(item.id)}
                  onPress={() => toggleItem(item.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {selectedItems.length > 0 ? (
          <View style={styles.selectedBox}>
            <Text style={typeStyles.section}>Neste look</Text>
            <Text style={styles.selectedText}>
              {selectedItems.map((i) => i.name).join(' · ')}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {result ? (
          <Button
            label="Salvar look"
            icon={<Sparkles size={16} color={colors.onInk} />}
            onPress={handleSave}
          />
        ) : (
          <Button
            label={generating ? 'Gerando...' : 'Gerar prova'}
            loading={generating}
            disabled={selectedItems.length === 0}
            onPress={handleGenerate}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: TAB_BAR_HEIGHT + 52 + space.xxxl + space.xl,
    gap: space.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.aiTint,
    borderRadius: radius.md,
    padding: space.md,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ai,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    ...shadow.card,
  },
  availabilityRow: {
    flexDirection: 'row',
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  strip: {
    gap: space.md,
    paddingRight: space.xl,
    paddingVertical: space.xs,
  },
  emptyStrip: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
  },
  selectedBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.xs,
    ...shadow.card,
  },
  selectedText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.ink,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT + space.xl,
    paddingHorizontal: space.xl,
  },
});
