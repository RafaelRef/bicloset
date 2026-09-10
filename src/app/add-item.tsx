import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Camera,
  Images,
  Info,
  Shapes,
  Trash2,
  Wand,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { Button } from '@/components/ui/Button';
import { Chip, ColorDot } from '@/components/ui/Chip';
import { IconCircle, ScreenHeader } from '@/components/ui/ScreenHeader';
import { persistImage } from '@/lib/media';
import { removeBackground } from '@/services/backgroundRemoval';
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
  shadow,
  space,
  type GarmentColorKey,
} from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

type Step = 'source' | 'processing' | 'form';

export default function AddItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const items = useAppStore((s) => s.items);
  const addItem = useAppStore((s) => s.addItem);
  const updateItem = useAppStore((s) => s.updateItem);
  const removeItem = useAppStore((s) => s.removeItem);

  const editing = useMemo(() => items.find((i) => i.id === id), [items, id]);

  const [step, setStep] = useState<Step>(editing ? 'form' : 'source');
  const [imageUri, setImageUri] = useState<string | null>(editing?.imageUri ?? null);
  const [originalUri, setOriginalUri] = useState<string | null>(
    editing?.originalUri ?? null,
  );
  const [bgRemoved, setBgRemoved] = useState(editing?.bgRemoved ?? false);
  /** Aviso quando o recorte nao aconteceu (sem chave, sem credito, erro). */
  const [cutoutNotice, setCutoutNotice] = useState<string | null>(null);

  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'tops');
  const [colorKey, setColorKey] = useState<GarmentColorKey>(
    editing?.colorKey ?? 'black',
  );
  const [occasions, setOccasions] = useState<Occasion[]>(editing?.occasions ?? []);
  const [seasons, setSeasons] = useState<Season[]>(editing?.seasons ?? []);

  const canSave = name.trim().length > 0;

  const process = async (uri: string) => {
    setStep('processing');
    const stored = await persistImage(uri);
    setOriginalUri(stored);
    const result = await removeBackground(stored);
    setImageUri(result.uri);
    setBgRemoved(result.status === 'removed');
    setCutoutNotice(result.message);
    setStep('form');
  };

  /**
   * Reprocessa uma peça que já está no closet — serve para as que entraram
   * antes da chave da remove.bg existir, sem precisar cadastrar de novo.
   */
  const retryCutout = async () => {
    const source = originalUri ?? imageUri;
    if (!source) return;
    setStep('processing');
    const result = await removeBackground(source);
    setImageUri(result.uri);
    setBgRemoved(result.status === 'removed');
    setCutoutNotice(result.message);
    setStep('form');
  };

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Libere o acesso à câmera para fotografar a peça.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (picked.canceled) return;
    await process(picked.assets[0].uri);
  };

  const fromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Libere o acesso às fotos para escolher a peça.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled) return;
    await process(picked.assets[0].uri);
  };

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const save = () => {
    const payload = {
      name: name.trim(),
      category,
      colorKey,
      occasions,
      seasons,
      imageUri,
      originalUri,
      bgRemoved,
    };
    if (editing) updateItem(editing.id, payload);
    else addItem(payload);
    router.back();
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert('Remover peça', `"${editing.name}" sai do closet e dos looks salvos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removeItem(editing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title={editing ? 'Editar peça' : 'Adicionar peça'}
        left={
          <IconCircle
            icon={<X size={18} color={colors.ink} />}
            accessibilityLabel="Fechar"
            onPress={() => router.back()}
          />
        }
        right={
          editing ? (
            <IconCircle
              icon={<Trash2 size={16} color={colors.danger} />}
              accessibilityLabel="Remover peça"
              onPress={confirmDelete}
            />
          ) : undefined
        }
      />

      {step === 'source' ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.sourceWrap}>
          <Text style={[typeStyles.bodyMuted, styles.sourceIntro]}>
            Fotografe a peça sobre um fundo liso, ou escolha uma imagem da galeria.
          </Text>

          <Pressable style={styles.sourceCard} onPress={fromCamera}>
            <View style={styles.sourceIcon}>
              <Camera size={24} color={colors.ink} strokeWidth={1.6} />
            </View>
            <View style={styles.sourceText}>
              <Text style={typeStyles.label}>Tirar foto</Text>
              <Text style={typeStyles.caption}>Use a câmera do celular</Text>
            </View>
          </Pressable>

          <Pressable style={styles.sourceCard} onPress={fromGallery}>
            <View style={styles.sourceIcon}>
              <Images size={24} color={colors.ink} strokeWidth={1.6} />
            </View>
            <View style={styles.sourceText}>
              <Text style={typeStyles.label}>Escolher da galeria</Text>
              <Text style={typeStyles.caption}>Fotos que já estão no celular</Text>
            </View>
          </Pressable>

          <Pressable style={styles.sourceCard} onPress={() => setStep('form')}>
            <View style={styles.sourceIcon}>
              <Shapes size={24} color={colors.ink} strokeWidth={1.6} />
            </View>
            <View style={styles.sourceText}>
              <Text style={typeStyles.label}>Sem foto</Text>
              <Text style={typeStyles.caption}>
                A peça entra com uma silhueta na cor escolhida
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      {step === 'processing' ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.processing}>
          <ActivityIndicator color={colors.ink} />
          <Text style={typeStyles.label}>Recortando a peça...</Text>
          <Text style={[typeStyles.bodyMuted, styles.processingHint]}>
            Separando a roupa do fundo da foto.
          </Text>
        </Animated.View>
      ) : null}

      {step === 'form' ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.duration(400)} style={styles.preview}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="contain" />
              ) : (
                <GarmentGlyph category={category} colorKey={colorKey} size={150} />
              )}
            </Animated.View>

            {cutoutNotice ? (
              <View style={styles.notice}>
                <Info size={14} color={colors.ai} />
                <Text style={styles.noticeText}>{cutoutNotice}</Text>
              </View>
            ) : null}

            {imageUri && !bgRemoved ? (
              <Pressable style={styles.addPhoto} onPress={retryCutout}>
                <Wand size={15} color={colors.inkSoft} />
                <Text style={typeStyles.caption}>Remover o fundo desta foto</Text>
              </Pressable>
            ) : null}

            {!imageUri && !editing ? (
              <Pressable style={styles.addPhoto} onPress={() => setStep('source')}>
                <Wand size={15} color={colors.inkSoft} />
                <Text style={typeStyles.caption}>Adicionar uma foto</Text>
              </Pressable>
            ) : null}

            <View style={styles.field}>
              <Text style={typeStyles.section}>Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Camiseta branca"
                placeholderTextColor={colors.inkFaint}
                style={styles.input}
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={typeStyles.section}>Categoria</Text>
              <View style={styles.wrap}>
                {CATEGORIES.map((entry) => (
                  <Chip
                    key={entry.key}
                    label={entry.label}
                    selected={category === entry.key}
                    onPress={() => setCategory(entry.key)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typeStyles.section}>Cor</Text>
              <View style={styles.wrap}>
                {garmentColorKeys.map((key) => (
                  <Chip
                    key={key}
                    compact
                    label={garmentColors[key].label}
                    selected={colorKey === key}
                    leading={<ColorDot hex={garmentColors[key].hex} size={12} />}
                    onPress={() => setColorKey(key)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typeStyles.section}>Ocasião</Text>
              <View style={styles.wrap}>
                {OCCASIONS.map((entry) => (
                  <Chip
                    key={entry.key}
                    label={entry.label}
                    selected={occasions.includes(entry.key)}
                    onPress={() => toggle(occasions, entry.key, setOccasions)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typeStyles.section}>Estação</Text>
              <View style={styles.wrap}>
                {SEASONS.map((entry) => (
                  <Chip
                    key={entry.key}
                    label={entry.label}
                    selected={seasons.includes(entry.key)}
                    onPress={() => toggle(seasons, entry.key, setSeasons)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={editing ? 'Salvar alterações' : 'Adicionar ao closet'}
              disabled={!canSave}
              onPress={save}
            />
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  sourceWrap: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    gap: space.md,
  },
  sourceIntro: {
    marginBottom: space.sm,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
  sourceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    flex: 1,
    gap: 3,
  },
  processing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  processingHint: {
    textAlign: 'center',
    maxWidth: 260,
  },
  formContent: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
    gap: space.xl,
  },
  preview: {
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  addPhoto: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: {
    gap: space.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 48,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
});
