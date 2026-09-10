import { router } from 'expo-router';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  WashingMachine,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TryOnCanvas } from '@/components/TryOnCanvas';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconCircle, PillButton, ScreenHeader } from '@/components/ui/ScreenHeader';
import { Sheet } from '@/components/ui/Sheet';
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  dateKey,
  friendlyDate,
  isSameDay,
  keyToDate,
  monthMatrix,
} from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, shadow, space, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { fonts, type as typeStyles } from '@/theme/typography';

const CELL = (Dimensions.get('window').width - space.xl * 2 - space.md * 2) / 7;

export default function PlanScreen() {
  const items = useAppStore((s) => s.items);
  const outfits = useAppStore((s) => s.outfits);
  const plans = useAppStore((s) => s.plans);
  const laundryDays = useAppStore((s) => s.settings.laundryDays);
  const planOutfit = useAppStore((s) => s.planOutfit);
  const removePlan = useAppStore((s) => s.removePlan);
  const setPlanWorn = useAppStore((s) => s.setPlanWorn);

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(today));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [eventLabel, setEventLabel] = useState('');

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const outfitsById = useMemo(() => new Map(outfits.map((o) => [o.id, o])), [outfits]);

  const plansByDate = useMemo(() => {
    const map = new Map<string, typeof plans>();
    for (const plan of plans) {
      const list = map.get(plan.date);
      if (list) list.push(plan);
      else map.set(plan.date, [plan]);
    }
    return map;
  }, [plans]);

  const weeks = useMemo(
    () => monthMatrix(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const selectedPlans = plansByDate.get(selected) ?? [];
  const selectedDate = keyToDate(selected);

  const outfitItems = (outfitId: string) => {
    const outfit = outfitsById.get(outfitId);
    if (!outfit) return [];
    return outfit.itemIds.map((id) => itemsById.get(id)).filter((i) => i != null);
  };

  const shiftMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const handlePlan = (outfitId: string) => {
    planOutfit({
      date: selected,
      outfitId,
      eventLabel: eventLabel.trim() || null,
    });
    setEventLabel('');
    setPickerOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Agenda"
        right={
          <PillButton
            label="Planejar"
            icon={<Plus size={15} color={colors.onInk} />}
            tone="dark"
            onPress={() => setPickerOpen(true)}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.calendar}>
          <View style={styles.monthRow}>
            <IconCircle
              icon={<ChevronLeft size={18} color={colors.ink} />}
              accessibilityLabel="Mês anterior"
              onPress={() => shiftMonth(-1)}
            />
            <Text style={typeStyles.headline}>
              {MONTH_LABELS[cursor.getMonth()]} {cursor.getFullYear()}
            </Text>
            <IconCircle
              icon={<ChevronRight size={18} color={colors.ink} />}
              accessibilityLabel="Próximo mês"
              onPress={() => shiftMonth(1)}
            />
          </View>

          <View style={styles.weekdays}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.week}>
              {week.map((day, dayIndex) => {
                if (!day) return <View key={dayIndex} style={styles.cell} />;
                const key = dateKey(day);
                const dayPlans = plansByDate.get(key) ?? [];
                const isSelected = key === selected;
                const isToday = isSameDay(day, today);
                const hasWorn = dayPlans.some((p) => p.worn);

                return (
                  <Pressable
                    key={dayIndex}
                    onPress={() => setSelected(key)}
                    accessibilityRole="button"
                    accessibilityLabel={friendlyDate(day, today)}
                    accessibilityState={{ selected: isSelected }}
                    style={styles.cell}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isToday && !isSelected && styles.dayToday,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                    <View style={styles.dotRow}>
                      {dayPlans.slice(0, 3).map((plan) => (
                        <View
                          key={plan.id}
                          style={[
                            styles.dot,
                            hasWorn && plan.worn && styles.dotWorn,
                            isSelected && styles.dotOnSelected,
                          ]}
                        />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>

        <View>
          <View style={styles.sectionHead}>
            <Text style={typeStyles.headline}>{friendlyDate(selectedDate, today)}</Text>
            <Text style={typeStyles.caption}>
              {selectedPlans.length === 0
                ? 'nada planejado'
                : `${selectedPlans.length} look${selectedPlans.length === 1 ? '' : 's'}`}
            </Text>
          </View>

          {selectedPlans.length === 0 ? (
            outfits.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={30} color={colors.inkFaint} strokeWidth={1.5} />}
                title="Nenhum look para agendar"
                description="Monte um look na prova virtual primeiro. Depois volte aqui para reservar um dia para ele."
                actionLabel="Montar um look"
                onAction={() => router.push('/tryon' as never)}
              />
            ) : (
              <Pressable style={styles.emptyDay} onPress={() => setPickerOpen(true)}>
                <Plus size={18} color={colors.inkSoft} />
                <Text style={typeStyles.bodyMuted}>
                  Escolher um look para {friendlyDate(selectedDate, today).toLowerCase()}
                </Text>
              </Pressable>
            )
          ) : (
            selectedPlans.map((plan) => {
              const outfit = outfitsById.get(plan.outfitId);
              if (!outfit) return null;
              return (
                <Animated.View
                  key={plan.id}
                  entering={FadeIn.duration(260)}
                  style={styles.planCard}
                >
                  <Pressable
                    style={styles.planTop}
                    onPress={() => router.push(`/outfit/${outfit.id}` as never)}
                  >
                    <TryOnCanvas
                      personUri={outfit.personUri}
                      items={outfitItems(outfit.id)}
                      height={96}
                      compact
                      style={styles.planThumb}
                    />
                    <View style={styles.planInfo}>
                      <Text style={styles.planName} numberOfLines={1}>
                        {outfit.name}
                      </Text>
                      {plan.eventLabel ? (
                        <Text style={typeStyles.caption}>{plan.eventLabel}</Text>
                      ) : null}
                      {plan.worn ? (
                        <View style={styles.wornBadge}>
                          <WashingMachine size={11} color={colors.laundry} />
                          <Text style={styles.wornText}>
                            Peças na lavanderia por {laundryDays} dias
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => removePlan(plan.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Remover do calendário"
                    >
                      <Trash2 size={16} color={colors.inkFaint} />
                    </Pressable>
                  </Pressable>

                  <Button
                    label={plan.worn ? 'Usei este look — desfazer' : 'Confirmar que usei'}
                    variant={plan.worn ? 'secondary' : 'primary'}
                    icon={
                      plan.worn ? undefined : <Check size={16} color={colors.onInk} />
                    }
                    onPress={() => setPlanWorn(plan.id, !plan.worn)}
                  />
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Sheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Planejar para ${friendlyDate(selectedDate, today).toLowerCase()}`}
      >
        <View style={styles.sheetSection}>
          <Text style={typeStyles.section}>Evento (opcional)</Text>
          <TextInput
            value={eventLabel}
            onChangeText={setEventLabel}
            placeholder="Jantar, reunião, viagem..."
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
          />
        </View>

        <View style={styles.sheetSection}>
          <Text style={typeStyles.section}>Escolha um look</Text>
          {outfits.length === 0 ? (
            <Text style={typeStyles.bodyMuted}>
              Você ainda não salvou nenhum look. Monte um na prova virtual.
            </Text>
          ) : (
            <View style={styles.outfitList}>
              {outfits.map((outfit) => (
                <Pressable
                  key={outfit.id}
                  onPress={() => handlePlan(outfit.id)}
                  style={styles.outfitRow}
                >
                  <TryOnCanvas
                    personUri={outfit.personUri}
                    items={outfitItems(outfit.id)}
                    height={72}
                    compact
                    style={styles.outfitThumb}
                  />
                  <View style={styles.planInfo}>
                    <Text style={styles.planName} numberOfLines={1}>
                      {outfit.name}
                    </Text>
                    <Text style={typeStyles.caption}>
                      {outfit.itemIds.length} peças · usado {outfit.wearCount}x
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.inkFaint} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Sheet>
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
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.md,
    ...shadow.card,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
    paddingBottom: space.lg,
  },
  weekdays: {
    flexDirection: 'row',
    paddingBottom: space.sm,
  },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.inkFaint,
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  daySelected: {
    backgroundColor: colors.ink,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.ink,
  },
  dayTextSelected: {
    color: colors.onInk,
    fontFamily: fonts.semibold,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.inkFaint,
  },
  dotWorn: {
    backgroundColor: colors.laundry,
  },
  dotOnSelected: {
    backgroundColor: colors.ink,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: space.xxl,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    gap: space.md,
    ...shadow.card,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  planThumb: {
    width: 72,
    borderRadius: radius.md,
  },
  planInfo: {
    flex: 1,
    gap: 3,
  },
  planName: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.ink,
  },
  wornBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.laundryTint,
    marginTop: 2,
  },
  wornText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.laundry,
  },
  sheetSection: {
    gap: space.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.ink,
  },
  outfitList: {
    gap: space.sm,
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: space.sm,
  },
  outfitThumb: {
    width: 56,
    borderRadius: radius.sm,
  },
});
