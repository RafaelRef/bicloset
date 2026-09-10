import { router } from 'expo-router';
import {
  CalendarDays,
  House,
  Shirt,
  User,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, space, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Tab {
  /** Nome do arquivo de rota dentro de (tabs). */
  name: string;
  href: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { name: 'index', href: '/', label: 'Home', Icon: House },
  { name: 'closet', href: '/closet', label: 'Closet', Icon: Shirt },
  { name: 'tryon', href: '/tryon', label: 'Provar', Icon: WandSparkles },
  { name: 'plan', href: '/plan', label: 'Agenda', Icon: CalendarDays },
  { name: 'profile', href: '/profile', label: 'Perfil', Icon: User },
];

/**
 * Barra flutuante do case: pilula clara sobreposta ao conteudo, icone + rotulo,
 * item ativo em grafite. Navega pelo router para nao depender do formato de
 * `navigation` exposto pelo navigator.
 */
export function TabBar({
  state,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
}) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.md) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {TABS.map(({ name, href, label, Icon }) => {
          const active = name === activeName;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              onPress={() => {
                if (!active) router.navigate(href as never);
              }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Icon
                size={21}
                color={active ? colors.ink : colors.inkFaint}
                strokeWidth={active ? 2.3 : 1.8}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.ink : colors.inkFaint },
                  active && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor:
      Platform.OS === 'android' ? colors.surface : 'rgba(255,255,255,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: space.sm,
    ...shadow.floating,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: space.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
  },
  labelActive: {
    fontFamily: fonts.semibold,
  },
  pressed: {
    opacity: 0.6,
  },
});
