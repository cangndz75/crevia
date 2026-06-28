import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

export type EndOfDayTomorrowFocusPresentation = {
  visible: boolean;
  focusLine: string;
  riskTag: string;
  riskTone: 'low' | 'medium' | 'high';
  ctaHint: string;
  detailRouteLabel: string;
};

export type BuildTomorrowFocusInput = {
  day: number;
  tomorrowNotes?: string[];
  tomorrowPreparationLine?: string | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  carryOverSummary?: string | null;
  cliffhangerFocus?: string | null;
  avoidLines?: string[];
};

function clampLine(text: string, max = 118): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function lineDuplicatesAvoid(line: string, avoid: string[]): boolean {
  const norm = line.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
  return avoid.some((a) => {
    const an = a.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
    return an.length > 10 && (norm.includes(an) || an.includes(norm));
  });
}

function resolveRiskTone(
  risk?: TomorrowRiskModel | null,
): EndOfDayTomorrowFocusPresentation['riskTone'] {
  if (!risk) return 'medium';
  if (risk.priority === 'high') return 'high';
  if (risk.priority === 'low') return 'low';
  return 'medium';
}

export function buildEndOfDayTomorrowFocusPresentation(
  input: BuildTomorrowFocusInput,
): EndOfDayTomorrowFocusPresentation {
  const avoid = input.avoidLines ?? [];
  const riskTone = resolveRiskTone(input.tomorrowRisk);

  const candidates = [
    input.tomorrowPreparationLine,
    input.tomorrowRisk?.ctaLine,
    input.tomorrowRisk?.mainLine,
    input.tomorrowRisk?.supportLine,
    input.cliffhangerFocus,
    input.carryOverSummary,
    ...(input.tomorrowNotes ?? []),
  ].filter((line): line is string => Boolean(line?.trim()));

  let focusLine = '';
  for (const candidate of candidates) {
    if (!lineDuplicatesAvoid(candidate, avoid)) {
      focusLine = clampLine(candidate);
      break;
    }
  }

  if (!focusLine) {
    focusLine =
      input.day === 1
        ? 'Yarın kaynak ve güven dengesini birlikte düşün.'
        : 'Yarın ilk iş operasyon sinyallerini kontrol et.';
  }

  const riskTag =
    input.tomorrowRisk?.title?.trim() ||
    (riskTone === 'high'
      ? 'Yüksek risk'
      : riskTone === 'low'
        ? 'Düşük risk'
        : 'Orta risk');

  return {
    visible: true,
    focusLine,
    riskTag,
    riskTone,
    ctaHint:
      input.day === 1
        ? 'Yeni güne hazır ol'
        : 'Yarın önceliğini netleştir',
    detailRouteLabel: 'Rapor Detayını Gör',
  };
}
