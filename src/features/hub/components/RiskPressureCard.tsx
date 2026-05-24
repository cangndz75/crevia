import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { mockGameData } from '@/core/content/mockGameData';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

function riskHeatTone(
  normalized: number,
): 'success' | 'warning' | 'danger' {
  if (normalized >= 0.65) return 'danger';
  if (normalized >= 0.42) return 'warning';
  return 'success';
}

function riskHeatLabel(normalized: number) {
  if (normalized >= 0.65) return 'yüksek sıcaklık';
  if (normalized >= 0.42) return 'denge hassas';
  return 'yük dengede';
}

export function RiskPressureCard() {
  const router = useRouter();
  const { city, riskSummary } = mockGameData;
  const progress = city.riskScore / city.maxRiskScore;

  return (
    <GameCard padding="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning" size={22} color={colors.warning} />
          </View>
          <View style={styles.headerText}>
            <Text style={typography.subtitle}>Şehir baskısı</Text>
            <Text style={typography.caption}>
              Şehir risk göstergesi ·{' '}
              {riskSummary.critical > 0
                ? `${riskSummary.critical} kritik kuyruk beklemede`
                : `${riskSummary.activeThreats} aktif hat etkin`}
            </Text>
          </View>
        </View>
        <GameChip label={riskHeatLabel(progress)} tone={riskHeatTone(progress)} />
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.scoreLeft}>
          <Text style={styles.scoreValue}>{city.riskScore}</Text>
          <Text style={styles.scoreMax}> / {city.maxRiskScore}</Text>
        </View>
        <View style={styles.scoreBarWrap}>
          <ProgressBar
            progress={progress}
            color={colors.warning}
            trackColor={colors.warningMuted}
            height={10}
          />
        </View>
      </View>

      <GameButton
        title="Hat defterini aç"
        onPress={() => router.push('/risks')}
        style={styles.cta}
      />
    </GameCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.warning,
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scoreBarWrap: {
    flex: 1,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
