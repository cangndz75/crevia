import { inferEventDomainUiFocus } from '@/core/events/eventDomainPresentation';
import type { EventDomainUiFocus } from '@/core/events/eventDomainPresentationTypes';
import {
  enrichInspectFindingsWithVariety,
  getEventGameplayVarietyProfile,
  varietyInspectFindingScoreBoost,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import { applyAuthorityToInspectFindings } from '@/core/authority/authorityGameplayUnlockPresentation';
import type { AuthorityGameplayPresentationContext } from '@/core/authority/authorityGameplayUnlockTypes';
import {
  operationMotionFindingRevealTiming,
  operationMotionScanDurationMs,
} from '@/core/motion/operationMotionTokens';
import type { EventCard } from '@/core/models/EventCard';
import { buildInspectHeroChips } from '@/features/events/utils/eventWorkflowPresentation';

export type EventInspectInteractionState = 'idle' | 'analyzing' | 'revealed';

export type EventInspectPhaseStatus = 'idle' | 'analyzing' | 'revealed' | 'completed';

export type EventInspectFindingKind =
  | 'risk'
  | 'district'
  | 'resource'
  | 'social'
  | 'route'
  | 'team'
  | 'opportunity'
  | 'general';

export type EventInspectFindingTone = 'positive' | 'neutral' | 'warning' | 'urgent';

export type EventInspectFindingPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EventInspectFinding = {
  id: string;
  kind: EventInspectFindingKind;
  title: string;
  body: string;
  tone: EventInspectFindingTone;
  priority: EventInspectFindingPriority;
  iconKey: string;
  sourceLabel: string;
  sourceIds: string[];
};

export type EventInspectAdvisorTone = 'calm' | 'teaching' | 'warning' | 'urgent' | 'positive';

export type EventInspectAdvisorComment = {
  title: string;
  text: string;
  tone: EventInspectAdvisorTone;
};

export type EventInspectCtaActionKey = 'start_inspection' | 'go_to_plan' | 'disabled';

export type EventInspectCta = {
  label: string;
  actionKey: EventInspectCtaActionKey;
  enabled: boolean;
};

export type EventInspectScanHint = {
  shouldShowScanLine: boolean;
  revealLevel: 'none' | 'soft' | 'strong';
  estimatedDurationMs: number;
};

export type EventInspectPhasePresentation = {
  title: string;
  subtitle?: string;
  summary: string;
  domainLabel?: string;
  status: EventInspectPhaseStatus;
  findings: EventInspectFinding[];
  advisorComment?: EventInspectAdvisorComment;
  primaryCta: EventInspectCta;
  footerHint: string;
  scanHint: EventInspectScanHint;
  accessibilityLabel: string;
  showFindings: boolean;
  showAdvisorComment: boolean;
};

export type BuildEventInspectPhasePresentationInput = {
  event: EventCard;
  interactionState: EventInspectInteractionState;
  reducedMotion?: boolean;
  day?: number;
  isDay1LearningEvent?: boolean;
  /** Gameplay variety repetition hint — persist edilmez. */
  recentVarietyProfiles?: import('@/core/eventVariety/eventGameplayVarietyTypes').BuildEventGameplayVarietyProfileInput['recentProfiles'];
  authorityGameplayContext?: AuthorityGameplayPresentationContext;
};

const ALLOWED_FINDING_KINDS: EventInspectFindingKind[] = [
  'risk',
  'district',
  'resource',
  'social',
  'route',
  'team',
  'opportunity',
  'general',
];

const DOMAIN_SHORT_LABELS: Partial<Record<EventDomainUiFocus, string>> = {
  container: 'Temizlik',
  vehicle_route: 'Rota',
  personnel: 'Ekip',
  social: 'Sosyal',
  crisis_adjacent: 'Risk',
  district_balance: 'Mahalle',
  pilot_final: 'Operasyon',
  pilot_learning: 'Öğrenme',
  generic_operation: 'Operasyon',
};

type FindingCandidate = {
  score: number;
  finding: EventInspectFinding;
};

function sanitizeText(value: string | undefined | null, fallback: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function hasResourcePressure(event: EventCard): boolean {
  return event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 0 ||
      (costs.staffHours ?? 0) > 0 ||
      (costs.vehicleUsage ?? 0) > 0 ||
      (costs.morale ?? 0) > 0
    );
  });
}

function buildRiskFinding(event: EventCard): FindingCandidate | null {
  const { riskLevel } = event;
  const riskDelta = event.previewEffects?.risk ?? 0;

  if (riskLevel === 'critical') {
    return {
      score: 100,
      finding: {
        id: 'finding-risk',
        kind: 'risk',
        title: 'Risk seviyesi yüksek',
        body: 'Bu olay yanlış ekip seçilirse yarına baskı taşıyabilir.',
        tone: 'urgent',
        priority: 'urgent',
        iconKey: 'pulse-outline',
        sourceLabel: 'Olay riski',
        sourceIds: [event.id, `risk:${riskLevel}`],
      },
    };
  }

  if (riskLevel === 'high' || riskDelta >= 2) {
    return {
      score: 75,
      finding: {
        id: 'finding-risk',
        kind: 'risk',
        title: 'Risk seviyesi izleniyor',
        body: 'Planlama adımında hızlı çözüm yerine dengeli yaklaşımı kontrol et.',
        tone: 'warning',
        priority: 'high',
        iconKey: 'pulse-outline',
        sourceLabel: 'Olay riski',
        sourceIds: [event.id, `risk:${riskLevel}`],
      },
    };
  }

  if (riskLevel === 'medium' || riskDelta > 0) {
    return {
      score: 45,
      finding: {
        id: 'finding-risk',
        kind: 'risk',
        title: 'Risk sinyali var',
        body: 'Karar, bölgedeki güven algısını etkileyebilir.',
        tone: 'neutral',
        priority: 'normal',
        iconKey: 'pulse-outline',
        sourceLabel: 'Olay riski',
        sourceIds: [event.id, `risk:${riskLevel}`],
      },
    };
  }

  return null;
}

function buildDistrictFinding(event: EventCard): FindingCandidate | null {
  const district = sanitizeText(event.district, '');
  if (!district) return null;

  return {
    score: 60,
    finding: {
      id: 'finding-district',
      kind: 'district',
      title: 'Mahalle etkisi var',
      body: `${district} bölgesindeki güven algısı plan tercihine duyarlı.`,
      tone: 'neutral',
      priority: 'normal',
      iconKey: 'location-outline',
      sourceLabel: 'Mahalle',
      sourceIds: [event.id, event.neighborhoodId ?? district],
    },
  };
}

function buildSocialFinding(event: EventCard): FindingCandidate | null {
  const satisfaction = event.previewEffects?.publicSatisfaction ?? 0;
  if (Math.abs(satisfaction) < 2) return null;

  const sensitive = satisfaction <= -5;
  return {
    score: sensitive ? 70 : 55,
    finding: {
      id: 'finding-social',
      kind: 'social',
      title: sensitive ? 'Sosyal tepki hassas' : 'Sosyal etki izleniyor',
      body: sensitive
        ? 'Vatandaş memnuniyeti plan tercihine duyarlı.'
        : 'Sosyal nabız bu kararda ölçülebilir etki gösterebilir.',
      tone: sensitive ? 'warning' : 'neutral',
      priority: sensitive ? 'high' : 'normal',
      iconKey: 'chatbubbles-outline',
      sourceLabel: 'Sosyal nabız',
      sourceIds: [event.id, `social:${satisfaction}`],
    },
  };
}

function buildResourceFinding(event: EventCard): FindingCandidate | null {
  if (!hasResourcePressure(event)) return null;

  return {
    score: 65,
    finding: {
      id: 'finding-resource',
      kind: 'resource',
      title: 'Kaynak baskısı oluşabilir',
      body: 'Hızlı çözüm daha fazla kaynak tüketebilir.',
      tone: 'warning',
      priority: 'normal',
      iconKey: 'briefcase-outline',
      sourceLabel: 'Kaynak planı',
      sourceIds: [event.id, 'resource:costs'],
    },
  };
}

function buildDomainFinding(
  event: EventCard,
  focus: EventDomainUiFocus,
): FindingCandidate | null {
  switch (focus) {
    case 'vehicle_route':
      return {
        score: 68,
        finding: {
          id: 'finding-route',
          kind: 'route',
          title: 'Rota süresi kritik',
          body: 'Yönlendirme aşamasında uygun ekip seçimi önemli.',
          tone: 'warning',
          priority: 'normal',
          iconKey: 'git-network-outline',
          sourceLabel: 'Rota',
          sourceIds: [event.id, 'domain:vehicle_route'],
        },
      };
    case 'personnel':
      return {
        score: 66,
        finding: {
          id: 'finding-team',
          kind: 'team',
          title: 'Ekip temposu önemli',
          body: 'Personel yükü plan ve yönlendirme seçimlerini etkileyebilir.',
          tone: 'neutral',
          priority: 'normal',
          iconKey: 'people-outline',
          sourceLabel: 'Ekip',
          sourceIds: [event.id, 'domain:personnel'],
        },
      };
    case 'social':
      return buildSocialFinding(event);
    case 'crisis_adjacent':
      return {
        score: 72,
        finding: {
          id: 'finding-risk',
          kind: 'risk',
          title: 'Risk sinyali birleşiyor',
          body: 'Önleyici planlama bugün daha güvenli olabilir.',
          tone: 'warning',
          priority: 'high',
          iconKey: 'alert-circle-outline',
          sourceLabel: 'Risk sinyali',
          sourceIds: [event.id, 'domain:crisis_adjacent'],
        },
      };
  }
  return null;
}

function buildFallbackFindings(event: EventCard): EventInspectFinding[] {
  return [
    {
      id: 'finding-context',
      kind: 'general',
      title: 'Olay bağlamı hazır',
      body: 'Planlama adımında yaklaşım seçerek etkileri karşılaştır.',
      tone: 'neutral',
      priority: 'low',
      iconKey: 'document-text-outline',
      sourceLabel: 'Olay özeti',
      sourceIds: [event.id, 'fallback:context'],
    },
    {
      id: 'finding-impact',
      kind: 'opportunity',
      title: 'Operasyon etkisi',
      body: 'Seçtiğin yaklaşım kaynak ve sosyal etkiyi şekillendirecek.',
      tone: 'neutral',
      priority: 'low',
      iconKey: 'analytics-outline',
      sourceLabel: 'Operasyon',
      sourceIds: [event.id, 'fallback:impact'],
    },
  ];
}

export function buildEventInspectFindings(
  event: EventCard,
  varietyInput?: Pick<
    BuildEventInspectPhasePresentationInput,
    'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles' | 'authorityGameplayContext'
  >,
): EventInspectFinding[] {
  const focus = inferEventDomainUiFocus(event);
  const varietyProfile = getEventGameplayVarietyProfile(event, {
    day: varietyInput?.day,
    isDay1LearningEvent: varietyInput?.isDay1LearningEvent,
    recentProfiles: varietyInput?.recentVarietyProfiles,
  });
  const candidates: FindingCandidate[] = [];

  const risk = buildRiskFinding(event);
  if (risk) candidates.push(risk);

  const district = buildDistrictFinding(event);
  if (district) candidates.push(district);

  const social = buildSocialFinding(event);
  if (social && social.finding.kind !== (risk?.finding.kind ?? '')) {
    candidates.push(social);
  }

  const resource = buildResourceFinding(event);
  if (resource) candidates.push(resource);

  const domain = buildDomainFinding(event, focus);
  if (domain) candidates.push(domain);

  const usedKinds = new Set<EventInspectFindingKind>();
  const usedSourceKeys = new Set<string>();
  const selected: EventInspectFinding[] = [];

  const sorted = [...candidates]
    .map((candidate) => ({
      ...candidate,
      score:
        candidate.score +
        varietyInspectFindingScoreBoost(candidate.finding, varietyProfile),
    }))
    .sort((a, b) => b.score - a.score);

  for (const candidate of sorted) {
    if (selected.length >= 3) break;
    if (usedKinds.has(candidate.finding.kind)) continue;
    const sourceKey = candidate.finding.sourceIds.join('|');
    if (usedSourceKeys.has(sourceKey)) continue;

    usedKinds.add(candidate.finding.kind);
    usedSourceKeys.add(sourceKey);
    selected.push(candidate.finding);
  }

  if (selected.length < 2) {
    for (const fallback of buildFallbackFindings(event)) {
      if (selected.length >= 3) break;
      if (usedKinds.has(fallback.kind)) continue;
      usedKinds.add(fallback.kind);
      selected.push(fallback);
    }
  }

  const enriched = enrichInspectFindingsWithVariety(selected.slice(0, 3), event, {
    day: varietyInput?.day,
    isDay1LearningEvent: varietyInput?.isDay1LearningEvent,
    recentProfiles: varietyInput?.recentVarietyProfiles,
  });

  return applyAuthorityToInspectFindings(
    enriched,
    event,
    varietyInput?.authorityGameplayContext,
    varietyProfile,
  );
}

export function buildEventInspectAdvisorComment(
  findings: EventInspectFinding[],
  input: Pick<BuildEventInspectPhasePresentationInput, 'isDay1LearningEvent' | 'day'>,
): EventInspectAdvisorComment | undefined {
  if (input.isDay1LearningEvent || input.day === 1) {
    return {
      title: 'Ece',
      text: 'Önce olayı inceliyoruz. Bulgular, planlama adımında hangi yaklaşımın daha güvenli olduğunu gösterecek.',
      tone: 'teaching',
    };
  }

  const hasUrgent = findings.some((f) => f.priority === 'urgent');
  const hasWarning = findings.some((f) => f.tone === 'warning' || f.priority === 'high');

  if (hasUrgent) {
    return {
      title: 'Ece',
      text: 'Risk sinyali güçlü. Planlama adımında hızlı çözüm yerine dengeli yaklaşımı kontrol et.',
      tone: 'warning',
    };
  }

  if (hasWarning) {
    return {
      title: 'Ece',
      text: 'Bu olayda risk sinyali var. Planlama adımında kaynak ve sosyal etkiyi birlikte değerlendir.',
      tone: 'warning',
    };
  }

  return {
    title: 'Ece',
    text: 'Bulgular net. Planlama adımında kaynak ve sosyal etkiyi karşılaştırabilirsin.',
    tone: 'calm',
  };
}

function buildInspectCta(interactionState: EventInspectInteractionState): EventInspectCta {
  if (interactionState === 'analyzing') {
    return {
      label: 'Analiz ediliyor…',
      actionKey: 'disabled',
      enabled: false,
    };
  }

  if (interactionState === 'revealed') {
    return {
      label: 'Planlamaya Geç',
      actionKey: 'go_to_plan',
      enabled: true,
    };
  }

  return {
    label: 'İncelemeyi Başlat',
    actionKey: 'start_inspection',
    enabled: true,
  };
}

function buildFooterHint(interactionState: EventInspectInteractionState): string {
  switch (interactionState) {
    case 'analyzing':
      return 'Olay verileri taranıyor…';
    case 'revealed':
      return 'İnceleme tamam; plan aşamasına geçebilirsin.';
    default:
      return 'İncelemeyi başlat; bulgular kısa sürede açılacak.';
  }
}

function buildAccessibilityLabel(
  event: EventCard,
  interactionState: EventInspectInteractionState,
  findingsCount: number,
): string {
  const chips = buildInspectHeroChips(event);
  const stateLabel =
    interactionState === 'idle'
      ? 'inceleme bekleniyor'
      : interactionState === 'analyzing'
        ? 'analiz sürüyor'
        : `${findingsCount} bulgu açık`;
  return `${event.title}, ${event.district}, ${chips.priority}, ${stateLabel}`;
}

export function buildEventInspectPhasePresentation(
  input: BuildEventInspectPhasePresentationInput,
): EventInspectPhasePresentation {
  const { event, interactionState, reducedMotion = false } = input;
  const findings = buildEventInspectFindings(event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentVarietyProfiles: input.recentVarietyProfiles,
    authorityGameplayContext: input.authorityGameplayContext,
  });
  const scanDurationMs = operationMotionScanDurationMs(reducedMotion);
  const focus = inferEventDomainUiFocus(event);
  const domainLabel = DOMAIN_SHORT_LABELS[focus];
  const chips = buildInspectHeroChips(event);

  const status: EventInspectPhaseStatus =
    interactionState === 'revealed' ? 'revealed' : interactionState;

  const showFindings = interactionState === 'revealed';
  const advisorComment = showFindings
    ? buildEventInspectAdvisorComment(findings, input)
    : undefined;

  return {
    title: 'İncele',
    subtitle: chips.remaining,
    summary: sanitizeText(event.description, `${event.title} — ${event.district} bölgesinde operasyon gerektiriyor.`),
    domainLabel,
    status,
    findings,
    advisorComment,
    primaryCta: buildInspectCta(interactionState),
    footerHint: buildFooterHint(interactionState),
    scanHint: {
      shouldShowScanLine: interactionState === 'analyzing' && !reducedMotion,
      revealLevel: reducedMotion ? 'none' : 'soft',
      estimatedDurationMs: scanDurationMs,
    },
    accessibilityLabel: buildAccessibilityLabel(event, interactionState, findings.length),
    showFindings,
    showAdvisorComment: showFindings && Boolean(advisorComment?.text),
  };
}

export function getInspectFindingRevealTiming(
  index: number,
  reducedMotion: boolean,
): { durationMs: number; delayMs: number; enabled: boolean } {
  return operationMotionFindingRevealTiming(index, reducedMotion);
}

export function isAllowedInspectFindingKind(kind: string): kind is EventInspectFindingKind {
  return ALLOWED_FINDING_KINDS.includes(kind as EventInspectFindingKind);
}

export function auditEventInspectPhasePresentation(
  model: EventInspectPhasePresentation,
): string[] {
  const issues: string[] = [];

  if (!model.title.trim()) issues.push('title empty');
  if (!model.summary.trim()) issues.push('summary empty');
  if (!model.accessibilityLabel.trim()) issues.push('accessibilityLabel empty');
  if (model.findings.length < 2) issues.push('findings below minimum');
  if (model.findings.length > 3) issues.push('findings above maximum');

  const ids = new Set<string>();
  const kinds = new Set<string>();
  const sourceKeys = new Set<string>();

  for (const finding of model.findings) {
    if (!finding.title.trim()) issues.push(`finding ${finding.id} title empty`);
    if (!finding.body.trim()) issues.push(`finding ${finding.id} body empty`);
    if (!isAllowedInspectFindingKind(finding.kind)) {
      issues.push(`finding ${finding.id} invalid kind`);
    }
    if (ids.has(finding.id)) issues.push(`duplicate finding id ${finding.id}`);
    ids.add(finding.id);

    if (kinds.has(finding.kind)) issues.push(`duplicate finding kind ${finding.kind}`);
    kinds.add(finding.kind);

    const sourceKey = finding.sourceIds.join('|');
    if (sourceKeys.has(sourceKey)) issues.push(`duplicate sourceIds ${sourceKey}`);
    sourceKeys.add(sourceKey);

    if (
      finding.priority !== 'urgent' &&
      finding.tone === 'urgent' &&
      finding.kind === 'general'
    ) {
      issues.push('fake urgent on fallback');
    }
  }

  if (model.advisorComment && !model.advisorComment.text.trim()) {
    issues.push('advisorComment text empty');
  }

  if (model.status === 'idle' && model.primaryCta.actionKey !== 'start_inspection') {
    issues.push('idle CTA should start_inspection');
  }
  if (model.status === 'revealed' && model.primaryCta.actionKey !== 'go_to_plan') {
    issues.push('revealed CTA should go_to_plan');
  }
  if (model.status === 'analyzing' && model.primaryCta.enabled) {
    issues.push('analyzing CTA should be disabled');
  }

  const scanMs = model.scanHint.estimatedDurationMs;
  if (scanMs < 0 || scanMs > 900) {
    issues.push('scan duration out of range');
  }

  return issues;
}
