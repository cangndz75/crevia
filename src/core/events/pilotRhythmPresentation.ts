import type { EventCard } from '@/core/models/EventCard';

import { getPilotRhythmPlan } from './pilotRhythmConstants';
import type { PilotDayRole } from './pilotRhythmTypes';

const ROLE_SHORT_LABELS: Record<PilotDayRole, string> = {
  tutorial: 'Öğretme',
  first_pressure: 'İlk Baskı',
  resource_split: 'Kaynak Bölme',
  social_visibility: 'Sosyal Görünürlük',
  opportunity: 'Fırsat Günü',
  butterfly_seed: 'Kelebek Tohumu',
  final_stress: 'Final Baskısı',
};

const ROLE_CHIP_LABELS: Record<PilotDayRole, string> = {
  tutorial: 'Gün 1 · Öğretme',
  first_pressure: 'Gün 2 · İlk Baskı',
  resource_split: 'Gün 3 · Kaynak Bölme',
  social_visibility: 'Gün 4 · Sosyal Görünürlük',
  opportunity: 'Gün 5 · Fırsat',
  butterfly_seed: 'Gün 6 · Yankı',
  final_stress: 'Final Baskısı',
};

export function getPilotDayRoleLabel(role: PilotDayRole): string {
  return ROLE_SHORT_LABELS[role] ?? 'Pilot günü';
}

export function getPilotRhythmChipLabel(event: EventCard, day?: number): string | null {
  if (event.rhythmMeta?.relationText) {
    const dayNum = day ?? 0;
    if (dayNum > 0 && event.rhythmMeta.dayRole !== 'tutorial') {
      return `${ROLE_CHIP_LABELS[event.rhythmMeta.dayRole] ?? getPilotDayRoleLabel(event.rhythmMeta.dayRole)}`;
    }
    return event.rhythmMeta.relationText;
  }
  if (event.rhythmMeta?.dayRole) {
    return ROLE_CHIP_LABELS[event.rhythmMeta.dayRole] ?? null;
  }
  if (day != null && day >= 1 && day <= 7) {
    const plan = getPilotRhythmPlan(day);
    if (plan.role === 'tutorial') {
      return null;
    }
    return ROLE_CHIP_LABELS[plan.role] ?? null;
  }
  return null;
}

export function getPilotRhythmAdvisorLine(day: number): string | null {
  const plan = getPilotRhythmPlan(day);
  if (plan.role === 'tutorial') {
    return null;
  }
  return `Bugünün ritmi: ${plan.title}`;
}

export function buildPilotRhythmReportLine(
  day: number,
  neighborhoodId?: string,
): string | null {
  const plan = getPilotRhythmPlan(day);
  if (plan.role === 'tutorial') {
    return null;
  }
  const nh = neighborhoodId ? `; ${neighborhoodId} hattı belirleyici oldu` : '';
  return `Bugün ${plan.title.toLowerCase()} öne çıktı${nh}.`;
}
