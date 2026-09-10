import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, space } from '@/theme/tokens';
import { type as typeStyles } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** CTA em pilula, no formato do case: grafite solido, texto branco, 52pt. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: Props) {
  const inactive = disabled || loading;

  const handlePress = () => {
    if (inactive) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const bg = inactive
    ? colors.disabled
    : variant === 'primary'
      ? colors.ink
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';

  const fg =
    variant === 'primary' || inactive ? colors.onInk : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg },
        variant === 'secondary' && !inactive && styles.secondary,
        variant === 'ghost' && !inactive && styles.ghost,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[typeStyles.button, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
