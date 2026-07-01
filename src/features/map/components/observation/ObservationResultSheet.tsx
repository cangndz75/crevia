import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { MapObservationPresentationModel } from '@/features/map/presentation/mapObservationPresentation';
import { CreviaAnimatedPressable } from '@/shared/motion';
import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  model: MapObservationPresentationModel;
  visible: boolean;
  reducedMotion?: boolean;
  onApplyRecommendation: () => void;
  onFocusMap: () => void;
  onDismiss: () => void;
};

export function ObservationResultSheet({
  model,
  visible,
  reducedMotion = false,
  onApplyRecommendation,
  onFocusMap,
  onDismiss,
}: Props) {
  if (!visible) return null;

  const entering = reducedMotion ? undefined : FadeInUp.duration(220).springify().damping(22);

  return (
    <Animated.View entering={entering} style={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.title}>Saha Gözü Raporu</Text>
      <Text style={styles.subtitle}>{model.targetDistrictName}</Text>
      <View style={styles.resultChip}>
        <Text style={styles.resultChipText}>{model.resultChipLabel}</Text>
      </View>
      <Text style={styles.body}>{model.summaryLine}</Text>
      <Text style={styles.bodySecondary}>
        Ana baskı {model.mainRisk.toLocaleLowerCase('tr-TR')} kaynaklanıyor.
      </Text>

      <View style={styles.metrics}>
        <Metric label="Doğruluk" value={`%${model.initialConfidence} → %${model.finalConfidence}`} />
        <Metric label="Sıcak nokta" value={String(model.hotSpotCount)} />
        <Metric label="Risk etkisi" value={model.expectedEffects.risk} />
        <Metric label="Güven etkisi" value={model.expectedEffects.trust} />
        <Metric label="Kaynak etkisi" value={model.expectedEffects.resource} />
      </View>

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>Önerilen hamle</Text>
        <Text style={styles.recommendationText}>{model.recommendedAction}</Text>
      </View>

      <View style={styles.actions}>
        <CreviaAnimatedPressable
          onPress={onApplyRecommendation}
          reducedMotion={reducedMotion}
          pressScale={0.98}
          accessibilityRole="button"
          accessibilityLabel="Saha Gözü önerilen planını aç"
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Öneriyi Uygula</Text>
        </CreviaAnimatedPressable>
        <CreviaAnimatedPressable
          onPress={onFocusMap}
          reducedMotion={reducedMotion}
          pressScale={0.98}
          accessibilityRole="button"
          accessibilityLabel="Haritada operasyon alanını gör"
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Haritada Gör</Text>
        </CreviaAnimatedPressable>
        <CreviaAnimatedPressable
          onPress={onDismiss}
          reducedMotion={reducedMotion}
          pressScale={0.98}
          accessibilityRole="button"
          accessibilityLabel="Saha Gözü raporunu kapat"
          style={styles.tertiaryButton}>
          <Text style={styles.tertiaryButtonText}>Sonra Bak</Text>
        </CreviaAnimatedPressable>
      </View>
    </Animated.View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: mapUi.panel,
    borderWidth: 1,
    borderColor: mapUi.borderStrong,
    gap: 10,
    ...mapUi.panelShadow,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: mapUi.textLight,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.textSoft,
  },
  resultChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 184, 166, 0.16)',
    borderWidth: 1,
    borderColor: mapUi.borderStrong,
  },
  resultChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.teal,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: mapUi.textLight,
  },
  bodySecondary: {
    fontSize: 12,
    lineHeight: 18,
    color: mapUi.textSoft,
  },
  metrics: {
    gap: 6,
    paddingVertical: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: mapUi.textMuted,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 12,
    color: mapUi.mint,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  recommendationBox: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(216, 167, 46, 0.1)',
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
    gap: 4,
  },
  recommendationLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: mapUi.gold,
    textTransform: 'uppercase',
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: mapUi.textLight,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mapUi.teal,
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#042220',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: mapUi.border,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: mapUi.textLight,
  },
  tertiaryButton: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.textMuted,
  },
});
