import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildPilotCompletionSummary,
  type PilotCompletionSummary,
} from '@/core/pilotCompletion';
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
  const storeSlice = useGameStore(
    useShallow((s) => ({
      pilot: s.gameState.pilot,
      city: s.gameState.city,
      hasHydrated: s._hasHydrated,
      districtId: s.gameState.pilot.selectedDistrictId,
      gameState: s.gameState,
      decisionHistory: s.decisionHistory,
      dailyPriorityByDay: s.dailyPriorityByDay,
      dailyGoalsByDay: s.dailyGoalsByDay,
      lastDailyReport: s.lastDailyReport,
      lastPilotScore: s.lastPilotScore,
      snapshots: s.snapshots,
    })),
  );
  const {
    pilot,
    city,
    hasHydrated,
    districtId,
    gameState,
    decisionHistory,
    dailyPriorityByDay,
    dailyGoalsByDay,
    lastDailyReport,
    lastPilotScore,
    snapshots,
  } = storeSlice;

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

    const completionSummary: PilotCompletionSummary = buildPilotCompletionSummary({
      gameState,
      decisionHistory,
      dailyPriorityByDay,
      dailyGoalsByDay,
      lastDailyReport,
      lastPilotScore,
      snapshots,
    });

    const unlockItemsById = new Map(
      completionSummary.unlockedPreviewItems.map((item) => [item.id, item]),
    );

    const systemCards: SystemCardItem[] = SYSTEM_CARDS.map((card) => {
      const unlockItem = unlockItemsById.get(card.id);
      const statusTag = unlockItem?.tag ?? (card.locked ? 'Kilitli' : 'Önizleme');
      const locked =
        unlockItem?.status === 'locked' ||
        (!(unlock?.cityMapPreviewUnlocked ?? false) && card.id === 'city-map') ||
        (unlockItem?.status !== 'completed' && card.id !== 'city-map');

      if (card.id === 'city-map') {
        return {
          ...card,
          locked: !(unlock?.cityMapPreviewUnlocked ?? false) && !isCompleted,
          statusTag: isCompleted
            ? unlock?.cityMapPreviewUnlocked
              ? 'Yakında'
              : 'Önizleme'
            : 'Kilitli',
          description: isCompleted
            ? 'Pilot tamamlandı; şehir haritası ana operasyon açılışında sıradaki adım.'
            : card.description,
        };
      }

      if (card.id === 'butterfly' && isCompleted) {
        return {
          ...card,
          locked: false,
          statusTag: 'Pilotla hazırlandı',
          description:
            'Pilot kararlarının yankıları kayıt altında; ana operasyonda genişleyecek.',
        };
      }

      return {
        ...card,
        locked: locked && card.id !== 'butterfly',
        statusTag,
        description: isCompleted
          ? `${card.description} Pilot tamamlandı, ana operasyon açılışı yakında.`
          : card.description,
      };
    });

    const roadmapHint = isCompleted
      ? completionSummary.strongestMetricLabel
        ? `Bu pilotta en güçlü alanın: ${completionSummary.strongestMetricLabel}.`
        : reportReady
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
      completionSummary,
      heroPersonalizedText: completionSummary.isCompleted
        ? completionSummary.nextChapterText
        : undefined,
      headerSubtitle: completionSummary.isCompleted
        ? `Pilot tamamlandı · ${completionSummary.gradeLabel} · Yönetim tarzı: ${completionSummary.managementStyleLabel}`
        : 'Pilot bölge tamamlandı. Şehir ölçeği yakında açılıyor.',
      personalizedChips: completionSummary.isCompleted
        ? [
            { id: 'done', label: 'Pilot tamamlandı', tone: 'success' as const },
            {
              id: 'grade',
              label: completionSummary.gradeLabel,
              tone: 'info' as const,
            },
            {
              id: 'style',
              label: completionSummary.managementStyleLabel,
              tone: 'warning' as const,
            },
            {
              id: 'report',
              label: '7 günlük rapor hazır',
              tone: 'info' as const,
            },
          ]
        : null,
    };
  }, [
    pilot,
    city,
    hasHydrated,
    districtId,
    gameState,
    decisionHistory,
    dailyPriorityByDay,
    dailyGoalsByDay,
    lastDailyReport,
    lastPilotScore,
    snapshots,
    options?.forcePilotComplete,
  ]);
}
