import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ChevronRight,
  Info,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  User,
  WashingMachine,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getAvailability } from '@/lib/availability';
import { persistImage } from '@/lib/media';
import { buildDemoCloset } from '@/lib/seed';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, shadow, space, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

export default function ProfileScreen() {
  const items = useAppStore((s) => s.items);
  const outfits = useAppStore((s) => s.outfits);
  const plans = useAppStore((s) => s.plans);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const addItem = useAppStore((s) => s.addItem);
  const clearWardrobe = useAppStore((s) => s.clearWardrobe);

  const [name, setName] = useState(settings.ownerName);

  const stats = useMemo(() => {
    const now = Date.now();
    const washing = items.filter(
      (i) => !getAvailability(i, settings.laundryDays, now).available,
    ).length;
    const worn = plans.filter((p) => p.worn).length;
    const mostWorn = [...items]
      .filter((i) => i.wearCount > 0)
      .sort((a, b) => b.wearCount - a.wearCount)
      .slice(0, 5);
    const neverWorn = items.filter((i) => i.wearCount === 0).length;
    return { washing, worn, mostWorn, neverWorn };
  }, [items, plans, settings.laundryDays]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Libere o acesso às fotos para trocar o avatar.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled) return;
    const stored = await persistImage(picked.assets[0].uri);
    updateSettings({ avatarUri: stored });
  };

  const setLaundryDays = (delta: number) => {
    const next = Math.min(30, Math.max(0, settings.laundryDays + delta));
    updateSettings({ laundryDays: next });
  };

  const loadDemo = () => {
    Alert.alert(
      'Carregar closet de exemplo',
      'Adiciona 23 peças fictícias para você testar o app. Não apaga o que já existe.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Carregar',
          onPress: () => {
            for (const demo of buildDemoCloset()) addItem(demo);
          },
        },
      ],
    );
  };

  const confirmClear = () => {
    Alert.alert(
      'Apagar tudo',
      'Remove todas as peças, looks e planos. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: clearWardrobe },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
          <Pressable
            onPress={pickAvatar}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel="Trocar avatar"
          >
            {settings.avatarUri ? (
              <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} />
            ) : (
              <User size={30} color={colors.inkFaint} strokeWidth={1.5} />
            )}
          </Pressable>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={() => updateSettings({ ownerName: name.trim() })}
            placeholder="Seu nome"
            placeholderTextColor={colors.inkFaint}
            style={styles.nameInput}
            returnKeyType="done"
            onSubmitEditing={() => updateSettings({ ownerName: name.trim() })}
          />
          <Text style={typeStyles.bodyMuted}>
            {items.length} peças · {outfits.length} looks · {stats.worn} usos
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={[typeStyles.headline, styles.sectionTitle]}>Lavanderia</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <WashingMachine size={18} color={colors.laundry} />
                <View style={styles.rowText}>
                  <Text style={typeStyles.label}>Período de lavagem</Text>
                  <Text style={typeStyles.caption}>
                    {settings.laundryDays === 0
                      ? 'Desligado: peças ficam sempre disponíveis'
                      : `Peças usadas somem por ${settings.laundryDays} dias`}
                  </Text>
                </View>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setLaundryDays(-1)}
                  style={styles.stepperButton}
                  accessibilityRole="button"
                  accessibilityLabel="Diminuir dias"
                >
                  <Minus size={15} color={colors.ink} />
                </Pressable>
                <Text style={styles.stepperValue}>{settings.laundryDays}</Text>
                <Pressable
                  onPress={() => setLaundryDays(1)}
                  style={styles.stepperButton}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar dias"
                >
                  <Plus size={15} color={colors.ink} />
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={typeStyles.bodyMuted}>
              {stats.washing} peça{stats.washing === 1 ? '' : 's'} na lavanderia agora.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Text style={[typeStyles.headline, styles.sectionTitle]}>Suas estatísticas</Text>
          <View style={styles.card}>
            {stats.mostWorn.length === 0 ? (
              <Text style={typeStyles.bodyMuted}>
                Nenhum uso confirmado ainda. Marque um look como usado na Agenda para
                começar a contar.
              </Text>
            ) : (
              <>
                <Text style={typeStyles.section}>Mais usadas</Text>
                {stats.mostWorn.map((item) => (
                  <View key={item.id} style={styles.wornRow}>
                    <View style={styles.wornThumb}>
                      <GarmentGlyph
                        category={item.category}
                        colorKey={item.colorKey}
                        size={30}
                      />
                    </View>
                    <Text style={styles.wornName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.wornCount}>{item.wearCount}x</Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <Text style={typeStyles.bodyMuted}>
                  {stats.neverWorn} peça{stats.neverWorn === 1 ? '' : 's'} nunca usada
                  {stats.neverWorn === 1 ? '' : 's'}.
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <Text style={[typeStyles.headline, styles.sectionTitle]}>Closet</Text>
          <View style={styles.card}>
            <Pressable style={styles.actionRow} onPress={loadDemo}>
              <Sparkles size={17} color={colors.ink} />
              <Text style={styles.actionLabel}>Carregar closet de exemplo</Text>
              <ChevronRight size={17} color={colors.inkFaint} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.actionRow} onPress={() => router.push('/explore' as never)}>
              <Sparkles size={17} color={colors.ai} />
              <Text style={styles.actionLabel}>Ver sugestões de look</Text>
              <ChevronRight size={17} color={colors.inkFaint} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.actionRow} onPress={confirmClear}>
              <Trash2 size={17} color={colors.danger} />
              <Text style={[styles.actionLabel, { color: colors.danger }]}>
                Apagar todo o closet
              </Text>
              <ChevronRight size={17} color={colors.inkFaint} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.about}>
          <Info size={14} color={colors.inkSoft} />
          <Text style={styles.aboutText}>
            A prova virtual e a remoção de fundo estão mockadas nesta versão: rodam
            localmente, sem chamar nenhum serviço de IA. O README explica quais chaves
            de API ativam as duas de verdade.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: TAB_BAR_HEIGHT + space.xxxl + space.xl,
    gap: space.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    ...shadow.card,
  },
  avatar: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nameInput: {
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 19,
    color: colors.ink,
    padding: 0,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 3,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 18,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  wornRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  wornThumb: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wornName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.ink,
  },
  wornCount: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  actionLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.ink,
  },
  about: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingHorizontal: space.xs,
  },
  aboutText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
  },
});
