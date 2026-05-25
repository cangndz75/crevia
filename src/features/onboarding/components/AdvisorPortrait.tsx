import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { ADVISOR } from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type AdvisorPortraitProps = {
  size?: 'sm' | 'md' | 'lg';
  showCaption?: boolean;
};

export function AdvisorPortrait({
  size = 'md',
  showCaption = true,
}: AdvisorPortraitProps) {
  const sizeMap = { sm: 48, md: 64, lg: 88 };
  const dim = sizeMap[size];
  const borderWidth = size === 'lg' ? 3 : 2;
  const fontSize = size === 'lg' ? 28 : size === 'md' ? 20 : 16;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            width: dim + borderWidth * 2 + 4,
            height: dim + borderWidth * 2 + 4,
            borderRadius: (dim + borderWidth * 2 + 4) / 2,
            borderWidth,
          },
        ]}>
        <View
          style={[
            styles.portrait,
            {
              width: dim,
              height: dim,
              borderRadius: dim / 2,
            },
          ]}>
          <Text style={[styles.initials, { fontSize }]}>
            {ADVISOR.initials}
          </Text>
          <View style={styles.statusDot} />
        </View>
      </View>
      {showCaption ? (
        <View style={styles.caption}>
          <Text style={styles.name}>{ADVISOR.name}</Text>
          <View style={styles.roleRow}>
            <Ionicons name="shield-checkmark" size={12} color={colors.authority} />
            <Text style={styles.role}>{ADVISOR.role}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  ring: {
    borderColor: colors.authority,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.authority,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  portrait: {
    backgroundColor: '#E8E0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
    color: colors.authority,
    letterSpacing: 1,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  caption: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.subtitle,
    fontSize: 15,
  },
  role: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.authority,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
