import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { AuthorityManagementCardModel } from '@/features/progression/utils/authorityPermissionsTabPresentation';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityManagementSummaryCardProps = {
  model: AuthorityManagementCardModel;
};

export function AuthorityManagementSummaryCard({ model }: AuthorityManagementSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.topRow}>
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={22} color={AUTHORITY_COLLECTION_THEME.tealDark} />
        </View>

        <View style={styles.copyCol}>
          <Text style={styles.title} numberOfLines={2}>
            {model.title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {model.description}
          </Text>
        </View>

        <Image
          source={hubAssets.day1Plan.heroBuilding}
          style={styles.buildingArt}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Açık Yetki</Text>
          <Text style={styles.metricValue}>{model.openAuthorityValue}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Toplam Etki</Text>
          <View style={styles.impactRow}>
            <Text style={styles.metricValue}>{model.impactValue}</Text>
            <Ionicons name="trending-up" size={14} color="#1A8F8A" />
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sıradaki Ödül</Text>
          <View style={styles.rewardRow}>
            <Image
              source={hubAssets.day1Plan.progressChest}
              style={styles.chestIcon}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.rewardValue} numberOfLines={1}>
              {model.nextRewardLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFEFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
  },
  shieldWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    lineHeight: 21,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    lineHeight: 17,
  },
  buildingArt: {
    width: 72,
    height: 64,
    flexShrink: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 30, 30, 0.06)',
    paddingTop: spacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(20, 30, 30, 0.08)',
    marginVertical: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    textAlign: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  chestIcon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  rewardValue: {
    fontSize: 11,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    flexShrink: 1,
  },
});
