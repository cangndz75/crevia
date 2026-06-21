import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileAuthorityMiniCardProps = {
  authorityMini: ProfileReferenceViewModel['authorityMini'];
  onDetailsPress?: () => void;
};

function AuthorityProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const strokeWidth = 5;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke="rgba(26, 143, 138, 0.14)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={PROFILE_REFERENCE_THEME.teal}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={ringStyles.label}>%{Math.round(percent)}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.tealDark,
  },
});

export function ProfileAuthorityMiniCard({
  authorityMini,
  onDetailsPress,
}: ProfileAuthorityMiniCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <Ionicons name="shield-checkmark-outline" size={14} color={PROFILE_REFERENCE_THEME.teal} />
        <Text style={styles.title}>{PROFILE_UI_COPY.authorityTitle}</Text>
      </View>

      <Text style={styles.sectionLabel}>{PROFILE_UI_COPY.nextEvaluation}</Text>

      <View style={styles.bodyRow}>
        <AuthorityProgressRing percent={authorityMini.progressPercent} />
        <View style={styles.copyCol}>
          <Text style={styles.nextRank} numberOfLines={2}>
            {authorityMini.nextRankLabel}
          </Text>
          <Text style={styles.remaining} numberOfLines={2}>
            {authorityMini.remainingTrustLabel}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onDetailsPress}
        style={styles.footerLink}
        accessibilityRole="button"
        accessibilityLabel="Yetki detaylarını gör">
        <Text style={styles.footerText}>{PROFILE_UI_COPY.seeDetails}</Text>
        <Ionicons name="chevron-forward" size={12} color={PROFILE_REFERENCE_THEME.teal} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: PROFILE_REFERENCE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PROFILE_REFERENCE_THEME.cardBorder,
    padding: spacing.sm,
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PROFILE_REFERENCE_THEME.textSecondary,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nextRank: {
    fontSize: 12,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    lineHeight: 16,
  },
  remaining: {
    fontSize: 10,
    fontWeight: '600',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    lineHeight: 14,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.teal,
  },
});
