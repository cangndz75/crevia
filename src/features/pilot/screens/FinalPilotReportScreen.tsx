import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

import {
  canCompletePilot,
} from '@/core/game/calculatePilotFinalResult';
import {
  selectGameState,
  selectSnapshots,
  useGameStore,
} from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

import {
  PILOT_STATUS_LABELS,
  pilotScoreAccentColor,
  pilotStatusChipTone,
} from '../utils/pilotFinalPresentation';

const LOCK_FEATURES = [
  'Tam ilçe haritası',
  'Yeni mahalleler',
  'Gelişmiş kelebek etkisi',
  'Araç bakım ve personel yorgunluğu',
  'Sosyal medya krizleri',
  'Haftalık hedefler',
] as const;

function formatCurrency(amount: number): string {
  return `₺${Math.round(amount).toLocaleString('tr-TR')}`;
}

type EvalCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'success' | 'warning' | 'danger' | 'info';
};

function EvalCard({ title, value, detail, icon, tone, index }: EvalCardProps & { index?: number }) {
  const iconColor =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.secondary;

  return (
    <Animated.View
      entering={FadeInUp.delay(400 + (index ?? 0) * 70).duration(300).springify().damping(20)}>
      <GameCard padding="md" style={styles.evalCard}>
        <View style={styles.evalHeader}>
          <View style={[styles.evalIcon, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <Text style={styles.evalTitle}>{title}</Text>
        </View>
        <Text style={styles.evalValue}>{value}</Text>
        <Text style={styles.evalDetail}>{detail}</Text>
      </GameCard>
    </Animated.View>
  );
}

export function FinalPilotReportScreen() {
  const router = useRouter();
  const gameState = useGameStore(selectGameState);
  const snapshots = useGameStore(selectSnapshots);
  const finalResult = gameState.pilot.finalResult;
  const completePilotFromCurrentState = useGameStore(
    (s) => s.completePilotFromCurrentState,
  );

  useEffect(() => {
    if (finalResult) {
      return;
    }
    const state = useGameStore.getState().gameState;
    if (canCompletePilot(state)) {
      completePilotFromCurrentState();
    }
  }, [finalResult, completePilotFromCurrentState]);

  const goHub = () => {
    router.replace('/');
  };

  const startingBudget =
    snapshots[0]?.metrics.budget ?? gameState.city.budget;
  const budgetRatio =
    startingBudget > 0
      ? Math.min(100, Math.round((gameState.city.budget / startingBudget) * 100))
      : 100;
  const completedCount = gameState.pilot.completedEventIds.length;
  const riskScore = gameState.city.riskScore ?? 0;

  if (!finalResult) {
    return (
      <AppScreen>
        <View style={styles.emptyWrap}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Pilot raporu henüz hazır değil</Text>
          <Text style={styles.emptyBody}>
            7. gün final olayını tamamladıktan sonra rapor burada görünecek.
          </Text>
          <GameButton title="Merkeze Dön" onPress={goHub} style={styles.fullBtn} />
        </View>
      </AppScreen>
    );
  }

  const scoreColor = pilotScoreAccentColor(finalResult.status);
  const statusLabel = PILOT_STATUS_LABELS[finalResult.status];

  return (
    <AppScreen>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.hero}>
        <Text style={styles.heroTitle}>Pilot Bölge Raporu</Text>
        <Text style={styles.heroSub}>
          7 günlük pilot operasyon tamamlandı.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).duration(360).springify().damping(22)}>
        <GameCard padding="lg" style={styles.scoreCard}>
          <View style={styles.scoreTop}>
            <Text style={styles.scoreLabel}>Pilot Skoru</Text>
            <GameChip
              label={statusLabel}
              tone={pilotStatusChipTone(finalResult.status)}
            />
          </View>
          <Animated.View entering={ZoomIn.delay(300).duration(400).springify().damping(14)}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {finalResult.score}
              <Text style={styles.scoreMax}>/100</Text>
            </Text>
          </Animated.View>
          <ProgressBar
            progress={finalResult.score / 100}
            color={scoreColor}
            trackColor={colors.border}
            height={8}
            style={styles.scoreBar}
          />
          <Text style={styles.summary}>{finalResult.summary}</Text>
          <Text style={styles.completedMeta}>
            Tamamlanan pilot günü: {finalResult.completedAtDay}
          </Text>
        </GameCard>
      </Animated.View>

      <SectionHeader
        title="Değerlendirme Özeti"
        subtitle="Pilot haftanın kapanış metrikleri"
        icon="analytics-outline"
      />

      <View style={styles.evalGrid}>
        <EvalCard
          title="Halk Etkisi"
          value={`%${gameState.city.publicSatisfaction}`}
          detail="Halk memnuniyeti kapanış seviyesi"
          icon="happy-outline"
          tone={
            gameState.city.publicSatisfaction >= 60 ? 'success' : 'warning'
          }
          index={0}
        />
        <EvalCard
          title="Kaynak Yönetimi"
          value={formatCurrency(gameState.city.budget)}
          detail={`Bütçe koruma: %${budgetRatio} (başlangıca göre)`}
          icon="cash-outline"
          tone={budgetRatio >= 70 ? 'success' : 'warning'}
          index={1}
        />
        <EvalCard
          title="Operasyon Riski"
          value={`${riskScore}/100`}
          detail="Düşük risk daha güçlü kapanış"
          icon="shield-outline"
          tone={riskScore <= 45 ? 'success' : 'danger'}
          index={2}
        />
        <EvalCard
          title="Karar İzleri"
          value={`${Math.min(completedCount, 7)}/7 olay`}
          detail={`${completedCount} pilot kararı kayıt altında`}
          icon="git-branch-outline"
          tone={completedCount >= 5 ? 'success' : 'info'}
          index={3}
        />
      </View>

      <Animated.View entering={FadeInUp.delay(700).duration(360).springify().damping(22)}>
      <GameCard padding="lg" style={styles.lockCard}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={14} color={colors.hubGoldDark} />
          <Text style={styles.lockBadgeText}>Premium · Yakında</Text>
        </View>
        <Text style={styles.lockTitle}>Ana Operasyon Açılıyor</Text>
        <Text style={styles.lockBody}>
          Pilot bölge tamamlandı. Tam harita, gelişmiş kelebek etkisi, yeni
          mahalleler ve uzun vadeli karar zincirleri ana operasyonda açılır.
        </Text>
        <View style={styles.lockList}>
          {LOCK_FEATURES.map((item) => (
            <View key={item} style={styles.lockRow}>
              <Ionicons
                name="ellipse"
                size={6}
                color={colors.primary}
                style={styles.lockDot}
              />
              <Text style={styles.lockItem}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.lockActions}>
          <GameButton
            title="Ana Operasyon Önizlemesine Devam"
            onPress={() =>
              router.replace('/events/main-operation-preview')
            }
            style={styles.fullBtn}
          />
          <GameButton
            title="Pilot Bölgede Kal"
            onPress={goHub}
            variant="ghost"
            style={styles.fullBtn}
          />
        </View>
      </GameCard>
      </Animated.View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroTitle: {
    ...typography.title,
    fontSize: 26,
  },
  heroSub: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scoreCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.label,
    fontSize: 13,
    color: colors.textSecondary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scoreBar: {
    marginTop: spacing.xs,
  },
  summary: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  completedMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  evalGrid: {
    gap: spacing.md,
  },
  evalCard: {
    gap: spacing.sm,
  },
  evalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  evalIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  evalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  evalDetail: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
  lockCard: {
    gap: spacing.md,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: colors.hubGold,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  lockBody: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  lockList: {
    gap: spacing.sm,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockDot: {
    marginTop: 2,
  },
  lockItem: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lockActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fullBtn: {
    alignSelf: 'stretch',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 20,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
