import type { EventCard } from '@/core/models/EventCard';
import { getRiskLevelLabel } from '@/core/content/mockGameData';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';

export type OperationWorkflowStepId =
  | 'inspect'
  | 'plan'
  | 'assign'
  | 'field'
  | 'result';

export const OPERATION_WORKFLOW_STEPS: Array<{
  id: OperationWorkflowStepId;
  label: string;
}> = [
  { id: 'inspect', label: 'İncele' },
  { id: 'plan', label: 'Planla' },
  { id: 'assign', label: 'Yönlendir' },
  { id: 'field', label: 'Sahada' },
  { id: 'result', label: 'Sonuç' },
];

export type SignalLevel = 'low' | 'medium' | 'high';

export type SignalSummaryItem = {
  id: string;
  label: string;
  level: SignalLevel;
  levelLabel: string;
};

export type EvidenceMetric = {
  id: string;
  icon: 'images-outline' | 'location-outline' | 'briefcase-outline' | 'time-outline';
  line: string;
};

export const INSPECT_MAIN_FINDINGS_TEXT =
  'Mahalle güveni son 4 haftada belirgin şekilde azaldı. Şikayetler güvenlik ve gece aydınlatması etrafında yoğunlaşıyor.';

export function formatEventRemainingLabel(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}dk kaldı`;
  if (m <= 0) return `${h}s kaldı`;
  return `${h}s ${m}dk kaldı`;
}

function signalLevelLabel(level: SignalLevel): string {
  switch (level) {
    case 'high':
      return 'Yüksek';
    case 'medium':
      return 'Orta';
    default:
      return 'Düşük';
  }
}

export function buildSignalSummary(event: EventCard): SignalSummaryItem[] {
  const fieldLevel: SignalLevel =
    event.riskLevel === 'critical' || event.riskLevel === 'high'
      ? 'high'
      : event.riskLevel === 'medium'
        ? 'medium'
        : 'low';

  const citizenLevel: SignalLevel =
    event.previewEffects.publicSatisfaction <= -5 || event.riskLevel === 'critical'
      ? 'high'
      : 'medium';

  const socialLevel: SignalLevel =
    event.riskLevel === 'critical' ? 'high' : event.riskLevel === 'high' ? 'medium' : 'medium';

  return [
    {
      id: 'field',
      label: 'Saha',
      level: fieldLevel,
      levelLabel: signalLevelLabel(fieldLevel),
    },
    {
      id: 'citizen',
      label: 'Vatandaş',
      level: citizenLevel,
      levelLabel: signalLevelLabel(citizenLevel),
    },
    {
      id: 'social',
      label: 'Sosyal',
      level: socialLevel,
      levelLabel: signalLevelLabel(socialLevel),
    },
  ];
}

export function buildEvidenceMetrics(event: EventCard): EvidenceMetric[] {
  const photoCount = isDay1LearningEventId(event.id) ? 8 : 5;
  const mapPoints = isDay1LearningEventId(event.id) ? 6 : 4;
  const similarCases = isDay1LearningEventId(event.id) ? 3 : 2;
  const estimateMinutes = isDay1LearningEventId(event.id) ? 15 : 20;

  return [
    {
      id: 'photos',
      icon: 'images-outline',
      line: `${photoCount} Fotoğraf Kanıt`,
    },
    {
      id: 'map',
      icon: 'location-outline',
      line: `${mapPoints} Nokta Haritada`,
    },
    {
      id: 'similar',
      icon: 'briefcase-outline',
      line: `${similarCases} Benzer Vaka`,
    },
    {
      id: 'eta',
      icon: 'time-outline',
      line: `Tahmini ${estimateMinutes} dk`,
    },
  ];
}

export function buildInspectHeroChips(event: EventCard) {
  return {
    priority: `Öncelik: ${getRiskLevelLabel(event.riskLevel)}`,
    remaining: formatEventRemainingLabel(event.urgencyHours),
  };
}

export const INSPECT_HINT_TEXT =
  'İnceleme tamam; plan aşamasına geçebilirsin.';

/** Hint + 10px gap + CTA — scroll padding için */
export const EVENT_WORKFLOW_FOOTER_EXTRA = 56;

export function resolveInspectDistrictId(
  event: Pick<EventCard, 'districtIds' | 'district'>,
): string | undefined {
  if (event.districtIds?.[0]) {
    return event.districtIds[0];
  }
  const name = event.district.toLowerCase();
  if (name.includes('cumhuriyet')) return 'cumhuriyet';
  if (name.includes('sanayi') || name.includes('endüstriyel')) {
    return 'industrial_market';
  }
  if (name.includes('merkez') || name.includes('central')) return 'central';
  return undefined;
}
