import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';

export type NeighborhoodPulseChip = {
  key: string;
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EndOfDayNeighborhoodPulsePresentation = {
  visible: boolean;
  headline: string;
  chips: NeighborhoodPulseChip[];
};

export type BuildNeighborhoodPulseInput = {
  day: number;
  socialPulseScore?: number;
  districtReportLine?: string | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  socialEchoMessage?: string | null;
  lastDistrictName?: string | null;
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

export function buildEndOfDayNeighborhoodPulsePresentation(
  input: BuildNeighborhoodPulseInput,
): EndOfDayNeighborhoodPulsePresentation {
  const score = input.socialPulseScore ?? 58;
  const district = input.lastDistrictName?.trim() || 'Merkez mahalleler';
  const avoid = input.avoidLines ?? [];

  let headline: string;
  if (input.cityReaction?.socialEcho?.line) {
    headline = clampLine(input.cityReaction.socialEcho.line);
  } else if (input.districtReportLine) {
    headline = clampLine(input.districtReportLine.replace(/^Mahalle notu:\s*/i, ''));
  } else if (score >= 62) {
    headline = clampLine(
      `${district} hızlı müdahaleyi fark etti. Gecikme yaşayan bölgelerde sabır hâlâ kırılgan.`,
    );
  } else if (score < 48) {
    headline = clampLine(
      `${district} baskı altında. Görünür hizmet olmadan sabır daha da inceliyor.`,
    );
  } else {
    headline = clampLine(
      `${district} dengede; küçük gecikmeler sosyal nabzı zorlamadı.`,
    );
  }

  if (input.socialEchoMessage && !lineDuplicatesAvoid(input.socialEchoMessage, [headline, ...avoid])) {
    headline = clampLine(input.socialEchoMessage);
  }

  const chips: NeighborhoodPulseChip[] = [];

  if (score >= 60) {
    chips.push({ key: 'pulse-up', label: 'Nabız toparlandı', tone: 'positive' });
  } else if (score < 50) {
    chips.push({ key: 'pulse-down', label: 'Sabır kırılgan', tone: 'warning' });
  } else {
    chips.push({ key: 'pulse-mid', label: 'Nabız dengede', tone: 'neutral' });
  }

  const reactionTone = input.cityReaction?.tone;
  if (reactionTone === 'positive') {
    chips.push({ key: 'visible', label: 'Görünür hizmet', tone: 'positive' });
  } else if (reactionTone === 'warning' || reactionTone === 'critical') {
    chips.push({ key: 'delay', label: 'Gecikme baskısı', tone: 'warning' });
  } else {
    chips.push({ key: 'steady', label: 'Mahalle dengesi', tone: 'neutral' });
  }

  if (input.day >= 8 && input.districtReportLine) {
    chips.push({ key: 'memory', label: 'Mahalle hafızası', tone: 'neutral' });
  }

  return {
    visible: true,
    headline,
    chips: chips.slice(0, 3),
  };
}
