import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type {
  EventInspectLowerPresentation,
  InspectLowerActionKey,
  InspectLowerIconKey,
  InspectLowerTone,
} from '@/features/events/utils/eventInspectLowerPresentation';
import { CreviaMotionView } from '@/shared/motion';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  lower: EventInspectLowerPresentation;
  reducedMotion?: boolean;
  onSignalPress?: (signalId: string) => void;
  onEvidencePress?: (evidenceId: string) => void;
  onRiskPress?: (riskId: string) => void;
  onActionPress?: (actionKey: InspectLowerActionKey) => void;
};

function toneColor(tone: InspectLowerTone): string {
  switch (tone) {
    case 'positive':
      return eventDetail.teal;
    case 'warning':
    case 'critical':
      return '#D9A646';
    case 'mixed':
      return '#B77713';
    default:
      return eventDetail.tealDark;
  }
}

function tonePillStyle(tone: InspectLowerTone) {
  const color = toneColor(tone);
  return {
    backgroundColor: `${color}18`,
    borderColor: `${color}33`,
    color,
  };
}

function iconName(key: InspectLowerIconKey): keyof typeof Ionicons.glyphMap {
  return key as keyof typeof Ionicons.glyphMap;
}

export function EventInspectLowerSections({
  lower,
  reducedMotion = false,
  onSignalPress,
  onEvidencePress,
  onRiskPress,
  onActionPress,
}: Props) {
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  return (
    <View style={styles.wrap}>
      <CreviaMotionView motionKind="card_enter" surface="shared" index={3} style={styles.section}>
        <View style={[styles.sectionCard, shadows.soft]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{lower.signalAnalysis.title}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{lower.signalAnalysis.countLabel}</Text>
            </View>
          </View>
          <View style={styles.stack}>
            {lower.signalAnalysis.items.map((item, index) => {
              const pill = tonePillStyle(item.tone);
              const expanded = expandedSignalId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setExpandedSignalId((current) => (current === item.id ? null : item.id));
                    onSignalPress?.(item.id);
                  }}
                  style={({ pressed }) => [
                    styles.signalRow,
                    index > 0 && styles.signalRowBorder,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button">
                  <View style={[styles.rowIcon, { backgroundColor: `${pill.color}14` }]}>
                    <Ionicons name={iconName(item.iconKey)} size={16} color={pill.color} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowDescription} numberOfLines={expanded ? 2 : 1}>
                      {item.description}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: pill.backgroundColor, borderColor: pill.borderColor }]}>
                    <Text style={[styles.statusPillText, { color: pill.color }]} numberOfLines={1}>
                      {item.statusLabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={eventDetail.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </CreviaMotionView>

      <CreviaMotionView motionKind="card_enter" surface="shared" index={4} style={styles.section}>
        <View style={[styles.sectionCard, shadows.soft]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{lower.evidenceSources.title}</Text>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedPillText}>{lower.evidenceSources.statusLabel}</Text>
            </View>
          </View>
          <View style={styles.stack}>
            {lower.evidenceSources.items.map((item, index) => {
              const pill = tonePillStyle(item.tone);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onEvidencePress?.(item.id)}
                  style={({ pressed }) => [
                    styles.evidenceRow,
                    index > 0 && styles.signalRowBorder,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button">
                  <View style={[styles.checkIcon, item.verified && styles.checkIconVerified]}>
                    <Ionicons
                      name={item.verified ? 'checkmark' : 'ellipse-outline'}
                      size={item.verified ? 12 : 10}
                      color={item.verified ? '#FFFFFF' : eventDetail.teal}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                  <Text style={[styles.evidenceStatus, { color: pill.color }]} numberOfLines={1}>
                    {item.statusLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </CreviaMotionView>

      <CreviaMotionView motionKind="card_enter" surface="shared" index={5} style={styles.section}>
        <View style={styles.sectionHeaderInline}>
          <Text style={styles.sectionTitle}>{lower.riskPreview.title}</Text>
          <View
            style={[
              styles.tonePill,
              {
                backgroundColor: tonePillStyle(
                  lower.riskPreview.toneLabel === 'Yüksek'
                    ? 'warning'
                    : lower.riskPreview.toneLabel === 'Orta'
                      ? 'mixed'
                      : 'neutral',
                ).backgroundColor,
                borderColor: tonePillStyle(
                  lower.riskPreview.toneLabel === 'Yüksek'
                    ? 'warning'
                    : lower.riskPreview.toneLabel === 'Orta'
                      ? 'mixed'
                      : 'neutral',
                ).borderColor,
              },
            ]}>
            <Text
              style={[
                styles.tonePillText,
                {
                  color: toneColor(
                    lower.riskPreview.toneLabel === 'Yüksek'
                      ? 'warning'
                      : lower.riskPreview.toneLabel === 'Orta'
                        ? 'mixed'
                        : 'neutral',
                  ),
                },
              ]}>
              {lower.riskPreview.toneLabel}
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.riskScroll}>
          {lower.riskPreview.items.map((item, index) => {
            const accent = toneColor(item.tone);
            return (
              <Pressable
                key={item.id}
                onPress={() => onRiskPress?.(item.id)}
                style={({ pressed }) => [styles.riskCard, pressed && styles.pressed]}
                accessibilityRole="button">
                <Ionicons name={iconName(item.iconKey)} size={18} color={accent} />
                <Text style={styles.riskCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.riskCardValue, { color: accent }]} numberOfLines={1}>
                  {item.valueLabel}
                </Text>
                <Text style={styles.riskCardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.riskGaugeTrack}>
                  <View
                    style={[
                      styles.riskGaugeFill,
                      { width: `${item.indicator}%`, backgroundColor: accent },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </CreviaMotionView>

      <CreviaMotionView motionKind="card_enter" surface="shared" index={6} style={styles.section}>
        <Text style={styles.sectionTitle}>{lower.neighborhoodVoices.title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.voiceScroll}>
          {lower.neighborhoodVoices.items.map((item) => {
            const accent = toneColor(item.tone);
            return (
              <View key={item.id} style={[styles.voiceCard, shadows.soft]}>
                <View style={styles.voiceHeader}>
                  <Ionicons name={iconName(item.iconKey)} size={14} color={accent} />
                  <Text style={[styles.voiceSource, { color: accent }]} numberOfLines={1}>
                    {item.sourceLabel}
                  </Text>
                </View>
                <Text style={styles.voiceQuote} numberOfLines={2}>
                  “{item.quote}”
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </CreviaMotionView>

      <CreviaMotionView motionKind="line_appear" surface="shared" index={7} reducedMotion={reducedMotion} style={styles.section}>
        <View style={[styles.advisorCard, shadows.soft]}>
          <View style={styles.advisorIcon}>
            <Ionicons name={iconName(lower.advisor.iconKey)} size={16} color="#F5C76A" />
          </View>
          <View style={styles.advisorCopy}>
            <View style={styles.advisorHeader}>
              <Text style={styles.advisorTitle}>{lower.advisor.title}</Text>
              <View style={[styles.advisorPill, tonePillStyle(lower.advisor.tone)]}>
                <Text style={[styles.advisorPillText, { color: toneColor(lower.advisor.tone) }]}>
                  {lower.advisor.toneLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.advisorMessage} numberOfLines={2}>
              {lower.advisor.message}
            </Text>
          </View>
        </View>
      </CreviaMotionView>

      <CreviaMotionView motionKind="card_enter" surface="shared" index={8} style={styles.section}>
        <Text style={styles.sectionTitle}>İnceleme Aksiyonları</Text>
        <View style={styles.actionGrid}>
          {lower.actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onActionPress?.(action.actionKey)}
              style={({ pressed }) => [styles.actionTile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}>
              <View style={styles.actionTileIcon}>
                <Ionicons name={iconName(action.iconKey)} size={20} color={eventDetail.tealDark} />
              </View>
              <Text style={styles.actionTileLabel} numberOfLines={2}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </CreviaMotionView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.08)',
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: eventDetail.tealDark,
    letterSpacing: -0.2,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  verifiedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.teal,
  },
  stack: {
    gap: 0,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  signalRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(11, 107, 97, 0.08)',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  rowDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 107, 97, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkIconVerified: {
    backgroundColor: eventDetail.teal,
    borderColor: eventDetail.teal,
  },
  evidenceStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  tonePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  tonePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  riskScroll: {
    gap: 10,
    paddingRight: 4,
  },
  riskCard: {
    width: 132,
    minHeight: 148,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: eventDetail.tealDark,
  },
  riskCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  riskCardValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  riskCardDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 16,
    flex: 1,
  },
  riskGaugeTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    marginTop: 4,
  },
  riskGaugeFill: {
    height: '100%',
    borderRadius: 999,
  },
  voiceScroll: {
    gap: 10,
    paddingTop: 10,
    paddingRight: 4,
  },
  voiceCard: {
    width: 196,
    minHeight: 88,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.08)',
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceSource: {
    fontSize: 12,
    fontWeight: '800',
  },
  voiceQuote: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 18,
  },
  advisorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: eventDetail.tealDark,
  },
  advisorIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 199, 106, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 199, 106, 0.28)',
  },
  advisorCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  advisorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F5C76A',
  },
  advisorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  advisorPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  advisorMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  actionTile: {
    width: '47%',
    minHeight: 78,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.1)',
  },
  actionTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.06)',
  },
  actionTileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.tealDark,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.88,
  },
});
