import { router } from 'expo-router';
import { CalendarDays, Shirt, WandSparkles } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, space } from '@/theme/tokens';
import { type as typeStyles } from '@/theme/typography';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    Icon: Shirt,
    title: 'Seu guarda-roupa, digital',
    body: 'Fotografe suas peças e monte o closet em minutos. Tudo organizado por categoria, cor e ocasião.',
  },
  {
    Icon: WandSparkles,
    title: 'Prove antes de vestir',
    body: 'Combine peças sobre a sua foto de referência e veja o look montado antes de sair do quarto.',
  },
  {
    Icon: CalendarDays,
    title: 'Planeje a semana',
    body: 'Marque o look de cada dia. Ao confirmar que usou, as peças entram no período de lavagem sozinhas.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const isLast = index === STEPS.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const handleNext = () => {
    if (isLast) {
      updateSettings({ onboarded: true });
      router.replace('/');
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  const handleSkip = () => {
    updateSettings({ onboarded: true });
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.Text entering={FadeIn.duration(600)} style={styles.wordmark}>
        bicloset
      </Animated.Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {STEPS.map(({ Icon, title, body }) => (
          <View key={title} style={[styles.page, { width }]}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.iconCircle}>
              <Icon size={40} color={colors.ink} strokeWidth={1.5} />
            </Animated.View>
            <Text style={[typeStyles.title, styles.title]}>{title}</Text>
            <Text style={[typeStyles.bodyMuted, styles.body]}>{body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {STEPS.map((step, i) => (
          <View key={step.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button label={isLast ? 'Começar' : 'Continuar'} onPress={handleNext} />
        {!isLast ? (
          <Button label="Pular" variant="ghost" onPress={handleSkip} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: colors.ink,
    textAlign: 'center',
    paddingTop: space.xl,
  },
  pager: {
    flexGrow: 0,
    flexShrink: 1,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxxl,
    paddingVertical: space.xxxl,
    gap: space.md,
  },
  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.ink,
    width: 22,
  },
  actions: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.md,
  },
});
