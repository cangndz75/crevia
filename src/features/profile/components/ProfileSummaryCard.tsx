import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileSummaryCardProps = {
  summary: ProfileReferenceViewModel['summary'];
};

function MetricBox({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricBox}>
      <View style={styles.metricLabelRow}>
        <Ionicons name={icon} size={13} color="#D6C575" />
        <Text style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export function ProfileSummaryCard({ summary }: ProfileSummaryCardProps) {
  return (
    <LinearGradient
      colors={[PROFILE_REFERENCE_THEME.forest, PROFILE_REFERENCE_THEME.tealDark, PROFILE_REFERENCE_THEME.forestDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.82)" />
          <Text style={styles.eyebrow} numberOfLines={1}>
            {PROFILE_UI_COPY.profileSummaryTitle}
          </Text>
        </View>
        <Image
          source={creviaAssets.buildings.municipalHall3d}
          style={styles.buildingArt}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.rankTitle} numberOfLines={2}>
          {summary.rankLabel}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {summary.subtitle}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <MetricBox
          icon="shield-checkmark-outline"
          label={PROFILE_UI_COPY.authorityTrust}
          value={summary.authorityTrustValue}
        />
        <MetricBox
          icon="shield-outline"
          label={PROFILE_UI_COPY.remainingTrust}
          value={summary.remainingTrustValue}
        />
        <View style={styles.advantageBox}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="star" size={13} color="#F7D77B" />
            <Text style={styles.metricLabel} numberOfLines={1}>
              {summary.advantageLabel}
            </Text>
          </View>
          <View style={styles.advantageBody}>
            <Text style={styles.advantageTitle} numberOfLines={2}>
              {summary.advantageTitle}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.md,
    overflow: 'hidden',
    gap: 9,
    minHeight: 172,
  },
  head: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.86)',
    letterSpacing: 0,
  },
  buildingArt: {
    position: 'absolute',
    right: -4,
    top: -20,
    width: 132,
    height: 112,
  },
  copyBlock: {
    gap: 5,
    paddingRight: 116,
    minWidth: 0,
  },
  rankTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
    lineHeight: 25,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metricBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  metricLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  advantageBox: {
    flex: 1.05,
    minWidth: 0,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(247,215,123,0.2)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 9,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  advantageBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  advantageTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 13,
  },
});
