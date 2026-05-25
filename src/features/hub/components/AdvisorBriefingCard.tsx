import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveAdvisorBriefing } from '@/features/hub/utils/hubDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function AdvisorBriefingCard() {
  const input = useHubDerivedInput();

  const { body, attribution } = useMemo(
    () => deriveAdvisorBriefing(input),
    [input],
  );

  return (
    <Animated.View
      entering={FadeInLeft.duration(500).delay(100)}
      style={[styles.card, shadows.card]}
    >
      <View style={styles.accentStripe} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>DE</Text>
          </View>
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Deniz Erdem</Text>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={colors.authority}
              />
            </View>
            <Text style={styles.role}>Kentsel Operasyon Danışmanı</Text>
          </View>
        </View>

        <Text style={styles.body}>{body}</Text>

        <Text style={styles.attribution}>— {attribution}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStripe: {
    width: 4,
    backgroundColor: colors.authority,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.authorityMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.authority,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.authority,
  },
  role: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  attribution: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
});
