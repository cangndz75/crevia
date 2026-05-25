import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { deriveHubRiskScore } from '@/features/hub/utils/hubDerived';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function getTone(score: number): 'danger' | 'warning' | 'success' {
  if (score >= 65) return 'danger';
  if (score >= 42) return 'warning';
  return 'success';
}

const TONE_COLORS = {
  danger: { bg: colors.dangerMuted, text: colors.danger },
  warning: { bg: colors.warningMuted, text: colors.warning },
  success: { bg: colors.successMuted, text: colors.success },
} as const;

function getContextText(tone: 'danger' | 'warning' | 'success'): string {
  if (tone === 'danger') return 'Dikkat — sıcak bölge aktif';
  if (tone === 'warning') return 'Baskı seviyesi yükseliyor';
  return 'Baskı seviyesi kontrol altında';
}

export function RiskPressureCard() {
  const router = useRouter();
  const input = useHubDerivedInput();

  const { score, maxScore, label } = useMemo(
    () => deriveHubRiskScore(input),
    [input],
  );

  const progress = score / maxScore;
  const activeCount = input.activeEvents.length;
  const tone = getTone(score);
  const toneColors = TONE_COLORS[tone];
  const showAccent = score >= 42;

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>RİSK TAKİBİ</Text>
        <Text style={styles.sectionTitle}>Şehir Baskısı</Text>
        <Text style={styles.sectionSubtitle}>
          {activeCount > 0
            ? `${activeCount} aktif olay şehir ritmini etkiliyor`
            : 'Aktif olay yok — metrik izleme'}
        </Text>
      </View>

      {/* Card */}
      <View style={[styles.card, showAccent && styles.cardAccent]}>
        {showAccent && <View style={[styles.accentStrip, { backgroundColor: colors.warning }]} />}

        <View style={styles.cardContent}>
          {/* Score Row */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreLeft}>
              <Text style={[styles.scoreValue, { color: toneColors.text }]}>
                {score}
              </Text>
              <Text style={styles.scoreMax}> / {maxScore}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: toneColors.bg }]}>
              <Text style={[styles.statusText, { color: toneColors.text }]}>
                {label}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: toneColors.text,
                },
              ]}
            />
          </View>

          {/* Context Text */}
          <Text style={styles.contextText}>{getContextText(tone)}</Text>

          {/* CTA Button */}
          <Pressable
            onPress={() => router.push('/risks')}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Risk merkezine git">
            <Text style={styles.ctaText}>Risk merkezine git →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    flexDirection: 'row',
  },
  accentStrip: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warningMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
