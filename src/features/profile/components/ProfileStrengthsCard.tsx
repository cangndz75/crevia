import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileStrengthItem } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileStrengthsCardProps = {
  strengths: ProfileStrengthItem[];
  onSeeAllPress?: () => void;
};

function SegmentBar({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={barStyles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            barStyles.segment,
            index < filled ? barStyles.segmentFilled : barStyles.segmentEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 2,
    maxWidth: 10,
  },
  segmentFilled: {
    backgroundColor: PROFILE_REFERENCE_THEME.teal,
  },
  segmentEmpty: {
    backgroundColor: 'rgba(26, 143, 138, 0.12)',
  },
});

export function ProfileStrengthsCard({ strengths, onSeeAllPress }: ProfileStrengthsCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <Ionicons name="star" size={15} color={PROFILE_REFERENCE_THEME.goldDark} />
        <Text style={styles.title} numberOfLines={1}>
          {PROFILE_UI_COPY.strengthsTitle}
        </Text>
      </View>

      <View style={styles.list}>
        {strengths.map((item) => (
          <View key={item.id} style={styles.row}>
            <Ionicons
              name={item.iconKey}
              size={14}
              color={PROFILE_REFERENCE_THEME.teal}
              style={styles.rowIcon}
            />
            <Text style={styles.rowLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <SegmentBar filled={item.filledSegments} total={item.totalSegments} />
          </View>
        ))}
      </View>

      <Pressable
        onPress={onSeeAllPress}
        style={styles.footerLink}
        accessibilityRole="button"
        accessibilityLabel="Tüm güçlü yönleri gör">
        <Text style={styles.footerText} numberOfLines={1}>
          {PROFILE_UI_COPY.seeAll}
        </Text>
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
    borderColor: 'rgba(168, 140, 59, 0.18)',
    padding: spacing.sm,
    gap: 9,
    minHeight: 158,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 24,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    letterSpacing: 0,
  },
  list: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  rowIcon: {
    flexShrink: 0,
  },
  rowLabel: {
    width: 72,
    fontSize: 10,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    flexShrink: 0,
  },
  footerLink: {
    minHeight: 24,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
  },
});
