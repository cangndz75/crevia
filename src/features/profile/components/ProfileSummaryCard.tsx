import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { hubAssets } from '@/features/hub/utils/hubAssets';
import type { ProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileSummaryCardProps = {
  summary: ProfileReferenceViewModel['summary'];
};

export function ProfileSummaryCard({ summary }: ProfileSummaryCardProps) {
  return (
    <LinearGradient
      colors={[...PROFILE_REFERENCE_THEME.summaryGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.soft]}>
      <View style={styles.glowOrb} />

      <View style={styles.topRow}>
        <View style={styles.head}>
          <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
          <Text style={styles.eyebrow}>{PROFILE_UI_COPY.profileSummaryTitle}</Text>
        </View>
        <Image
          source={hubAssets.day1Plan.heroBuilding}
          style={styles.buildingArt}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <Text style={styles.rankTitle} numberOfLines={2}>
        {summary.rankLabel}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {summary.subtitle}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons name="shield-outline" size={11} color="rgba(255,255,255,0.75)" />
            <Text style={styles.statLabel}>{PROFILE_UI_COPY.authorityTrust}</Text>
          </View>
          <Text style={styles.statValue}>{summary.authorityTrustValue}</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.statLabelRow}>
            <Ionicons name="shield-outline" size={11} color="rgba(255,255,255,0.75)" />
            <Text style={styles.statLabel}>{PROFILE_UI_COPY.remainingTrust}</Text>
          </View>
          <Text style={styles.statValue}>{summary.remainingTrustValue}</Text>
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
    gap: 8,
    minHeight: 148,
  },
  glowOrb: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.8,
  },
  buildingArt: {
    width: 88,
    height: 76,
    flexShrink: 0,
    marginTop: -8,
  },
  rankTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 24,
    maxWidth: '72%',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 17,
    maxWidth: '78%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: 4,
  },
  stat: {
    gap: 4,
    minWidth: 0,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
