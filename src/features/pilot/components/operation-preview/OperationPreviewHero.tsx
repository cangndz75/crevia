import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { OperationPreviewHeroRow } from '@/features/pilot/hooks/useOperationPreviewState';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { GameCard } from '@/ui/components/GameCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type OperationPreviewHeroProps = {
  districtImage: ImageSource;
  statusRows: OperationPreviewHeroRow[];
  mainOperationLocked: boolean;
};

function HeroStatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'locked' | 'pending';
}) {
  const valueColor =
    tone === 'success'
      ? colors.success
      : tone === 'pending'
        ? colors.hubGoldDark
        : colors.textSecondary;

  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusPillLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statusPillValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function OperationPreviewHero({
  districtImage,
  statusRows,
  mainOperationLocked,
}: OperationPreviewHeroProps) {
  return (
    <Animated.View entering={FadeInUp.delay(140).duration(380).springify().damping(22)}>
      <GameCard padding="lg" style={[styles.card, shadows.card]}>
        <Text style={styles.title}>Şehir Ölçeğine Geçiş Hazırlanıyor</Text>
        <Text style={styles.body}>
          Pilot bölgede aldığın kararlar, ana operasyondaki şehir stratejine temel
          olacak.
        </Text>

        <View style={styles.visual}>
          <HubAssetImage
            source={districtImage}
            containerStyle={styles.visualImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(28,28,30,0.55)']}
            style={styles.visualGradient}
          />
          <View style={styles.overlay}>
            {mainOperationLocked ? (
              <View style={styles.overlayBadge}>
                <Ionicons name="lock-closed" size={16} color={colors.hubGoldDark} />
              </View>
            ) : null}
            <Text style={styles.overlayTitle}>ANA OPERASYON</Text>
            <Text style={styles.overlaySub}>
              {mainOperationLocked ? 'Yakında Açılacak' : 'Önizleme Modu'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          {statusRows.map((row) => (
            <HeroStatusPill
              key={row.id}
              label={row.label}
              value={row.value}
              tone={row.tone}
            />
          ))}
        </View>
      </GameCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.hubGold}55`,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  visual: {
    height: 168,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.hubGoldMuted,
  },
  visualImage: {
    ...StyleSheet.absoluteFillObject,
  },
  visualGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  overlayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hubGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 1.2,
  },
  overlaySub: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hubGold,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  statusPillLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusPillValue: {
    fontSize: 11,
    fontWeight: '800',
  },
});
