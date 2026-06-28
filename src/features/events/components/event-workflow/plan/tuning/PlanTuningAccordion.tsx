import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  PlanTuningAccordionPresentation,
  PlanTuningValues,
  TuningControlKey,
  TuningLevel,
} from '@/features/events/utils/eventPlanTuningPresentation';
import { shadows } from '@/ui/theme/shadows';

import { TuningControlRow } from './TuningControlRow';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanTuningAccordionProps = {
  accordion: PlanTuningAccordionPresentation;
  isOpen: boolean;
  values: PlanTuningValues;
  reducedMotion?: boolean;
  onToggle: () => void;
  onReset: () => void;
  onValueChange: (key: TuningControlKey, value: TuningLevel) => void;
};

export function PlanTuningAccordion({
  accordion,
  isOpen,
  values,
  reducedMotion = false,
  onToggle,
  onReset,
  onValueChange,
}: PlanTuningAccordionProps) {
  const chevronRotation = useSharedValue(isOpen ? 180 : 0);
  const contentOpacity = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    if (!reducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    chevronRotation.value = withTiming(isOpen ? 180 : 0, { duration: reducedMotion ? 0 : 240 });
    contentOpacity.value = withTiming(isOpen ? 1 : 0, { duration: reducedMotion ? 0 : 220 });
  }, [chevronRotation, contentOpacity, isOpen, reducedMotion]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: isOpen ? 0 : reducedMotion ? 0 : -4 }],
  }));

  const modeBadgeStyle =
    accordion.modeBadge.tone === 'custom' ? styles.badgeCustom : styles.badgeStandard;

  return (
    <View style={[styles.card, shadows.soft]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={
          isOpen ? accordion.accessibilityLabelExpanded : accordion.accessibilityLabelCollapsed
        }>
        <View style={styles.headerIcon}>
          <Ionicons name="options-outline" size={18} color={eventDetail.tealDark} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{accordion.title}</Text>
            <View style={[styles.modeBadge, modeBadgeStyle]}>
              <Text
                style={[
                  styles.modeBadgeText,
                  accordion.modeBadge.tone === 'custom' && styles.modeBadgeTextCustom,
                ]}>
                {accordion.modeBadge.label}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {isOpen ? accordion.description : accordion.collapsedSubtitle}
          </Text>
          {!isOpen ? (
            <View style={styles.chipRow}>
              {accordion.summaryChips.map((chip) => (
                <View key={chip.label} style={styles.summaryChip}>
                  <Text style={styles.summaryChipText} numberOfLines={1}>
                    {chip.label}: {chip.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color={eventDetail.teal} />
        </Animated.View>
      </Pressable>

      {accordion.showResetAction && !isOpen ? (
        <Pressable
          onPress={onReset}
          style={styles.resetAction}
          accessibilityRole="button"
          accessibilityLabel={accordion.resetActionLabel ?? 'Standarta dön'}
          hitSlop={6}>
          <Text style={styles.resetActionText}>{accordion.resetActionLabel}</Text>
        </Pressable>
      ) : null}

      {isOpen ? (
        <Animated.View style={[styles.body, contentStyle]}>
          {accordion.showResetAction ? (
            <Pressable
              onPress={onReset}
              style={styles.resetInline}
              accessibilityRole="button"
              accessibilityLabel={accordion.resetActionLabel ?? 'Standarta dön'}>
              <Ionicons name="refresh-outline" size={14} color={eventDetail.tealDark} />
              <Text style={styles.resetInlineText}>{accordion.resetActionLabel}</Text>
            </Pressable>
          ) : null}
          {accordion.controls.map((control) => (
            <TuningControlRow
              key={control.key}
              control={control}
              value={values[control.key]}
              reducedMotion={reducedMotion}
              onChange={(value) => onValueChange(control.key, value)}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  headerPressed: {
    opacity: 0.96,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.10)',
    marginTop: 2,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeStandard: {
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
  },
  badgeCustom: {
    backgroundColor: 'rgba(217, 166, 70, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(217, 166, 70, 0.28)',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  modeBadgeTextCustom: {
    color: '#9E6E0D',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  summaryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 97, 0.06)',
    maxWidth: '100%',
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  resetAction: {
    alignSelf: 'flex-start',
    marginLeft: 60,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resetActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
    textDecorationLine: 'underline',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.06)',
  },
  resetInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  resetInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
});
