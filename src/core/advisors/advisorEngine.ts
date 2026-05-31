import type { DailyReport } from '@/core/models/DailyReport';
import type { EventCard } from '@/core/models/EventCard';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { deriveOperationSignalsFromGameState } from '@/core/operations/operationSignalEngine';
import { buildOperationSignalsEngineInputFromStore } from '@/core/operations/operationSignalEngine';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import {
  ADVISOR_COPY,
  ADVISOR_MAX_INSIGHT_BODY_LENGTH,
  RELIABILITY_LABELS,
} from './advisorConstants';
import { getDailyPlanAdvisorComment } from '@/core/dailyPlanning/dailyPlanningEngine';

import { getAdvisorLevelFromExperience } from './advisorState';
import type {
  AdvisorEngineContext,
  AdvisorInsight,
  AdvisorLevel,
  AdvisorReliabilityBand,
  AdvisorState,
} from './advisorTypes';

function trimBody(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= ADVISOR_MAX_INSIGHT_BODY_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, ADVISOR_MAX_INSIGHT_BODY_LENGTH - 1).trim()}…`;
}

function clarityForContext(ctx: AdvisorEngineContext): string {
  if (ctx.advisorState) {
    return RELIABILITY_LABELS[ctx.advisorState.reliabilityBand];
  }
  return RELIABILITY_LABELS.early_observation;
}

function makeInsight(
  partial: Omit<AdvisorInsight, 'confidenceLabel'>,
  ctx: AdvisorEngineContext,
): AdvisorInsight {
  return {
    ...partial,
    body: trimBody(partial.body),
    confidenceLabel: clarityForContext(ctx),
  };
}

function resolveAdvisorLevel(ctx: AdvisorEngineContext): AdvisorLevel {
  if (ctx.advisorState) {
    return getAdvisorLevelFromExperience(ctx.advisorState.experience);
  }
  return 1;
}

function resolveReliabilityBand(ctx: AdvisorEngineContext): AdvisorReliabilityBand {
  if (ctx.advisorState) {
    return ctx.advisorState.reliabilityBand;
  }
  return 'early_observation';
}

function isEarlyAnalysis(ctx: AdvisorEngineContext): boolean {
  const level = resolveAdvisorLevel(ctx);
  const band = resolveReliabilityBand(ctx);
  return level === 1 || band === 'early_observation';
}

function isDevelopingAnalysis(ctx: AdvisorEngineContext): boolean {
  const level = resolveAdvisorLevel(ctx);
  const band = resolveReliabilityBand(ctx);
  return (
    (level === 2 && band !== 'reliable' && band !== 'expert') ||
    band === 'developing'
  );
}

function isCriticalEvent(event: EventCard): boolean {
  return event.riskLevel === 'high' || event.riskLevel === 'critical';
}

function isSocialCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('social') ||
    c.includes('sosyal') ||
    c.includes('citizen') ||
    c.includes('halk') ||
    c.includes('community')
  );
}

function isVehicleCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('vehicle') ||
    c.includes('araç') ||
    c.includes('route') ||
    c.includes('rota')
  );
}

function isContainerCategory(category: string): boolean {
  const c = category.toLowerCase();
  return (
    c.includes('container') ||
    c.includes('konteyner') ||
    c.includes('waste') ||
    c.includes('atık')
  );
}

function isResourceCategory(category: string): boolean {
  return isVehicleCategory(category) || isContainerCategory(category);
}

function hasActiveCriticalEvent(ctx: AdvisorEngineContext): boolean {
  return ctx.gameState.events.some(
    (e) => e.riskLevel === 'critical' || e.riskLevel === 'high',
  );
}

function resolvePostPilotLight(ctx: AdvisorEngineContext): boolean {
  if (ctx.postPilotLightPhase != null) return ctx.postPilotLightPhase;
  const pilot = ctx.gameState.pilot;
  if (pilot.status !== 'completed') return false;
  const postPilot = normalizePostPilotOperationState(pilot.postPilotOperation, {
    pilotStatus: pilot.status,
    currentPilotDay: pilot.currentPilotDay,
  });
  return postPilot.phase === 'main_operation_light';
}

function personnelFatigueHint(ctx: AdvisorEngineContext): string | null {
  const teams = ctx.personnelState?.teams;
  if (!teams?.length) return null;
  const tired = teams.filter((t) => t.fatigue >= 70);
  if (tired.length >= 2) {
    return 'Birden fazla ekip yorgun görünüyor; bugün görev dağılımını sade tut.';
  }
  if (tired.length === 1) {
    return 'Bir saha ekibi yorgun; kritik görevde rotasyon düşün.';
  }
  return null;
}

function vehicleHint(ctx: AdvisorEngineContext): string | null {
  const vehicles = ctx.vehicleState?.units;
  if (!vehicles?.length) return null;
  const unavailable = vehicles.filter(
    (v) =>
      v.operationalStatus === 'maintenance' || v.operationalStatus === 'broken',
  );
  if (unavailable.length > 0) {
    return 'Filo kısıtlı; saha görevlerinde yedek rota planı hazır olsun.';
  }
  return null;
}

function resolveOperationSignals(ctx: AdvisorEngineContext): OperationSignalsState | null {
  if (ctx.operationSignals) {
    return ctx.operationSignals;
  }
  try {
    return deriveOperationSignalsFromGameState(
      buildOperationSignalsEngineInputFromStore({
        gameState: ctx.gameState,
        personnelState: ctx.personnelState,
        vehicleState: ctx.vehicleState,
        containerState: ctx.containerState,
        isDay1Tutorial: ctx.isDay1Tutorial,
      }),
    );
  } catch {
    return null;
  }
}

function signalInsightFromOperations(
  ctx: AdvisorEngineContext,
): { body: string; tags: string[] } | null {
  const signals = resolveOperationSignals(ctx);
  if (!signals) return null;

  const tags = [
    'operation_signals',
    signals.dailyFocus,
    ...signals.overall.sourceTags,
  ];

  if (isEarlyAnalysis(ctx)) {
    if (
      signals.vehicles.status === 'watch' ||
      signals.vehicles.status === 'strained'
    ) {
      return {
        body: 'Bugün araç tarafında baskı olabilir. Yüksek kapasiteli görevlerde dikkatli olmak iyi olur.',
        tags: [...tags, 'vehicles', signals.vehicles.status],
      };
    }
    return {
      body: 'Tam net değil ama araç ve konteyner sinyallerini izlemek iyi olur.',
      tags,
    };
  }

  if (isDevelopingAnalysis(ctx)) {
    if (
      signals.vehicles.status === 'watch' ||
      signals.vehicles.status === 'strained'
    ) {
      return {
        body: `Araç baskısı izlemede. Yüksek kapasiteli görevlerde bakım riskini düşün.`,
        tags: [...tags, 'vehicles', signals.vehicles.status],
      };
    }
    if (
      signals.personnel.status === 'strained' ||
      signals.personnel.status === 'critical'
    ) {
      return {
        body: `Personel sinyali: ${signals.personnel.summary}`,
        tags: [...tags, 'personnel', signals.personnel.status],
      };
    }
    return {
      body: signals.overall.summary,
      tags,
    };
  }

  if (
    signals.containers.status === 'watch' ||
    signals.containers.status === 'strained' ||
    signals.containers.status === 'critical'
  ) {
    const districtHint = signals.priorityDistrictId
      ? `${signals.priorityDistrictId} yönünde `
      : '';
    return {
      body: `Konteyner baskısı ${districtHint}artıyor. Hızlı toplama bugünü rahatlatır, temizlik odağı yarına daha az risk taşır.`,
      tags: [...tags, 'containers', signals.containers.status],
    };
  }

  return {
    body: `${signals.districts.summary} ${signals.overall.summary}`.slice(0, 155),
    tags: [...tags, 'districts', signals.priorityDistrictId],
  };
}

function eventHintFromSignals(
  ctx: AdvisorEngineContext,
  event: EventCard,
  level: AdvisorLevel,
): string | null {
  const signals = resolveOperationSignals(ctx);
  if (!signals) return null;

  if (isContainerCategory(event.category)) {
    if (level >= 3) {
      return `${signals.containers.summary} Konteyner odağı bu görevde belirleyici.`;
    }
    return signals.containers.summary;
  }
  if (isSocialCategory(event.category)) {
    if (level >= 2) {
      return `${signals.districts.summary} Personel: ${signals.personnel.summary}`.slice(
        0,
        150,
      );
    }
    return signals.districts.summary;
  }
  if (isVehicleCategory(event.category)) {
    return signals.vehicles.summary;
  }
  return null;
}

function containerHint(ctx: AdvisorEngineContext): string | null {
  const bins = ctx.containerState?.units;
  if (!bins?.length) return null;
  const stressed = bins.filter((b) => b.fillRate >= 0.85);
  if (stressed.length >= 2) {
    return 'Konteyner dolulukları yükseliyor; toplama sırasını gözden geçir.';
  }
  return null;
}

export function buildDailyAdvisorInsights(
  ctx: AdvisorEngineContext,
): AdvisorInsight[] {
  const effectiveLevel: AdvisorLevel = ctx.isDay1Tutorial
    ? 1
    : resolveAdvisorLevel(ctx);

  const insights: AdvisorInsight[] = [];

  if (ctx.isDay1Tutorial) {
    insights.push(
      makeInsight(
        {
          id: 'daily-day1',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: 'Bugün temel akışı öğrenmeye odaklan. Büyük analizler sonraki günlerde açılır.',
          tone: 'neutral',
          sourceTags: ['tutorial', 'day1'],
        },
        ctx,
      ),
    );
    return insights;
  }

  const planLine = getDailyPlanAdvisorComment({
    gameState: ctx.gameState,
    advisorState: ctx.advisorState,
    operationSignals: ctx.operationSignals,
    dailyOperationsPlan: ctx.dailyOperationsPlan,
    isDay1Tutorial: ctx.isDay1Tutorial,
    postPilotLightPhase: ctx.postPilotLightPhase,
  });

  const mainOpNote = ctx.mainOperationAdvisorNote?.trim();
  if (mainOpNote) {
    insights.push(
      makeInsight(
        {
          id: 'daily-main-operation',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: mainOpNote,
          tone: 'neutral',
          sourceTags: ['main_operation'],
        },
        ctx,
      ),
    );
  }

  const signalInsight = signalInsightFromOperations(ctx);
  if (signalInsight) {
    const body =
      ctx.dailyOperationsPlan && !ctx.isDay1Tutorial
        ? `${signalInsight.body} ${planLine}`.slice(0, ADVISOR_MAX_INSIGHT_BODY_LENGTH)
        : signalInsight.body;
    insights.push(
      makeInsight(
        {
          id: 'daily-signals',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body,
          tone:
            resolveOperationSignals(ctx)?.overall.status === 'critical' ||
            resolveOperationSignals(ctx)?.overall.status === 'strained'
              ? 'warning'
              : 'neutral',
          sourceTags: signalInsight.tags,
        },
        ctx,
      ),
    );
  }

  if (resolvePostPilotLight(ctx)) {
    insights.push(
      makeInsight(
        {
          id: 'daily-post-pilot',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: 'Pilot sonrası gündem sınırlı ama şehir sinyalleri büyümeye başlıyor.',
          tone: 'neutral',
          sourceTags: ['post_pilot'],
        },
        ctx,
      ),
    );
  }

  if (hasActiveCriticalEvent(ctx)) {
    insights.push(
      makeInsight(
        {
          id: 'daily-critical',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: 'Bugünün ana odağı aktif operasyonu doğru kaynakla kapatmak olmalı.',
          tone: 'warning',
          sourceTags: ['critical_event'],
        },
        ctx,
      ),
    );
  }

  const resourceHints = [
    personnelFatigueHint(ctx),
    vehicleHint(ctx),
    containerHint(ctx),
  ].filter((h): h is string => h != null);

  if (resourceHints.length > 0) {
    insights.push(
      makeInsight(
        {
          id: 'daily-resources',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: resourceHints[0]!,
          tone: 'warning',
          sourceTags: ['resources'],
        },
        ctx,
      ),
    );
  }

  if (insights.length === 0) {
    insights.push(
      makeInsight(
        {
          id: 'daily-generic',
          type: 'daily_summary',
          title: ADVISOR_COPY.hubTitle,
          body: 'Günü tek bir net öncelik etrafında topla; küçük sapmalar yarın büyüyebilir.',
          tone: 'neutral',
          sourceTags: ['generic'],
        },
        ctx,
      ),
    );
  }

  return insights.slice(0, 2);
}

export function buildEventAdvisorInsights(
  ctx: AdvisorEngineContext,
  event: EventCard,
): AdvisorInsight[] {
  const effectiveLevel: AdvisorLevel = ctx.isDay1Tutorial
    ? 1
    : resolveAdvisorLevel(ctx);

  const signalBody = eventHintFromSignals(ctx, event, effectiveLevel);
  let body = signalBody ?? 'Bu olayda hızlı müdahale önemli görünüyor.';
  const tone: AdvisorInsight['tone'] = isCriticalEvent(event)
    ? 'warning'
    : 'neutral';

  if (!signalBody && isSocialCategory(event.category)) {
    body =
      effectiveLevel >= 2
        ? 'Halk etkisi ön planda; iletişim tonu kararın yarısını belirler.'
        : 'Bu olayda halk etkisini erken yönetmek önemli.';
  } else if (!signalBody && isResourceCategory(event.category)) {
    body =
      effectiveLevel >= 2
        ? 'Kaynak ve saha kapasitesi bu görevin sonucunu doğrudan etkiler.'
        : 'Kaynak planını görev başlamadan netleştir.';
  }

  if (isCriticalEvent(event) && effectiveLevel >= 1) {
    body =
      effectiveLevel >= 3
        ? 'Erteleme riski yüksek; düşük maliyetli seçim yarın sosyal tepkiyi artırabilir.'
        : 'Yüksek öncelikli olayda erteleme yarın baskıyı büyütebilir.';
  }

  if (!signalBody && effectiveLevel === 1) {
    body = 'Bu olayda hızlı müdahale önemli görünüyor.';
  } else if (!signalBody && effectiveLevel === 2) {
    if (!isSocialCategory(event.category) && !isResourceCategory(event.category)) {
      body = 'Teknik ekip bu görevde daha uygun olabilir.';
    }
  } else if (!signalBody && effectiveLevel === 3) {
    if (!isCriticalEvent(event)) {
      body = 'Düşük maliyetli çözüm yarın sosyal tepkiyi artırabilir.';
    }
  }

  const signalTags = resolveOperationSignals(ctx)
    ? ['operation_signals', event.category]
    : [event.category, event.riskLevel];

  return [
    makeInsight(
      {
        id: `event-${event.id}`,
        type: 'event_plan_hint',
        title: ADVISOR_COPY.eventHintTitle,
        body,
        tone,
        sourceTags: signalTags,
      },
      ctx,
    ),
  ];
}

export function buildAssignmentAdvisorInsights(
  ctx: AdvisorEngineContext,
  event: EventCard,
): AdvisorInsight[] {
  const effectiveLevel: AdvisorLevel = ctx.isDay1Tutorial
    ? 1
    : resolveAdvisorLevel(ctx);

  let body = 'Görev atamasında dengeyi koru; tek ekibe yüklenme riski var.';
  if (effectiveLevel >= 2 && isResourceCategory(event.category)) {
    body = 'Saha ve teknik uyumu bu atamada kritik; uygun ekip türünü seç.';
  }
  if (effectiveLevel >= 3) {
    body = 'Yarın taşınabilecek yorgunluk ve rota gecikmesi riskini hesaba kat.';
  }

  return [
    makeInsight(
      {
        id: `assign-${event.id}`,
        type: 'assignment_hint',
        title: ADVISOR_COPY.eventHintTitle,
        body,
        tone: 'neutral',
        sourceTags: ['assignment', event.category],
      },
      ctx,
    ),
  ];
}

export function buildEndDayAdvisorInsight(
  ctx: AdvisorEngineContext,
  report: DailyReport,
): AdvisorInsight | undefined {
  const effectiveLevel: AdvisorLevel = ctx.isDay1Tutorial
    ? 1
    : resolveAdvisorLevel(ctx);

  const signals = resolveOperationSignals(ctx);
  const warnings = report.warnings ?? [];
  const highlights = report.highlights ?? [];
  let body =
    'Gün dengeli kapandı; yarına temiz bir öncelik listesi bırakmaya çalış.';

  if (signals && (signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical')) {
    body = 'Bugün araç baskısı arttı; yarın bakım odağı mantıklı olabilir.';
  } else if (
    signals &&
    (signals.containers.status === 'strained' || signals.containers.status === 'critical')
  ) {
    body = `${signals.containers.summary} Yarın konteyner odağı öncelikli kalabilir.`;
  } else if (signals && signals.personnel.status !== 'stable') {
    body = `${signals.personnel.summary} Yarın personel rotasyonu planını gözden geçir.`;
  } else if (signals) {
    body = signals.overall.summary;
  }

  if (warnings.length > 0 && !signals) {
    body =
      effectiveLevel >= 3
        ? `Yarına taşınabilecek risk: ${warnings[0]!.slice(0, 80)}`
        : `Dikkat: ${warnings[0]!.slice(0, 90)}`;
  } else if (highlights.length > 0) {
    body = highlights[0]!.slice(0, 120);
  } else if (ctx.isDay1Tutorial) {
    body = 'İlk günü tamamladın; yarın biraz daha derin analiz açılacak.';
  }

  return makeInsight(
    {
      id: `end-day-${report.day}`,
      type: 'end_day_comment',
      title: ADVISOR_COPY.endDayTitle,
      body,
      tone: warnings.length > 0 ? 'warning' : 'positive',
      sourceTags: ['end_of_day'],
    },
    ctx,
  );
}

export { spendAdvisorUse, grantAdvisorExperience, grantAdvisorEndOfDayExperience } from './advisorState';

export function buildAdvisorContextFromStore(state: {
  gameState: AdvisorEngineContext['gameState'];
  advisorState?: AdvisorState;
  personnelState?: AdvisorEngineContext['personnelState'];
  vehicleState?: AdvisorEngineContext['vehicleState'];
  containerState?: AdvisorEngineContext['containerState'];
  operationSignals?: OperationSignalsState;
  dailyOperationsPlan?: AdvisorEngineContext['dailyOperationsPlan'];
  isDay1Tutorial?: boolean;
  mainOperationAdvisorNote?: string | null;
}): AdvisorEngineContext {
  const postPilot = normalizePostPilotOperationState(
    state.gameState.pilot.postPilotOperation,
    {
      pilotStatus: state.gameState.pilot.status,
      currentPilotDay: state.gameState.pilot.currentPilotDay,
    },
  );
  return {
    ...state,
    postPilotLightPhase: postPilot.phase === 'main_operation_light',
    mainOperationAdvisorNote: state.mainOperationAdvisorNote,
  };
}

export function syncAdvisorStateLevel(state: AdvisorState): AdvisorState {
  const level = getAdvisorLevelFromExperience(state.experience);
  return { ...state, level };
}
