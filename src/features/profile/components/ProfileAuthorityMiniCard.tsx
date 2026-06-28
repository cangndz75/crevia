import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileAuthorityMiniCardProps = {
  authorityMini: ProfileReferenceViewModel['authorityMini'];
  onDetailsPress?: () => void;
};

function AuthorityProgressRing({ percent, size = 66 }: { percent: number; size?: number }) {
  const strokeWidth = 5;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const offset = circumference * (1 - safePercent / 100);

  return (
    <View style={[ringStyles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke="rgba(14, 79, 71, 0.12)"
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
      <Text style={ringStyles.label}>%{safePercent}</Text>
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
    fontSize: 13,
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
      <View style={styles.headBand}>
        <Ionicons name="shield-checkmark" size={15} color="#F6D784" />
        <Text style={styles.title} numberOfLines={1}>
          {PROFILE_UI_COPY.authorityTitle}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel} numberOfLines={1}>
          {PROFILE_UI_COPY.nextEvaluation}
        </Text>

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
          <Text style={styles.footerText} numberOfLines={1}>
            {PROFILE_UI_COPY.seeDetails}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={PROFILE_REFERENCE_THEME.teal} />
        </Pressable>
      </View>
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
    overflow: 'hidden',
    minHeight: 158,
  },
  headBand: {
    minHeight: 34,
    backgroundColor: PROFILE_REFERENCE_THEME.tealDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  body: {
    padding: spacing.sm,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textSecondary,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minWidth: 0,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nextRank: {
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    lineHeight: 15,
  },
  remaining: {
    fontSize: 10,
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    lineHeight: 13,
  },
  footerLink: {
    minHeight: 24,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
  },
});
