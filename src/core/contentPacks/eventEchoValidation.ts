import type { ContentPackEventTemplate } from './contentPackTypes';
import {
  ADVISOR_ECHO_TEMPLATES,
  ALL_EVENT_ECHO_TEMPLATES,
  REPORT_ECHO_TEMPLATES,
  SOCIAL_ECHO_TEMPLATES,
  TOMORROW_HINT_ECHO_TEMPLATES,
} from './eventEchoCopy';
import type { EventEchoDomain, EventEchoTemplate } from './eventEchoTypes';
import { buildEventEchoBundle, buildEchoContextFromEventResult } from './eventEchoSelectors';

const FORBIDDEN = ['premium', 'satın al', 'paywall', 'kilitli'] as const;
const PUSHY = ['en iyi seçenek', 'bunu yap', 'mutlaka yap'] as const;
const PANIC = ['kriz başladı', 'felaket', 'panik', 'kıyamet'] as const;

const LIMITS = {
  advisor: 180,
  social: 140,
  report: 160,
  tomorrow_hint: 150,
} as const;

export type EchoValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function findDuplicateEchoTemplateIds(
  templates: EventEchoTemplate[] = ALL_EVENT_ECHO_TEMPLATES,
): string[] {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const t of templates) {
    if (seen.has(t.id)) dup.push(t.id);
    seen.add(t.id);
  }
  return dup;
}

export function countEchoTemplatesBySurface(
  templates: EventEchoTemplate[] = ALL_EVENT_ECHO_TEMPLATES,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of templates) {
    counts[t.surface] = (counts[t.surface] ?? 0) + 1;
  }
  return counts;
}

export function countEchoTemplatesByDomain(
  templates: EventEchoTemplate[] = ALL_EVENT_ECHO_TEMPLATES,
): Partial<Record<EventEchoDomain, number>> {
  const counts: Partial<Record<EventEchoDomain, number>> = {};
  for (const t of templates) {
    counts[t.domain] = (counts[t.domain] ?? 0) + 1;
  }
  return counts;
}

export function countEchoDomainCoverageCombined(): Partial<Record<EventEchoDomain, number>> {
  return countEchoTemplatesByDomain();
}

export function findTooLongEchoTexts(
  templates: EventEchoTemplate[] = ALL_EVENT_ECHO_TEMPLATES,
): string[] {
  const long: string[] = [];
  for (const t of templates) {
    const limit = LIMITS[t.surface];
    if (t.text.length > limit) long.push(`${t.id} (${t.text.length})`);
  }
  return long;
}

export function findForbiddenEchoWords(
  templates: EventEchoTemplate[] = ALL_EVENT_ECHO_TEMPLATES,
): string[] {
  const hits: string[] = [];
  for (const t of templates) {
    const lower = t.text.toLowerCase();
    for (const w of FORBIDDEN) {
      if (lower.includes(w)) hits.push(`${t.id}:${w}`);
    }
    if (t.surface === 'advisor') {
      for (const p of PUSHY) {
        if (lower.includes(p)) hits.push(`${t.id}:pushy`);
      }
    }
    if (t.domain === 'crisis_adjacent') {
      for (const p of PANIC) {
        if (p === 'panik' && (lower.includes('panik değil') || lower.includes('henüz kriz'))) {
          continue;
        }
        if (lower.includes(p)) hits.push(`${t.id}:panic`);
      }
    }
  }
  return hits;
}

export function validateDay1EchoSafety(): EchoValidationResult {
  const errors: string[] = [];
  const unsafe = ALL_EVENT_ECHO_TEMPLATES.filter((t) => t.forbiddenInDay1);
  if (unsafe.length < 10) {
    errors.push('Day1 forbidden template sayısı düşük');
  }
  for (const t of ALL_EVENT_ECHO_TEMPLATES) {
    if (t.domain === 'crisis_adjacent' && !t.forbiddenInDay1) {
      errors.push(`${t.id} crisis day1 guard eksik`);
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validatePilotFinalEchoSafety(): EchoValidationResult {
  const errors: string[] = [];
  const blocked = ALL_EVENT_ECHO_TEMPLATES.filter((t) => t.allowInPilotFinal === false);
  if (blocked.length < 3) {
    errors.push('Pilot final blocked template yetersiz');
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateEchoCoverageForContentPacks(
  stage1: ContentPackEventTemplate[],
  stage2: ContentPackEventTemplate[],
): EchoValidationResult {
  const errors: string[] = [];
  const sampleIds = [
    'csp1-cumhuriyet-iri-atik-sikisma',
    'csp2-sanayi-risk-sinyal-birlesimi',
    'csp2-istasyon-aksam-rota-cakisma',
  ];
  const all = [...stage1, ...stage2];
  for (const id of sampleIds) {
    const event = all.find((e) => e.id === id);
    if (!event) {
      errors.push(`sample event yok: ${id}`);
      continue;
    }
    const ctx = buildEchoContextFromEventResult({
      event: {
        id: event.id,
        neighborhoodId: event.districtId,
        contentCategory: event.domain,
      },
      day: event.preferredPilotDays?.[0] ?? 3,
      districtId: event.districtId,
      hasCarryOver: true,
    });
    const bundle = buildEventEchoBundle(ctx);
    if (!bundle.advisorLine || !bundle.socialMention || !bundle.reportLine) {
      errors.push(`bundle eksik: ${id}`);
    }
  }
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateEventEchoTemplates(): EchoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dup = findDuplicateEchoTemplateIds();
  if (dup.length) errors.push(`duplicate id: ${dup.join(',')}`);

  const forbidden = findForbiddenEchoWords();
  if (forbidden.length) errors.push(`forbidden: ${forbidden.join(',')}`);

  const longTexts = findTooLongEchoTexts();
  if (longTexts.length > 20) {
    warnings.push(`çok uzun metin: ${longTexts.length}`);
  } else if (longTexts.length > 0) {
    warnings.push(`uzun metin örnekleri: ${longTexts.slice(0, 3).join('; ')}`);
  }

  if (ADVISOR_ECHO_TEMPLATES.length < 50) {
    errors.push(`advisor < 50 (${ADVISOR_ECHO_TEMPLATES.length})`);
  }
  if (SOCIAL_ECHO_TEMPLATES.length < 60) {
    errors.push(`social < 60 (${SOCIAL_ECHO_TEMPLATES.length})`);
  }
  if (REPORT_ECHO_TEMPLATES.length < 60) {
    errors.push(`report < 60 (${REPORT_ECHO_TEMPLATES.length})`);
  }
  if (TOMORROW_HINT_ECHO_TEMPLATES.length < 30) {
    errors.push(`tomorrow < 30 (${TOMORROW_HINT_ECHO_TEMPLATES.length})`);
  }
  if (ALL_EVENT_ECHO_TEMPLATES.length < 200) {
    errors.push(`total < 200 (${ALL_EVENT_ECHO_TEMPLATES.length})`);
  }

  const byDomain = countEchoTemplatesByDomain();
  const vehicleRoute = (byDomain.vehicle ?? 0) + (byDomain.route ?? 0);
  if ((byDomain.container ?? 0) < 30) errors.push('container coverage düşük');
  if (vehicleRoute < 30) errors.push('vehicle/route coverage düşük');
  if ((byDomain.personnel ?? 0) < 25) errors.push('personnel coverage düşük');
  if ((byDomain.social ?? 0) < 30) errors.push('social domain coverage düşük');
  if ((byDomain.crisis_adjacent ?? 0) < 25) errors.push('crisis coverage düşük');
  if ((byDomain.district_balance ?? 0) < 20) errors.push('district_balance coverage düşük');
  const pilotGeneric =
    (byDomain.pilot_learning ?? 0) +
    (byDomain.pilot_final ?? 0) +
    (byDomain.generic_operation ?? 0);
  if (pilotGeneric < 20) errors.push('pilot/generic coverage düşük');

  const day1 = validateDay1EchoSafety();
  errors.push(...day1.errors);
  const day7 = validatePilotFinalEchoSafety();
  errors.push(...day7.errors);

  return { ok: errors.length === 0, errors, warnings };
}
