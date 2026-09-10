import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, shadow } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

interface Props<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Segmented control centralizado, como "Clothes | Collections" no case. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {options.map((option) => {
          const active = option.key === value;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.key)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.ink : colors.inkSoft },
                ]}
              >
                {option.label}
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
    alignItems: 'center',
    paddingBottom: space.md,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: {
    paddingHorizontal: space.xl,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
  },
});
