import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius, space } from '@/theme/tokens';
import { type as typeStyles } from '@/theme/typography';
import { Button } from './Button';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Estado vazio: e a primeira tela que a pessoa ve em quase todo lugar, entao
 * carrega o convite principal em vez de so avisar que nao ha nada.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.wrap}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={[typeStyles.headline, styles.title]}>{title}</Text>
      <Text style={[typeStyles.bodyMuted, styles.description]}>{description}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          variant="secondary"
          onPress={onSecondary}
          style={styles.action}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: space.xxxl,
    paddingVertical: space.xxxl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: space.sm,
  },
  description: {
    textAlign: 'center',
    maxWidth: 300,
  },
  action: {
    marginTop: space.xl,
    alignSelf: 'stretch',
  },
});
