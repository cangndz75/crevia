import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type WeeklyUnlockSectionHeaderProps = {
  daysLeft: number;
};

export function WeeklyUnlockSectionHeader({ daysLeft }: WeeklyUnlockSectionHeaderProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          Bu hafta açılabilecekler
        </Text>
      </View>
      <View style={styles.daysPill}>
        <Text style={styles.daysText} numberOfLines={1}>
          {daysLeft} gün kaldı
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AUTHORITY_COLLECTION_THEME.mintSoft,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    minHeight: 54,
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    flexShrink: 1,
  },
  daysPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    flexShrink: 0,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
