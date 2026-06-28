import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MapDirectActionPresentation } from '@/core/mapDirectAction';
import { MapDirectActionRow } from '@/features/map/components/MapDirectActionRow';
import type {
  MapBottomPanelChip,
  MapBottomPanelPresentation,
  MapBottomPanelStatusTone,
} from '@/features/map/utils/mapGameplayPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

type MapCompactBottomPanelProps = {
  panel: MapBottomPanelPresentation;
  expanded: boolean;
  bottomOffset: number;
  leftInset?: number;
  reducedMotion?: boolean;
  onToggleExpand: () => void;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onDirectActionPress?: (action: MapDirectActionPresentation) => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

function statusPillColors(tone: MapBottomPanelStatusTone) {
  switch (tone) {
    case 'resolved':
      return {
        bg: 'rgba(64, 215, 176, 0.12)',
        border: 'rgba(64, 215, 176, 0.28)',
        dot: mapUi.teal,
      };
    case 'urgent':
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.24)',
        dot: mapUi.riskHigh,
      };
    case 'inspect':
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.26)',
        dot: mapUi.riskHigh,
      };
    case 'field':
      return {
        bg: 'rgba(20, 184, 166, 0.14)',
        border: mapUi.borderStrong,
        dot: mapUi.teal,
      };
    case 'opportunity':
      return {
        bg: 'rgba(216, 167, 46, 0.12)',
        border: mapUi.goldBorder,
        dot: mapUi.gold,
      };
    case 'active':
      return {
        bg: 'rgba(52, 211, 153, 0.12)',
        border: 'rgba(52, 211, 153, 0.24)',
        dot: mapUi.liveDot,
      };
    default:
      return {
        bg: 'rgba(255,255,255,0.05)',
        border: mapUi.border,
        dot: mapUi.textMuted,
      };
  }
}

function chipAccent(tone: MapBottomPanelChip['tone']) {
  switch (tone) {
    case 'risk':
      return mapUi.riskHigh;
    case 'status':
      return mapUi.teal;
    case 'crew':
      return mapUi.gold;
    default:
      return mapUi.textMuted;
  }
}

function socialEchoAccent(tone: NonNullable<MapBottomPanelPresentation['socialEcho']>['tone']) {
  switch (tone) {
    case 'positive':
      return mapUi.teal;
    case 'warning':
    case 'critical':
      return mapUi.riskHigh;
    case 'mixed':
      return mapUi.gold;
    default:
      return mapUi.textMuted;
  }
}

export function MapCompactBottomPanel({
  panel,
  expanded,
  bottomOffset,
  leftInset = mapUi.controlStackClearance,
  reducedMotion = false,
  onToggleExpand,
  onPrimaryPress,
  onSecondaryPress,
  onDirectActionPress,
  onPrevious,
  onNext,
}: MapCompactBottomPanelProps) {
  const showNav = onPrevious && onNext;
  const pillColors = statusPillColors(panel.statusTone);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const previousMarkerId = useRef(panel.markerId);

  useEffect(() => {
    if (previousMarkerId.current === panel.markerId) return;
    previousMarkerId.current = panel.markerId;

    if (reducedMotion) {
      contentOpacity.setValue(1);
      contentTranslateY.setValue(0);
      return;
    }

    contentOpacity.setValue(0.72);
    contentTranslateY.setValue(6);
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY, panel.markerId, reducedMotion]);

  return (
    <View style={[styles.shell, { bottom: bottomOffset, left: leftInset }]}>
      <View style={styles.panel}>
        <View style={styles.topAccent} />
        <View style={styles.grabberWrap}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {showNav ? (
              <Pressable
                onPress={onPrevious}
                hitSlop={8}
                style={({ pressed }) => [styles.ghostIcon, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Önceki olay">
                <Ionicons name="chevron-back" size={16} color={mapUi.textMuted} />
              </Pressable>
            ) : null}
            <Text style={styles.navLabel} numberOfLines={1}>
              {panel.navLabel}
            </Text>
            {showNav ? (
              <Pressable
                onPress={onNext}
                hitSlop={8}
                style={({ pressed }) => [styles.ghostIcon, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Sonraki olay">
                <Ionicons name="chevron-forward" size={16} color={mapUi.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.pillRow}>
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText} numberOfLines={1}>
                {panel.sourcePillLabel}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: pillColors.bg, borderColor: pillColors.border }]}>
              <View style={[styles.statusDot, { backgroundColor: pillColors.dot }]} />
              <Text style={styles.statusText} numberOfLines={1}>
                {panel.statusLabel}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onToggleExpand}
            hitSlop={8}
            style={({ pressed }) => [styles.ghostIcon, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Paneli daralt' : 'Paneli genişlet'}>
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-up'}
              size={16}
              color={mapUi.textMuted}
            />
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}>
          <Text style={styles.title} numberOfLines={2}>
            {panel.title}
          </Text>
          <Text style={styles.contextLine} numberOfLines={1}>
            {panel.contextLine}
          </Text>
          {panel.tacticalMicroLine ? (
            <Text style={styles.tacticalMicroLine} numberOfLines={1}>
              {panel.tacticalMicroLine}
            </Text>
          ) : null}
          {panel.layerHintLine ? (
            <Text style={styles.layerHintLine} numberOfLines={1}>
              {panel.layerHintLine}
            </Text>
          ) : null}
          <Text style={styles.summary} numberOfLines={expanded ? 3 : 2}>
            {panel.summaryLine}
          </Text>

          {panel.socialEcho ? (
            <View style={styles.socialEchoRow}>
              <View style={[styles.socialEchoDot, { backgroundColor: socialEchoAccent(panel.socialEcho.tone) }]} />
              <Text style={styles.socialEchoTitle} numberOfLines={1}>
                {panel.socialEcho.title}
              </Text>
              <Text style={styles.socialEchoText} numberOfLines={1}>
                {panel.socialEcho.message}
              </Text>
            </View>
          ) : null}

          <View style={styles.chipRow}>
            {panel.chips.map((chip) => (
              <View key={chip.key} style={styles.chip}>
                <View style={[styles.chipDot, { backgroundColor: chipAccent(chip.tone) }]} />
                <View style={styles.chipCopy}>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                  <Text style={styles.chipValue} numberOfLines={1}>
                    {chip.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {expanded && panel.secondaryActionLabel && !panel.actionBundle?.secondaryActions.length ? (
            <Pressable
              onPress={onSecondaryPress}
              style={({ pressed }) => [styles.secondaryPill, pressed && styles.pressed]}
              accessibilityRole="button">
              <Ionicons name="layers-outline" size={13} color={mapUi.textSoft} />
              <Text style={styles.secondaryPillText}>{panel.secondaryActionLabel}</Text>
            </Pressable>
          ) : null}

          {panel.actionBundle && onDirectActionPress ? (
            <MapDirectActionRow
              bundle={{
                ...panel.actionBundle,
                primaryAction: undefined,
                chips: panel.actionBundle.chips,
                secondaryActions: panel.actionBundle.secondaryActions,
              }}
              compact
              reducedMotion={reducedMotion}
              onActionPress={onDirectActionPress}
            />
          ) : null}

          {expanded ? (
            <View style={styles.expandedBlock}>
              {panel.expandedLines.map((line) => (
                <Text key={line} style={styles.expandedLine} numberOfLines={2}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.footerContext}>
            <Text style={styles.footerLabel}>{panel.footerContextLabel}</Text>
            <Text style={styles.footerValue} numberOfLines={2}>
              {panel.footerContextValue}
            </Text>
          </View>

          <CreviaAnimatedPressable
            onPress={onPrimaryPress}
            reducedMotion={reducedMotion}
            pressScale={0.975}
            accessibilityRole="button"
            accessibilityLabel={panel.primaryActionLabel}
            style={styles.ctaWrap}>
            <LinearGradient
              colors={
                panel.actionBundle?.primaryAction
                  ? ['#0F766E', '#0D9488', '#14B8A6']
                  : ['#F0C14B', '#D8A72E', '#B8860B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}>
              <Text
                style={[
                  styles.ctaText,
                  panel.actionBundle?.primaryAction ? styles.ctaTextTeal : null,
                ]}
                numberOfLines={1}>
                {panel.primaryActionLabel}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={panel.actionBundle?.primaryAction ? '#ECFDF5' : '#0D3D38'}
              />
            </LinearGradient>
          </CreviaAnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    right: 16,
    zIndex: 24,
    maxHeight: 280,
  },
  panel: {
    borderRadius: 24,
    backgroundColor: mapUi.panel,
    borderWidth: 1,
    borderColor: mapUi.borderStrong,
    overflow: 'hidden',
    ...mapUi.panelShadow,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(216, 167, 46, 0.42)',
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    color: mapUi.textSoft,
    letterSpacing: 0.2,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  sourcePill: {
    maxWidth: 92,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(216, 167, 46, 0.1)',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: mapUi.gold,
    letterSpacing: 0.15,
  },
  ghostIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    maxWidth: 88,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.textLight,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: mapUi.textLight,
    lineHeight: 22,
  },
  contextLine: {
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.teal,
    lineHeight: 17,
  },
  tacticalMicroLine: {
    fontSize: 12,
    fontWeight: '700',
    color: mapUi.gold,
    lineHeight: 16,
  },
  layerHintLine: {
    fontSize: 12,
    fontWeight: '600',
    color: mapUi.textSoft,
    lineHeight: 16,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: mapUi.textMuted,
  },
  socialEchoRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(20,184,166,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.14)',
    minWidth: 0,
  },
  socialEchoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  socialEchoTitle: {
    maxWidth: 92,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: mapUi.textSoft,
    flexShrink: 0,
  },
  socialEchoText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: mapUi.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  chipCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: mapUi.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: mapUi.textSoft,
  },
  secondaryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: mapUi.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: mapUi.textSoft,
  },
  expandedBlock: {
    gap: 4,
    paddingTop: 2,
  },
  expandedLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: mapUi.textSoft,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  footerContext: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: 4,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: mapUi.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.textSoft,
    lineHeight: 17,
  },
  ctaWrap: {
    minWidth: 148,
    maxWidth: '52%',
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
  },
  ctaBtn: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#0D3D38',
    letterSpacing: 0.15,
  },
  ctaTextTeal: {
    color: '#ECFDF5',
  },
  pressed: {
    opacity: 0.88,
  },
});
