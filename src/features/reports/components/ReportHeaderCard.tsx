import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ReportHeaderModel } from '@/features/reports/presentation/reportScreenPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  model: ReportHeaderModel;
};

export function ReportHeaderCard({ model }: Props) {
  const xpRatio = Math.min(1, Math.max(0, model.xpProgress / 100));

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.topRow}>
        <HeaderAvatar size={52} level={model.level} showLevelBadge={false} />

        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <View style={styles.levelChip}>
            <Ionicons name="star" size={11} color={colors.hubGoldDark} />
            <Text style={styles.levelChipText} numberOfLines={1}>
              {model.levelLabel}
            </Text>
          </View>
          <Text style={styles.metaLine} numberOfLines={1}>
            {model.metaLine}
          </Text>
        </View>

        <View style={styles.resourceCard}>
          <View style={styles.resourceCopy}>
            <Text style={styles.resourceValue} numberOfLines={1}>
              {model.resourceValue}
            </Text>
            <Text style={styles.resourceLabel} numberOfLines={1}>
              {model.resourceLabel}
            </Text>
          </View>
          <View style={styles.gemCircle}>
            <CreviaAssetImage
              source={creviaAssets.icons.premium.diamondGold}
              containerStyle={styles.gemAsset}
              contentFit="contain"
            />
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.xpRow}>
        <View style={styles.xpLabelRow}>
          <Ionicons name="star" size={12} color={colors.hubGoldDark} />
          <Text style={styles.xpLabel}>XP</Text>
        </View>
        <View style={styles.xpTrack}>
          <LinearGradient
            colors={[colors.primary, '#5ECFB8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.xpFill, { width: `${Math.round(xpRatio * 100)}%` }]}
          />
        </View>
        <Text style={styles.xpCount} numberOfLines={1}>
          {model.xpCurrent}/{model.xpTarget}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    gap: 14,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.headerTealDark,
    letterSpacing: -0.4,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.hubGoldMuted,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,183,49,0.3)',
  },
  levelChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  metaLine: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.headerTealDark,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 118,
    flexShrink: 0,
  },
  resourceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  resourceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  resourceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  gemCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gemAsset: {
    width: 20,
    height: 20,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  xpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  xpTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.hubGoldTrack,
    overflow: 'hidden',
    minWidth: 0,
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpCount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.headerTealDark,
    flexShrink: 0,
    minWidth: 52,
    textAlign: 'right',
  },
});
