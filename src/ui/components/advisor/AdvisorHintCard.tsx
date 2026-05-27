import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AdvisorHintCardProps = {
  title?: string;
  body?: string;
};

const DEFAULT_TITLE = 'Danışman Notu';
const DEFAULT_BODY =
  'Bu kararda risk ve bütçe dengesini birlikte düşün.';

/**
 * Statik danışman placeholder — ileride danışman motoruna bağlanacak.
 */
export function AdvisorHintCard({
  title = DEFAULT_TITLE,
  body = DEFAULT_BODY,
}: AdvisorHintCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="bulb-outline" size={18} color={colors.xpGold} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.xpGold}55`,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.xpGold}66`,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
