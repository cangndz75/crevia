import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import { getDistrictProfile } from '@/core/content/districtProfiles';
import {
  formatPilotRunMetricsDisplay,
  metricsFromCity,
} from '@/core/game/pilotRun';
import type { PilotRunMetrics } from '@/core/models/PilotRun';
import {
  HERO_STATUS_ROWS,
  LEGACY_METRICS,
  ROADMAP_STEPS,
  STATUS_CHIPS,
  SYSTEM_CARDS,
  type RoadmapStep,
  type StatusChipItem,
  type SystemCardItem,
} from '@/features/pilot/components/operation-preview/operationPreviewData';
import { useGameStore } from '@/store/useGameStore';

export type OperationPreviewChipView = StatusChipItem & {
  active: boolean;
};

export type OperationPreviewHeroRow = {
  id: string;
  label: string;
  value: string;
  tone: 'success' | 'locked' | 'pending';
};

const FALLBACK_METRICS: PilotRunMetrics = {
  publicSatisfaction: 62,
  budget: 68_500,
  staffMorale: 58,
  operationRisk: 41,
};

function fallbackLegacyValues() {
  return formatPilotRunMetricsDisplay(FALLBACK_METRICS);
}

export type UseOperationPreviewStateOptions = {
  /** Ana operasyon önizlemesi — pilot bölgesi bu ekranda her zaman bitmiş kabul edilir. */
  forcePilotComplete?: boolean;
};

export function useOperationPreviewState(
  options?: UseOperationPreviewStateOptions,
) {
  const { pilot, city, hasHydrated, districtId, gameState } = useGameStore(
    useShallow((s) => ({
      pilot: s.gameState.pilot,
      city: s.gameState.city,
      hasHydrated: s._hasHydrated,
      districtId: s.gameState.pilot.selectedDistrictId,
      gameState: s.gameState,
    })),
  );

  return useMemo(() => {
    const run = pilot.run;
    const profile = districtId ? getDistrictProfile(districtId) : undefined;
    const districtFallback = profile?.startingMetrics;

    const fallbackFromDistrict: PilotRunMetrics = districtFallback
      ? {
          publicSatisfaction: districtFallback.publicSatisfaction,
          budget: districtFallback.budget,
          staffMorale: districtFallback.staffMorale,
          operationRisk: districtFallback.riskScore ?? FALLBACK_METRICS.operationRisk,
        }
      : FALLBACK_METRICS;

    const liveMetrics = metricsFromCity(city);
    const displayMetrics =
      run?.finalMetrics ??
      (pilot.status === 'completed' ? liveMetrics : null) ??
      (pilot.status === 'active' ? liveMetrics : null);

    const legacyValues = displayMetrics
      ? formatPilotRunMetricsDisplay(displayMetrics)
      : formatPilotRunMetricsDisplay(fallbackFromDistrict);

    const unlock = run?.unlockState;
    const isCompleted =
      options?.forcePilotComplete === true ||
      run?.isCompleted === true ||
      pilot.status === 'completed' ||
      unlock?.mainOperationPreviewUnlocked === true ||
      canCompletePilot(gameState);
    const reportReady =
      (run?.dailySnapshots.length ?? 0) >= 7 ||
      pilot.currentPilotDay >= 7 ||
      isCompleted;
    const mainLocked = run
      ? !run.unlockState.fullMainOperationUnlocked
      : true;

    const chips: OperationPreviewChipView[] = STATUS_CHIPS.map((chip) => {
      switch (chip.id) {
        case 'pilot-done':
          return { ...chip, active: isCompleted };
        case 'report-ready':
          return { ...chip, active: reportReady };
        case 'main-locked':
          return { ...chip, active: mainLocked };
        default:
          return { ...chip, active: false };
      }
    });

    const roadmapSteps: RoadmapStep[] = ROADMAP_STEPS.map((step) => {
      switch (step.id) {
        case 'pilot':
          return {
            ...step,
            state: isCompleted ? 'completed' : 'locked',
            statusLabel: isCompleted ? 'Tamamlandı' : 'Devam Ediyor',
          };
        case 'city-map':
          return {
            ...step,
            state: unlock?.cityMapPreviewUnlocked
              ? 'next'
              : isCompleted
                ? 'next'
                : 'locked',
            statusLabel: unlock?.cityMapPreviewUnlocked
              ? 'Sıradaki Kilit'
              : 'Kilitli',
          };
        case 'neighborhoods':
          return { ...step, state: 'locked', statusLabel: 'Yakında' };
        case 'main-op':
          return {
            ...step,
            state: unlock?.fullMainOperationUnlocked ? 'completed' : 'goal',
            statusLabel: unlock?.fullMainOperationUnlocked
              ? 'Açık'
              : unlock?.mainOperationPreviewUnlocked
                ? 'Önizleme'
                : 'Geniş Mod',
          };
        default:
          return step;
      }
    });

    const heroRows: OperationPreviewHeroRow[] = HERO_STATUS_ROWS.map((row) => {
      switch (row.id) {
        case 'pilot':
          return {
            ...row,
            value: isCompleted ? 'Tamamlandı' : 'Devam Ediyor',
            tone: isCompleted ? 'success' : 'pending',
          };
        case 'map':
          return {
            ...row,
            value: unlock?.cityMapPreviewUnlocked ? 'Önizleme' : 'Kilitli',
            tone: unlock?.cityMapPreviewUnlocked ? 'pending' : 'locked',
          };
        case 'main':
          return {
            ...row,
            value: unlock?.fullMainOperationUnlocked
              ? 'Açık'
              : unlock?.mainOperationPreviewUnlocked
                ? 'Hazırlanıyor'
                : 'Kilitli',
            tone: unlock?.mainOperationPreviewUnlocked ? 'pending' : 'locked',
          };
        default:
          return row;
      }
    });

    const systemCards: SystemCardItem[] = SYSTEM_CARDS.map((card) => {
      if (card.id === 'city-map') {
        return {
          ...card,
          locked: !(unlock?.cityMapPreviewUnlocked ?? false),
        };
      }
      return { ...card, locked: true };
    });

    const roadmapHint = isCompleted
      ? reportReady
        ? 'Pilot tamam — 7 günlük rapor hazır.'
        : 'Pilot tamam — sırada şehir haritası var.'
      : 'Pilot bölgesini tamamla; ardından şehir haritası açılacak.';

    const hasRealData = Boolean(run && (run.eventHistory.length > 0 || isCompleted));

    return {
      hasHydrated,
      hasRealData,
      legacyValues,
      legacyMetricDefs: LEGACY_METRICS,
      chips,
      roadmapSteps,
      roadmapHint,
      heroRows,
      systemCards,
      isCompleted,
      reportReady,
      mainLocked,
      mainOperationPreviewUnlocked:
        unlock?.mainOperationPreviewUnlocked ?? isCompleted,
      districtName: run?.selectedDistrictName ?? profile?.shortName,
    };
  }, [pilot, city, hasHydrated, districtId, gameState, options?.forcePilotComplete]);
}
