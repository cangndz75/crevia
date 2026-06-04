import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  buildProfileCareerShowcaseAnalyticsPayload,
  type NewSystemsAnalyticsContext,
} from '@/core/analytics/analyticsPayloadBuilders';
import {
  trackOncePerRuntime,
  trackProfileCareerShowcaseViewed,
} from '@/core/analytics/analyticsRuntime';
import type {
  CreviaProfileCareerSection,
  CreviaProfileCareerShowcaseModel,
  CreviaProfileCareerTone,
} from '@/core/profile/profileCareerShowcasePresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  model: CreviaProfileCareerShowcaseModel | null | undefined;
  analyticsContext?: NewSystemsAnalyticsContext;
};

const toneStyle: Record<
  CreviaProfileCareerTone,
  { bg: string; iconBg: string; icon: string; title: string }
> = {
  teal: {
    bg: '#F4FBF8',
    iconBg: 'rgba(26,143,138,0.14)',
    icon: colors.primary,
    title: colors.primary,
  },
  mint: {
    bg: '#F1FAF5',
    iconBg: 'rgba(43,181,168,0.14)',
    icon: '#158C82',
    title: colors.headerTealDark,
  },
  gold: {
    bg: colors.hubGoldMuted,
    iconBg: 'rgba(212,160,23,0.18)',
    icon: colors.hubGoldDark,
    title: colors.hubGoldDark,
  },
  neutral: {
    bg: colors.backgroundAlt,
    iconBg: 'rgba(24,59,58,0.08)',
    icon: colors.textSecondary,
    title: colors.textPrimary,
  },
};

function iconName(key: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    'ribbon-outline': 'ribbon-outline',
    'sparkles-outline': 'sparkles-outline',
    'grid-outline': 'grid-outline',
    'chatbubble-ellipses-outline': 'chatbubble-ellipses-outline',
    'map-outline': 'map-outline',
    'medal-outline': 'medal-outline',
  };
  return map[key] ?? 'ribbon-outline';
}

function MiniProgress({ value }: { value?: number }) {
  if (value == null) return null;
  const width = `${Math.min(100, Math.max(0, value))}%` as `${number}%`;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width }]} />
    </View>
  );
}

function ShowcaseSection({ section }: { section: CreviaProfileCareerSection }) {
  const tone = toneStyle[section.tone];
  return (
    <View style={[styles.section, { backgroundColor: tone.bg }]}>
      <View style={styles.sectionTop}>
        <View style={[styles.sectionIcon, { backgroundColor: tone.iconBg }]}>
          <Ionicons name={iconName(section.iconKey)} size={14} color={tone.icon} />
        </View>
        <View style={styles.sectionHeadCopy}>
          <Text style={[styles.sectionTitle, { color: tone.title }]} numberOfLines={1}>
            {section.title}
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {section.subtitle}
          </Text>
        </View>
      </View>

      <MiniProgress value={section.progressValue} />

      {section.lines.length > 0 ? (
        <Text style={styles.sectionLine} numberOfLines={2}>
          {section.lines[0]}
        </Text>
      ) : null}

      {section.chips.length > 0 ? (
        <View style={styles.chipRow}>
          {section.chips.slice(0, 4).map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ProfileCareerShowcaseCard({ model, analyticsContext }: Props) {
  useEffect(() => {
    if (!model?.visible || model.sections.length === 0) return;
    const day = analyticsContext?.day ?? 1;
    trackProfileCareerShowcaseViewed(
      `profile_career_showcase_viewed:${day}:${model.visibility.mode}`,
      buildProfileCareerShowcaseAnalyticsPayload(model, analyticsContext),
    );
    if (model.nextUnlockSummary.visible) {
      trackOncePerRuntime(
        `profile_next_unlock_viewed:${day}:${model.visibility.mode}`,
        'profile_next_unlock_viewed',
        buildProfileCareerShowcaseAnalyticsPayload(model, analyticsContext, {
          lineKind: 'next_unlock',
          count: model.nextUnlockSummary.chips.length,
        }),
      );
    }
    if (model.permissionShowcase.visible) {
      trackOncePerRuntime(
        `profile_permission_chip_viewed:${day}:${model.permissionShowcase.chips.length}`,
        'profile_permission_chip_viewed',
        buildProfileCareerShowcaseAnalyticsPayload(model, analyticsContext, {
          lineKind: 'permission_chip',
          count: model.permissionShowcase.chips.length,
        }),
      );
    }
    if (model.districtAchievementSummary.visible) {
      trackOncePerRuntime(
        `profile_district_achievement_viewed:${day}:${model.districtAchievementSummary.chips.length}`,
        'profile_district_achievement_viewed',
        buildProfileCareerShowcaseAnalyticsPayload(model, analyticsContext, {
          lineKind: 'district_achievement',
          count: model.districtAchievementSummary.chips.length,
        }),
      );
    }
  }, [analyticsContext, model]);

  if (!model?.visible || model.sections.length === 0) return null;

  return (
    <View style={[styles.card, shadows.soft]} accessibilityRole="summary">
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="trail-sign-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.headCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {model.subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.sections}>
        {model.sections.slice(0, 4).map((section) => (
          <ShowcaseSection key={section.id} section={section} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.12)',
    padding: spacing.md,
    gap: 12,
    minWidth: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  sections: {
    gap: 8,
    minWidth: 0,
  },
  section: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.08)',
    padding: 10,
    gap: 7,
    minWidth: 0,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  sectionIcon: {
    width: 27,
    height: 27,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sectionLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 0,
    flexShrink: 1,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(24,59,58,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  chip: {
    maxWidth: '48%',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.13)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
});
