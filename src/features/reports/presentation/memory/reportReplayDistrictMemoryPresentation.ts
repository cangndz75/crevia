import type { CityArchiveDistrictSummary, CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { lineDuplicatesAvoidLines } from '@/core/presentationDedupe';

import type { MemoryImpactChip, ReportReplayDistrictMemory } from './reportReplayMemoryTypes';

const DISTRICT_DISPLAY: Partial<Record<MapDistrictId, string>> = {
  cumhuriyet: 'Cumhuriyet Mahallesi',
  merkez: 'Merkez Mahallesi',
  yesilvadi: 'Yeşilvadi Mahallesi',
  sanayi: 'Sanayi Mahallesi',
  istasyon: 'İstasyon Mahallesi',
};

function clamp(text: string, max = 88): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function displayDistrictName(id: string, fallback?: string): string {
  const mapped = DISTRICT_DISPLAY[id as MapDistrictId];
  if (mapped) return mapped;
  if (fallback) return fallback.includes('Mahallesi') ? fallback : `${fallback} Mahallesi`;
  const words = id.replace(/_/g, ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} Mahallesi`;
}

function scoreDistrictSummary(summary: CityArchiveDistrictSummary): number {
  let score = 0;
  if (summary.trustTrend === 'down') score += 30;
  if (summary.trustTrend === 'recovered') score += 25;
  if (summary.socialTone === 'strained') score += 20;
  if (summary.resourceTone === 'strained') score += 15;
  if (summary.lastWarningMoment) score += 12;
  if (summary.recentEntryIds.length >= 2) score += 8;
  return score;
}

function buildSignalLine(
  districtName: string,
  summary: CityArchiveDistrictSummary,
): string {
  if (summary.lastWarningMoment?.includes('gecik')) {
    return clamp(`${districtName} gecikmelere daha hassas hale geldi.`);
  }
  if (summary.trustTrend === 'recovered') {
    return clamp(`${districtName} güven toparlanmasına yanıt verdi.`);
  }
  if (summary.trustTrend === 'down') {
    return clamp(`${districtName} sabır eşiği son günlerde düştü.`);
  }
  if (summary.socialTone === 'strained') {
    return clamp(`${districtName} sosyal baskıyı daha uzun taşıyor.`);
  }
  if (summary.lastPositiveMoment) {
    return clamp(`${districtName} son müdahaleyi hafızaya ekledi.`);
  }
  return clamp(`${districtName} geçmiş kararları izlemeye devam ediyor.`);
}

function buildChips(summary: CityArchiveDistrictSummary): MemoryImpactChip[] {
  const chips: MemoryImpactChip[] = [];
  if (summary.trustTrend === 'down' || summary.socialTone === 'strained') {
    chips.push({ key: 'patience', label: 'Sabır kırılgan', tone: 'warning' });
  }
  if (summary.trustTrend === 'recovered' || summary.trustTrend === 'up') {
    chips.push({ key: 'trust', label: 'Güven toparlanabilir', tone: 'positive' });
  }
  if (summary.resourceTone === 'strained') {
    chips.push({ key: 'resource', label: 'Kaynak baskısı', tone: 'warning' });
  }
  if (chips.length === 0) {
    chips.push({ key: 'watch', label: 'İzleniyor', tone: 'neutral' });
  }
  return chips.slice(0, 2);
}

function trendDirection(summary: CityArchiveDistrictSummary): ReportReplayDistrictMemory['trendDirection'] {
  if (summary.trustTrend === 'up' || summary.trustTrend === 'recovered') return 'up';
  if (summary.trustTrend === 'down') return 'down';
  return 'flat';
}

export function buildReportReplayDistrictMemory(
  cityArchive: CityArchiveV1State | null | undefined,
  currentDay: number,
  avoidLines: string[] = [],
): ReportReplayDistrictMemory {
  if (currentDay < 4 || !cityArchive?.districtSummaries) {
    return {
      visible: false,
      districtName: '',
      signalLine: '',
      chips: [],
      trendDirection: 'flat',
    };
  }

  const entries = Object.entries(cityArchive.districtSummaries) as Array<
    [string, CityArchiveDistrictSummary]
  >;
  if (entries.length === 0) {
    return {
      visible: false,
      districtName: '',
      signalLine: '',
      chips: [],
      trendDirection: 'flat',
    };
  }

  const ranked = entries
    .filter(([, s]) => s.lastUpdatedDay < currentDay)
    .sort((a, b) => scoreDistrictSummary(b[1]) - scoreDistrictSummary(a[1]));

  const top = ranked[0];
  if (!top) {
    return {
      visible: false,
      districtName: '',
      signalLine: '',
      chips: [],
      trendDirection: 'flat',
    };
  }

  const [districtId, summary] = top;
  const districtName = displayDistrictName(districtId);
  const signalLine = buildSignalLine(districtName, summary);

  if (lineDuplicatesAvoidLines(signalLine, avoidLines)) {
    return {
      visible: false,
      districtName: '',
      signalLine: '',
      chips: [],
      trendDirection: 'flat',
    };
  }

  return {
    visible: true,
    districtName,
    signalLine,
    chips: buildChips(summary),
    trendDirection: trendDirection(summary),
  };
}
