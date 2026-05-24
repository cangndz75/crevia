import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function EventDecisionConsultant() {
  const advisor = mockGameData.eventAdvisor;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.secondary} />
        </View>
        <Text style={styles.title}>Danışman Notu</Text>
        <View style={styles.token}>
          <Ionicons name="logo-bitcoin" size={12} color={colors.xpGold} />
          <Text style={styles.tokenText}>{advisor.tokenCost} Token</Text>
        </View>
      </View>
      <Text style={styles.body}>{advisor.body}</Text>
      <Text style={styles.attr}>{advisor.attribution}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#F0F4FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
  },
  token: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.xpGold,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  attr: {
    ...typography.caption,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
});
