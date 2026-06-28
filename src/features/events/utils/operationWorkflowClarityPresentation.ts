import { getRiskLevelLabel } from '@/core/content/mockGameData';
import type { EventCard } from '@/core/models/EventCard';
import type {
  EventInspectAdvisorComment,
  EventInspectFinding,
  EventInspectInteractionState,
} from '@/features/events/utils/eventInspectPhasePresentation';
import type { OperationPhaseShellPresentation } from '@/features/events/utils/operationPhaseTransitionPresentation';

export type OperationInvestigationSignalId = 'field' | 'citizen' | 'social';

export type OperationInspectHeroVisualVariant =
  | 'school_cleaning'
  | 'container_overflow'
  | 'lighting_issue'
  | 'route_delay'
  | 'generic_city_signal';

export type OperationInspectHeroMarker = {
  id: string;
  iconKey: string;
  label: string;
  x: number;
  y: number;
  tone: 'teal' | 'gold' | 'warning';
};

export type OperationInspectHeroChip = {
  id: string;
  label: string;
  tone: 'teal' | 'gold' | 'warning';
};

export type OperationInvestigationBrief = {
  title: string;
  heroSubtitle: string;
  districtLine: string;
  locationLabel: string;
  priorityLabel: string;
  infoProgressLabel: string;
  planQualityLabel: string;
  missingInfoLabel: string;
  confidenceLabel: string;
  riskLine: string;
  heroVisualVariant: OperationInspectHeroVisualVariant;
  markerItems: OperationInspectHeroMarker[];
  topChips: OperationInspectHeroChip[];
};

export type OperationInvestigationChecklistItem = {
  id: OperationInvestigationSignalId;
  title: string;
  body: string;
  status: 'verified' | 'waiting' | 'locked' | 'optional';
  statusLabel: string;
  impactLabel: string;
  ctaLabel?: string;
};

export type OperationPlanningImpact = {
  title: string;
  lines: string[];
};

export type OperationWorkflowAdvisorHint = {
  title: string;
  text: string;
  tone: EventInspectAdvisorComment['tone'];
};

export type OperationPrimaryCta = {
  label: string;
  enabled: boolean;
  disabledReason?: string;
  actionKey: 'verify_first' | 'complete_missing' | 'verify_critical' | 'go_to_plan' | 'wait';
};

export type OperationWorkflowClarityPresentation = {
  phaseHeader: OperationPhaseShellPresentation;
  investigationBrief: OperationInvestigationBrief;
  investigationChecklist: OperationInvestigationChecklistItem[];
  planningImpact: OperationPlanningImpact;
  advisorHint: OperationWorkflowAdvisorHint;
  primaryCta: OperationPrimaryCta;
  densityBand: 'day1_simple' | 'strategic';
  verifiedCount: number;
  requiredCount: number;
};

export type BuildOperationWorkflowClarityInput = {
  event: EventCard;
  day: number;
  interactionState: EventInspectInteractionState;
  confirmedSignalIds: OperationInvestigationSignalId[];
  findings: EventInspectFinding[];
  advisorComment?: EventInspectAdvisorComment;
  phaseHeader: OperationPhaseShellPresentation;
  isDay1LearningEvent?: boolean;
};

function clampLine(value: string, max = 116): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function riskBand(event: EventCard): 'low' | 'medium' | 'high' {
  if (event.riskLevel === 'critical' || event.riskLevel === 'high') return 'high';
  if (event.riskLevel === 'medium') return 'medium';
  return 'low';
}

function normalizeMatchText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildHeroVisualVariant(event: EventCard): OperationInspectHeroVisualVariant {
  const haystack = normalizeMatchText(
    `${event.title} ${event.category} ${event.description} ${event.contextTag}`,
  );
  if (
    (haystack.includes('okul') || haystack.includes('school')) &&
    (haystack.includes('temizlik') || haystack.includes('cop') || haystack.includes('waste'))
  ) {
    return 'school_cleaning';
  }
  if (
    haystack.includes('konteyner') ||
    haystack.includes('container') ||
    haystack.includes('overflow')
  ) {
    return 'container_overflow';
  }
  if (
    haystack.includes('aydin') ||
    haystack.includes('light') ||
    haystack.includes('lighting')
  ) {
    return 'lighting_issue';
  }
  if (haystack.includes('rota') || haystack.includes('route')) return 'route_delay';
  return 'generic_city_signal';
}

function markerIconForFinding(finding: EventInspectFinding): string {
  switch (finding.kind) {
    case 'district':
      return 'location';
    case 'social':
      return 'chatbubble-ellipses';
    case 'resource':
    case 'team':
      return 'briefcase';
    case 'route':
      return 'git-branch';
    case 'risk':
      return 'alert';
    default:
      return 'radio';
  }
}

function markerLabelForFinding(finding: EventInspectFinding): string {
  switch (finding.kind) {
    case 'district':
      return 'Konum';
    case 'social':
      return 'Vatandaş';
    case 'resource':
      return 'Kaynak';
    case 'team':
      return 'Ekip';
    case 'route':
      return 'Rota';
    case 'risk':
      return 'Uyarı';
    default:
      return 'Sinyal';
  }
}

function markerToneForFinding(finding: EventInspectFinding): OperationInspectHeroMarker['tone'] {
  if (finding.tone === 'urgent' || finding.tone === 'warning') return 'warning';
  if (finding.kind === 'district' || finding.kind === 'resource') return 'gold';
  return 'teal';
}

function buildHeroMarkers(findings: EventInspectFinding[]): OperationInspectHeroMarker[] {
  const anchors = [
    { x: 26, y: 43 },
    { x: 69, y: 64 },
    { x: 52, y: 31 },
  ];

  return findings.slice(0, 3).map((finding, index) => ({
    id: `hero-marker-${finding.id}`,
    iconKey: markerIconForFinding(finding),
    label: markerLabelForFinding(finding),
    x: anchors[index]?.x ?? 48,
    y: anchors[index]?.y ?? 48,
    tone: markerToneForFinding(finding),
  }));
}

function buildHeroSubtitle(event: EventCard, riskLabel: string): string {
  const district = event.district?.trim() || 'Bölge';
  const category = event.category?.trim();
  if (category) return `${district} · ${riskLabel} Öncelik`;
  return `${district} · Olay noktası inceleniyor`;
}

function buildRiskLine(event: EventCard, findings: EventInspectFinding[]): string {
  const urgent = findings.find((finding) => finding.priority === 'urgent');
  if (urgent) return urgent.body;

  const warning = findings.find(
    (finding) => finding.tone === 'warning' || finding.priority === 'high',
  );
  if (warning) return warning.body;

  if ((event.previewEffects?.publicSatisfaction ?? 0) < 0) {
    return 'Mahalle tepkisi plan tercihine duyarlı.';
  }
  return 'Plan seçimi güven ve kaynak etkisini belirleyecek.';
}

function buildChecklistItem(input: {
  id: OperationInvestigationSignalId;
  title: string;
  fallbackBody: string;
  impactLabel: string;
  finding?: EventInspectFinding;
  bodyPrefix?: string;
  verified: boolean;
  day: number;
  isDay1: boolean;
}): OperationInvestigationChecklistItem {
  const locked = input.isDay1 && input.id === 'social' && !input.verified;
  const optional = input.day <= 2 && input.id === 'social' && !input.verified;
  const status: OperationInvestigationChecklistItem['status'] = input.verified
    ? 'verified'
    : locked
      ? 'locked'
      : optional
        ? 'optional'
        : 'waiting';

  const statusLabel =
    status === 'verified'
      ? 'Doğrulandı'
      : status === 'locked'
        ? 'Kilitli'
        : status === 'optional'
          ? 'Opsiyonel'
          : 'Bekliyor';

  return {
    id: input.id,
    title: input.title,
    body: clampLine(
      input.finding ? `${input.bodyPrefix ?? ''}${input.finding.body}` : input.fallbackBody,
      92,
    ),
    status,
    statusLabel,
    impactLabel: input.impactLabel,
    ctaLabel:
      status === 'waiting'
        ? input.id === 'field'
          ? 'Saha bulgusunu doğrula'
          : input.id === 'citizen'
            ? 'Vatandaş tepkisini doğrula'
            : 'Sosyal nabzı kontrol et'
        : undefined,
  };
}

function buildChecklist(
  input: BuildOperationWorkflowClarityInput,
): OperationInvestigationChecklistItem[] {
  const byKind = new Map(input.findings.map((finding) => [finding.kind, finding]));
  const confirmed = new Set(input.confirmedSignalIds);
  const isDay1 = input.isDay1LearningEvent === true || input.day <= 1;

  return [
    buildChecklistItem({
      id: 'field',
      title: 'Saha bulgusu',
      fallbackBody: 'Olayın sahadaki ana izi henüz netleşmedi.',
      impactLabel: riskBand(input.event) === 'high' ? 'Güven riski' : 'Plan kalitesi',
      finding: byKind.get('risk') ?? byKind.get('route') ?? byKind.get('general'),
      verified: confirmed.has('field'),
      day: input.day,
      isDay1,
    }),
    buildChecklistItem({
      id: 'citizen',
      title: 'Vatandaş geri bildirimi',
      fallbackBody: 'Mahalle tepkisi henüz ölçülmedi.',
      impactLabel: 'Tepki riski',
      finding: byKind.get('district') ?? byKind.get('social'),
      bodyPrefix: byKind.get('district') ? undefined : 'Geri bildirim: ',
      verified: confirmed.has('citizen'),
      day: input.day,
      isDay1,
    }),
    buildChecklistItem({
      id: 'social',
      title: 'Sosyal nabız',
      fallbackBody: 'Şikayet yayılımı kontrol edilmedi.',
      impactLabel: input.day >= 8 ? 'Kamu baskısı' : 'Öğrenme sinyali',
      finding: byKind.get('social') ?? byKind.get('resource'),
      bodyPrefix: byKind.get('social') ? 'Yayilim: ' : undefined,
      verified: confirmed.has('social'),
      day: input.day,
      isDay1,
    }),
  ];
}

function buildPlanningImpact(
  event: EventCard,
  findings: EventInspectFinding[],
): OperationPlanningImpact {
  const highRisk = riskBand(event) === 'high';
  const hasResource = findings.some((finding) => finding.kind === 'resource');
  const hasTeam = findings.some((finding) => finding.kind === 'team');
  const hasSocial = findings.some((finding) => finding.kind === 'social');

  const firstLine = highRisk
    ? 'Güven riski yüksek; plan seçiminde hız kadar doğru ekip de önemli.'
    : hasSocial
      ? 'Mahalle tepkisi plan tercihine duyarlı; iletişim etkisini hesaba kat.'
      : 'Risk kontrol edilebilir; plan kalitesi ekip ve kaynak uyumuna bağlı.';

  const secondLine =
    hasResource || hasTeam
      ? 'Kaynak veya ekip baskısı varsa ağır müdahale yerine dengeli plan daha güvenli olabilir.'
      : 'Kaynak baskısı düşükse standart ekip bu olay için yeterli olabilir.';

  return {
    title: 'Planlamaya Etki',
    lines: [clampLine(firstLine, 104), clampLine(secondLine, 104)],
  };
}

function buildAdvisorHint(
  event: EventCard,
  findings: EventInspectFinding[],
  advisorComment?: EventInspectAdvisorComment,
): OperationWorkflowAdvisorHint {
  const risk = findings.find((finding) => finding.priority === 'urgent' || finding.tone === 'warning');
  const district = event.district?.trim() || 'bu bölge';
  const fallback = risk
    ? `${risk.title.toLocaleLowerCase('tr-TR')} netleşmeden ekip seçme. Yanlış plan kaynak harcar ama etkiyi toparlamaz.`
    : `${district} için önce eksik bilgiyi netleştir. Plan seçimi güven etkisini doğrudan belirleyecek.`;

  return {
    title: advisorComment?.title?.trim() || 'Ece',
    text: clampLine(advisorComment?.text?.trim() || fallback, 150),
    tone: advisorComment?.tone ?? 'teaching',
  };
}

function buildPrimaryCta(input: {
  checklist: OperationInvestigationChecklistItem[];
  verifiedCount: number;
  requiredCount: number;
  interactionState: EventInspectInteractionState;
  day: number;
}): OperationPrimaryCta {
  if (input.interactionState === 'analyzing') {
    return {
      label: 'Bilgi doğrulanıyor',
      enabled: false,
      disabledReason: 'Sinyal taraması sürüyor.',
      actionKey: 'wait',
    };
  }

  const missing = Math.max(0, input.requiredCount - input.verifiedCount);
  if (missing <= 0 || input.interactionState === 'revealed') {
    return {
      label: 'Planlamaya geç',
      enabled: true,
      actionKey: 'go_to_plan',
    };
  }

  const firstWaiting = input.checklist.find((item) => item.status === 'waiting');
  if (input.day <= 1 && input.verifiedCount === 0) {
    return {
      label: 'İlk bilgiyi doğrula',
      enabled: true,
      disabledReason: 'Planlamaya geçmek için 1 bilgi daha gerekli.',
      actionKey: 'verify_first',
    };
  }

  if (firstWaiting?.id === 'field') {
    return {
      label: 'Eksik saha bulgusunu tamamla',
      enabled: true,
      disabledReason: 'Planlamaya geçmek için saha bulgusu gerekli.',
      actionKey: 'verify_critical',
    };
  }

  return {
    label: `${missing} bilgiyi daha doğrula`,
    enabled: true,
    disabledReason: `Planlamaya geçmek için ${missing} bilgi daha gerekli.`,
    actionKey: 'complete_missing',
  };
}

export function buildOperationWorkflowClarityPresentation(
  input: BuildOperationWorkflowClarityInput,
): OperationWorkflowClarityPresentation {
  const checklist = buildChecklist(input);
  const requiredItems = checklist.filter((item) => item.status !== 'optional' && item.status !== 'locked');
  const verifiedCount =
    input.interactionState === 'revealed'
      ? requiredItems.length
      : requiredItems.filter((item) => item.status === 'verified').length;
  const requiredCount = Math.max(1, requiredItems.length);
  const missingCount = Math.max(0, requiredCount - verifiedCount);
  const riskLabel = getRiskLevelLabel(input.event.riskLevel);
  const priorityLabel = `${riskLabel} Öncelik`;
  const infoProgressLabel = `${verifiedCount}/${requiredCount} bilgi`;
  const missingInfoLabel =
    missingCount > 0 ? `Plan için eksik: ${missingCount} sinyal` : 'Plan için bilgi tamam';
  const planQualityShort =
    verifiedCount >= requiredCount ? 'Hazır' : verifiedCount === 0 ? 'Düşük' : 'Orta';
  const confidenceLabel =
    verifiedCount >= requiredCount
      ? 'Plan kalitesi: Hazır'
      : verifiedCount === 0
        ? 'Plan kalitesi: Düşük'
        : 'Plan kalitesi: Orta';

  const phaseHeader: OperationPhaseShellPresentation = {
    ...input.phaseHeader,
    statusSummary:
      verifiedCount >= requiredCount
        ? `${verifiedCount}/${requiredCount} bilgi doğrulandı · Risk ${riskLabel}`
        : `${verifiedCount}/${requiredCount} bilgi doğrulandı · Risk ${riskLabel}`,
    metrics: [
      {
        label: 'Bilgi',
        value: `Bilgi ${verifiedCount}/${requiredCount}`,
        tone: verifiedCount >= requiredCount ? 'positive' : 'mixed',
      },
      {
        label: 'Öncelik',
        value: priorityLabel,
        tone: riskBand(input.event) === 'high' ? 'warning' : 'neutral',
      },
    ],
  };

  return {
    phaseHeader,
    investigationBrief: {
      title: input.event.title || 'Operasyon olayı',
      heroSubtitle: buildHeroSubtitle(input.event, riskLabel),
      districtLine: `${input.event.district || 'Bölge'} · ${priorityLabel}`,
      locationLabel: input.event.district || 'Bölge',
      priorityLabel,
      infoProgressLabel,
      planQualityLabel: planQualityShort,
      missingInfoLabel,
      confidenceLabel,
      riskLine: clampLine(buildRiskLine(input.event, input.findings), 112),
      heroVisualVariant: buildHeroVisualVariant(input.event),
      markerItems: buildHeroMarkers(input.findings),
      topChips: [
        {
          id: 'info',
          label: `Bilgi ${verifiedCount}/${requiredCount}`,
          tone: verifiedCount >= requiredCount ? 'teal' : 'gold',
        },
        {
          id: 'priority',
          label: priorityLabel,
          tone: riskBand(input.event) === 'high' ? 'warning' : 'gold',
        },
      ],
    },
    investigationChecklist: checklist,
    planningImpact: buildPlanningImpact(input.event, input.findings),
    advisorHint: buildAdvisorHint(input.event, input.findings, input.advisorComment),
    primaryCta: buildPrimaryCta({
      checklist,
      verifiedCount,
      requiredCount,
      interactionState: input.interactionState,
      day: input.day,
    }),
    densityBand: input.day <= 1 || input.isDay1LearningEvent ? 'day1_simple' : 'strategic',
    verifiedCount,
    requiredCount,
  };
}

export function auditOperationWorkflowClarityPresentation(
  model: OperationWorkflowClarityPresentation,
): string[] {
  const issues: string[] = [];
  if (!model.phaseHeader.title.trim()) issues.push('phase header title empty');
  if (!model.phaseHeader.statusSummary?.trim()) issues.push('phase header status empty');
  if (!model.investigationBrief.title.trim()) issues.push('hero title empty');
  if (!model.investigationBrief.locationLabel.trim()) issues.push('hero location empty');
  if (!model.investigationBrief.priorityLabel.trim()) issues.push('hero priority empty');
  if (!model.investigationBrief.infoProgressLabel.trim()) issues.push('hero info progress empty');
  if (!model.investigationBrief.planQualityLabel.trim()) issues.push('hero plan quality empty');
  if (model.investigationBrief.topChips.some((chip) => chip.label.trim() === 'Açık')) {
    issues.push('bare Açık chip');
  }
  if (model.investigationBrief.markerItems.length > 3) issues.push('hero marker count');
  if (model.investigationChecklist.length < 1 || model.investigationChecklist.length > 3) {
    issues.push('checklist item count');
  }

  const bodies = new Set<string>();
  for (const item of model.investigationChecklist) {
    if (!item.title.trim()) issues.push(`checklist ${item.id} title empty`);
    if (!item.body.trim()) issues.push(`checklist ${item.id} body empty`);
    if (item.status === 'verified' && item.ctaLabel) issues.push(`verified item ${item.id} has cta`);
    const normalized = item.body.toLocaleLowerCase('tr-TR');
    if (bodies.has(normalized)) issues.push(`duplicate checklist copy ${item.id}`);
    bodies.add(normalized);
  }

  if (model.verifiedCount === 0) {
    const verifiedItems = model.investigationChecklist.filter((item) => item.status === 'verified');
    if (verifiedItems.length > 0) issues.push('0 progress with verified checklist items');
  }

  if (!model.primaryCta.label.trim()) issues.push('primary CTA empty');
  if (model.verifiedCount < model.requiredCount && model.primaryCta.label === 'Planlamaya geç') {
    issues.push('missing info allows planning CTA');
  }
  if (model.advisorHint.text.length > 170) issues.push('advisor hint too long');
  if (model.planningImpact.lines.length < 1 || model.planningImpact.lines.length > 3) {
    issues.push('planning impact line count');
  }
  return issues;
}
