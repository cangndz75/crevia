import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CreviaMotionView } from '@/shared/motion';
import type {
  CliffhangerChipTone,
  CliffhangerRiskLevel,
  EndDayCliffhangerPresentation,
} from '@/features/reports/utils/endDayCliffhangerPresentation';
import { shadows } from '@/ui/theme/shadows';

type IconName = ComponentProps<typeof Ionicons>['name'];

const CHIP_TONE: Record<CliffhangerChipTone, { color: string; bg: string; border: string }> = {
  positive: { color: '#2A7A5E', bg: 'rgba(62, 158, 106, 0.10)', border: 'rgba(62, 158, 106, 0.22)' },
  neutral: { color: '#0B6B61', bg: 'rgba(11, 107, 97, 0.08)', border: 'rgba(11, 107, 97, 0.16)' },
  warning: { color: '#B77713', bg: 'rgba(199, 137, 37, 0.12)', border: 'rgba(199, 137, 37, 0.24)' },
  mixed: { color: '#3D6A66', bg: 'rgba(61, 106, 102, 0.10)', border: 'rgba(61, 106, 102, 0.18)' },
};

const RISK_TONE: Record<CliffhangerRiskLevel, { color: string; bg: string; border: string }> = {
  low: { color: '#2A7A5E', bg: '#F4FBF8', border: 'rgba(42, 122, 94, 0.18)' },
  medium: { color: '#0B6B61', bg: '#F7FBFA', border: 'rgba(11, 107, 97, 0.16)' },
  high: { color: '#B77713', bg: '#FFF8ED', border: 'rgba(183, 119, 19, 0.22)' },
  critical: { color: '#B84A35', bg: '#FFF5F2', border: 'rgba(184, 74, 53, 0.24)' },
};

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'people-outline': 'people-outline',
    'wallet-outline': 'wallet-outline',
    'chatbubbles-outline': 'chatbubbles-outline',
    'location-outline': 'location-outline',
    'alert-circle-outline': 'alert-circle-outline',
    'time-outline': 'time-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

type Props = {
  model: EndDayCliffhangerPresentation;
  reducedMotion?: boolean;
};

export function ReportEndDayCliffhangerSection({ model, reducedMotion = false }: Props) {
  if (!model.visible) return null;

  const riskStyle = RISK_TONE[model.tomorrowRisk.tone];

  return (
    <View style={styles.wrap}>
      <CreviaMotionView
        motionKind="card_enter"
        surface="report"
        index={0}
        reducedMotion={reducedMotion}
        style={[styles.bridgeCard, shadows.soft]}>
        <Text style={styles.sectionEyebrow}>{model.closingBridge.title}</Text>
        <Text style={styles.bridgeSummary} numberOfLines={3}>
          {model.closingBridge.summary}
        </Text>
        <View style={styles.chipRow}>
          {model.closingBridge.chips.map((chip) => {
            const tone = CHIP_TONE[chip.tone];
            return (
              <View
                key={chip.label}
                style={[styles.chip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.chipLabel, { color: tone.color }]} numberOfLines={1}>
                  {chip.label}
                </Text>
                <Text style={[styles.chipValue, { color: tone.color }]} numberOfLines={1}>
                  {chip.value}
                </Text>
              </View>
            );
          })}
        </View>
      </CreviaMotionView>

      <CreviaMotionView
        motionKind="card_enter"
        surface="report"
        index={1}
        reducedMotion={reducedMotion}
        style={[
          styles.riskCard,
          shadows.soft,
          { backgroundColor: riskStyle.bg, borderColor: riskStyle.border },
        ]}>
        <View style={styles.riskHeader}>
          <Text style={[styles.riskTitle, { color: riskStyle.color }]} numberOfLines={1}>
            {model.tomorrowRisk.title}
          </Text>
          <View style={[styles.riskPill, { backgroundColor: `${riskStyle.color}18` }]}>
            <Text style={[styles.riskPillText, { color: riskStyle.color }]} numberOfLines={1}>
              {model.tomorrowRisk.riskLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.riskDescription} numberOfLines={3}>
          {model.tomorrowRisk.description}
        </Text>
        <View style={styles.reasonRow}>
          {model.tomorrowRisk.reasons.map((reason) => {
            const tone = CHIP_TONE[reason.tone];
            return (
              <View
                key={reason.label}
                style={[styles.reasonChip, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.reasonChipText, { color: tone.color }]} numberOfLines={1}>
                  {reason.label}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.suggestedFocus, { color: riskStyle.color }]} numberOfLines={2}>
          {model.tomorrowRisk.suggestedFocus}
        </Text>
      </CreviaMotionView>

      <CreviaMotionView
        motionKind="card_enter"
        surface="report"
        index={2}
        reducedMotion={reducedMotion}
        style={[styles.districtCard, shadows.soft]}>
        <Text style={styles.sectionEyebrow}>{model.districtWatch.title}</Text>
        {model.districtWatch.districts.map((district) => {
          const tone = CHIP_TONE[district.tone];
          return (
            <View key={district.districtName} style={styles.districtRow}>
              <View style={[styles.districtIcon, { backgroundColor: tone.bg }]}>
                <Ionicons name="location-outline" size={15} color={tone.color} />
              </View>
              <View style={styles.districtCopy}>
                <View style={styles.districtTitleRow}>
                  <Text style={styles.districtName} numberOfLines={1}>
                    {district.districtName}
                  </Text>
                  <View style={[styles.districtStatus, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.districtStatusText, { color: tone.color }]} numberOfLines={1}>
                      {district.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.districtDescription} numberOfLines={2}>
                  {district.description}
                </Text>
              </View>
            </View>
          );
        })}
      </CreviaMotionView>

      <CreviaMotionView
        motionKind="card_enter"
        surface="report"
        index={3}
        reducedMotion={reducedMotion}
        style={[styles.pressureCard, shadows.soft]}>
        <Text style={styles.sectionEyebrow}>{model.carriedPressures.title}</Text>
        <View style={styles.pressureGrid}>
          {model.carriedPressures.items.map((item) => {
            const tone = CHIP_TONE[item.tone];
            return (
              <View key={item.id} style={[styles.pressureItem, { borderColor: tone.border }]}>
                <Ionicons name={resolveIcon(item.iconKey)} size={14} color={tone.color} />
                <Text style={styles.pressureLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.pressureValue, { color: tone.color }]} numberOfLines={1}>
                  {item.value}
                </Text>
                <Text style={styles.pressureDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            );
          })}
        </View>
      </CreviaMotionView>

      <CreviaMotionView
        motionKind="card_enter"
        surface="report"
        index={4}
        reducedMotion={reducedMotion}
        style={[styles.advisorCard, shadows.soft]}>
        <View style={styles.advisorHeader}>
          <View style={styles.advisorMonogram}>
            <Text style={styles.advisorMonogramText}>E</Text>
          </View>
          <Text style={styles.advisorTitle} numberOfLines={1}>
            {model.advisor.title}
          </Text>
          <View style={styles.advisorTonePill}>
            <Text style={styles.advisorToneText} numberOfLines={1}>
              {model.advisor.toneLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.advisorMessage} numberOfLines={2}>
          {model.advisor.message}
        </Text>
      </CreviaMotionView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    minWidth: 0,
    paddingTop: 4,
  },
  sectionEyebrow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#063F3B',
  },
  bridgeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.10)',
    backgroundColor: '#FFFDF7',
    padding: 14,
    gap: 8,
    minWidth: 0,
  },
  bridgeSummary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#4A5C58',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 1,
    minWidth: '47%',
    flexGrow: 1,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '900',
  },
  riskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    minWidth: 0,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  riskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    minWidth: 0,
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  riskPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  riskDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#2F4A47',
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reasonChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  suggestedFocus: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  districtCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
    minWidth: 0,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  districtIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  districtCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  districtTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  districtName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#102F2D',
    minWidth: 0,
  },
  districtStatus: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  districtStatusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  districtDescription: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#6B7D78',
  },
  pressureCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
    minWidth: 0,
  },
  pressureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pressureItem: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAFCFB',
    padding: 8,
    gap: 3,
    minHeight: 88,
  },
  pressureLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7D78',
  },
  pressureValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  pressureDescription: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: '#4A5C58',
  },
  advisorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.16)',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
    minWidth: 0,
  },
  advisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  advisorMonogram: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(11, 107, 97, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  advisorMonogramText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#063F3B',
  },
  advisorTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#063F3B',
    minWidth: 0,
  },
  advisorTonePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(216, 167, 46, 0.14)',
    flexShrink: 0,
  },
  advisorToneText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B77713',
  },
  advisorMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#102F2D',
  },
});
