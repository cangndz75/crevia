import {
  DISTRICT_TRUST_LEVEL_THRESHOLDS,
  DISTRICT_TRUST_SAFE_FALLBACK_SCORE,
  DISTRICT_TRUST_SCORE_RANGE,
} from './districtTrustConstants';
import { buildDistrictTrustMemoryItems } from './districtTrustMemory';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type {
  DistrictTrustLevel,
  DistrictTrustPressureDomain,
  DistrictTrustScoreInput,
  DistrictTrustScoreResult,
  DistrictTrustSignalSource,
  DistrictTrustTrend,
  DistrictTrustVisibilityMode,
} from './districtTrustTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readRecord(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (isRecord(value)) return Object.values(value).map(textBlob).join(' ');
  return '';
}

function addUnique<T>(items: T[], value: T): void {
  if (!items.includes(value)) items.push(value);
}

function statusPenalty(status?: string): number {
  if (status === 'critical') return -10;
  if (status === 'strained') return -8;
  if (status === 'watch') return -4;
  if (status === 'stable') return 8;
  return 0;
}

function domainFromOperationFocus(focus?: string): DistrictTrustPressureDomain | null {
  if (focus === 'containers') return 'container';
  if (focus === 'vehicles') return 'vehicle_route';
  if (focus === 'personnel') return 'personnel';
  if (focus === 'districts') return 'district_balance';
  return null;
}

export function clampDistrictTrustScore(score: number): number {
  if (!Number.isFinite(score)) return DISTRICT_TRUST_SAFE_FALLBACK_SCORE;
  return Math.min(
    DISTRICT_TRUST_SCORE_RANGE.max,
    Math.max(DISTRICT_TRUST_SCORE_RANGE.min, Math.round(score)),
  );
}

export function getDistrictTrustLevel(score: number): DistrictTrustLevel {
  const clamped = clampDistrictTrustScore(score);
  for (const [level, threshold] of Object.entries(DISTRICT_TRUST_LEVEL_THRESHOLDS) as Array<
    [DistrictTrustLevel, { min: number; max: number }]
  >) {
    if (clamped >= threshold.min && clamped <= threshold.max) return level;
  }
  return 'neutral';
}

export function getDistrictTrustTrend(input: DistrictTrustScoreInput): DistrictTrustTrend {
  const text = textBlob(input);
  const crisisRisk = readString(readRecord(input.crisisState, 'riskLevel'));
  const crisisTrend = readString(readRecord(input.crisisState, 'trend'));
  if (text.includes('resolved') || text.includes('recovery') || text.includes('toparlan')) {
    return 'recovering';
  }
  if (text.includes('reward') || text.includes('gratitude') || text.includes('positive')) {
    return 'improving';
  }
  if (crisisRisk === 'critical' || text.includes('critical')) return 'falling';
  if (
    crisisRisk === 'watch' ||
    crisisRisk === 'elevated' ||
    crisisTrend === 'worsening' ||
    text.includes('strained')
  ) {
    return 'strained';
  }
  return 'steady';
}

export function deriveDistrictTrustScore(input: DistrictTrustScoreInput): number {
  let score = DISTRICT_TRUST_SAFE_FALLBACK_SCORE;
  const districtId = normalizeMapDistrictId(input.districtId) ?? 'merkez';

  const operationSignals = input.operationSignals;
  if (operationSignals != null) {
    const priorityDistrictId = normalizeMapDistrictId(readString(readRecord(operationSignals, 'priorityDistrictId')));
    const overallStatus = readString(readRecord(readRecord(operationSignals, 'overall'), 'status'));
    const dailyFocus = readString(readRecord(operationSignals, 'dailyFocus'));
    score += statusPenalty(overallStatus);
    if (priorityDistrictId === districtId) {
      score += statusPenalty(readString(readRecord(readRecord(operationSignals, 'districts'), 'status')));
      if (dailyFocus && dailyFocus !== 'balanced') score -= 3;
    }
  }

  const socialPulse = input.socialPulse;
  if (socialPulse != null) {
    const neighborhoods = readRecord(socialPulse, 'neighborhoods');
    const profile = isRecord(neighborhoods) ? neighborhoods[districtId] : undefined;
    const trust = readNumber(readRecord(profile, 'trust'));
    const complaintHeat = readNumber(readRecord(profile, 'complaintHeat'));
    const gratitude = readNumber(readRecord(profile, 'gratitude'));
    const crisisSpread = readNumber(readRecord(profile, 'crisisSpread'));
    if (trust != null) score += trust >= 70 ? 8 : trust <= 35 ? -8 : 0;
    if (complaintHeat != null && complaintHeat >= 65) score -= 8;
    if (gratitude != null && gratitude >= 55) score += 8;
    if (crisisSpread != null && crisisSpread >= 60) score -= 8;
  }

  const recentText = textBlob(input.recentEvents);
  if (recentText.includes('reward') || recentText.includes('positive') || recentText.includes('gratitude')) score += 10;
  if (recentText.includes('recovery') || recentText.includes('resolved') || recentText.includes('toparlan')) score += 6;
  if (recentText.includes('negative') || recentText.includes('failed') || recentText.includes('worsened')) score -= 8;
  if (recentText.includes('repeated') || recentText.includes('tekrar')) score -= 6;

  const carryText = textBlob(input.carryOver);
  if (carryText.includes('resolved') || carryText.includes('azaldı')) score += 5;
  if (carryText.includes('unresolved') || carryText.includes('pending') || carryText.includes('yarın')) score -= 6;

  const fatigueText = textBlob(input.resourceFatigue);
  if (fatigueText.includes('strained') || fatigueText.includes('critical') || fatigueText.includes('maintenance_risk')) score -= 8;
  if (fatigueText.includes('recovering') || fatigueText.includes('resolved')) score += 6;

  const crisisState = input.crisisState;
  const crisisRisk = readString(readRecord(crisisState, 'riskLevel'));
  const crisisTrend = readString(readRecord(crisisState, 'trend'));
  const activeIncident = readRecord(crisisState, 'activeIncident');
  const affectedDistrictIds = readRecord(activeIncident, 'affectedDistrictIds');
  const affectsDistrict = Array.isArray(affectedDistrictIds) && affectedDistrictIds.includes(districtId);
  if ((crisisRisk === 'watch' || crisisRisk === 'elevated' || crisisRisk === 'critical') && (affectsDistrict || !activeIncident)) {
    score -= crisisRisk === 'critical' ? 14 : 10;
  }
  if (crisisTrend === 'improving' || textBlob(activeIncident).includes('resolved')) score += 6;

  const reportText = textBlob(input.reportSummary);
  if (reportText.includes('toparlan') || reportText.includes('iyileş')) score += 4;
  if (reportText.includes('baskı') || reportText.includes('izleniyor')) score -= 3;

  return clampDistrictTrustScore(score);
}

function derivePressureDomains(input: DistrictTrustScoreInput): DistrictTrustPressureDomain[] {
  const out: DistrictTrustPressureDomain[] = [];
  const operationSignals = input.operationSignals;
  const focus = domainFromOperationFocus(readString(readRecord(operationSignals, 'dailyFocus')));
  if (focus) addUnique(out, focus);

  const socialText = textBlob(input.socialPulse);
  const recentText = textBlob(input.recentEvents);
  const carryText = textBlob(input.carryOver);
  const fatigueText = textBlob(input.resourceFatigue);
  const crisisText = textBlob(input.crisisState);

  if (socialText.includes('complaint') || socialText.includes('social') || recentText.includes('social')) addUnique(out, 'social');
  if (recentText.includes('container') || fatigueText.includes('container')) addUnique(out, 'container');
  if (recentText.includes('vehicle') || recentText.includes('route') || fatigueText.includes('vehicle') || fatigueText.includes('route')) addUnique(out, 'vehicle_route');
  if (recentText.includes('personnel') || fatigueText.includes('personnel')) addUnique(out, 'personnel');
  if (crisisText.includes('watch') || crisisText.includes('critical') || crisisText.includes('elevated')) addUnique(out, 'crisis');
  if (carryText.includes('district') || socialText.includes('trust')) addUnique(out, 'district_balance');
  if (recentText.includes('recovery') || fatigueText.includes('recovering')) addUnique(out, 'resource_recovery');
  if (out.length === 0) addUnique(out, 'generic');
  return out;
}

function deriveSignalSources(input: DistrictTrustScoreInput): DistrictTrustSignalSource[] {
  const sources: DistrictTrustSignalSource[] = ['district_identity'];
  if (input.operationSignals != null) sources.push('operation_signal');
  if (input.socialPulse != null) sources.push('social_pulse');
  if (input.recentEvents != null) sources.push('recent_event');
  if (input.carryOver != null) sources.push('carry_over');
  if (input.resourceFatigue != null) sources.push('resource_fatigue');
  if (input.crisisState != null) sources.push('crisis_state');
  if (input.reportSummary != null) sources.push('report_summary');
  if (sources.length === 1) sources.push('fallback');
  return [...new Set(sources)];
}

export function shouldShowDistrictTrust(input: {
  day?: number;
  rankPermissionUnlocked?: boolean;
  memoryPermissionUnlocked?: boolean;
}): DistrictTrustVisibilityMode {
  if (input.memoryPermissionUnlocked && (input.day ?? 1) >= 4) return 'standard';
  if (input.rankPermissionUnlocked) return (input.day ?? 1) <= 1 ? 'compact' : 'standard';
  const day = input.day ?? 1;
  if (day <= 1) return 'compact';
  if (day <= 3) return 'compact';
  return 'standard';
}

export function getDistrictTrustSafeFallback(districtId: MapDistrictId | string): DistrictTrustScoreResult {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const score = DISTRICT_TRUST_SAFE_FALLBACK_SCORE;
  return {
    districtId: normalized,
    score,
    level: getDistrictTrustLevel(score),
    trend: 'steady',
    pressureDomains: ['generic'],
    signalSources: ['district_identity', 'fallback'],
    confidence: 'low',
    isVisibleToPlayer: false,
    reasonLines: ['Mevcut sinyaller sınırlı; mahalle güveni dengeli kabul edilir.'],
    memoryItems: [],
  };
}

export function buildDistrictTrustScoreResult(input: DistrictTrustScoreInput): DistrictTrustScoreResult {
  const fallback = getDistrictTrustSafeFallback(input.districtId);
  const score = deriveDistrictTrustScore(input);
  const pressureDomains = derivePressureDomains(input);
  const signalSources = deriveSignalSources(input);
  const trend = getDistrictTrustTrend(input);
  const result: DistrictTrustScoreResult = {
    districtId: fallback.districtId,
    score,
    level: getDistrictTrustLevel(score),
    trend,
    pressureDomains,
    signalSources,
    confidence: signalSources.length >= 5 ? 'high' : signalSources.length >= 3 ? 'medium' : 'low',
    isVisibleToPlayer: shouldShowDistrictTrust(input) !== 'hidden',
    reasonLines: [
      `${fallback.districtId} güven skoru mevcut sinyallerden türetildi.`,
      pressureDomains[0] === 'generic'
        ? 'Belirgin baskı alanı yok.'
        : `${pressureDomains[0]} baskısı güven hesabında öne çıkıyor.`,
    ],
    memoryItems: [],
  };
  result.memoryItems = buildDistrictTrustMemoryItems({
    districtId: result.districtId,
    trustScoreResult: result,
    recentEvents: input.recentEvents,
    carryOver: input.carryOver,
    resourceFatigue: input.resourceFatigue,
    crisisState: input.crisisState,
    socialPulse: input.socialPulse,
  });
  return result;
}

export function deriveDistrictTrustForAllDistricts(
  input: Omit<DistrictTrustScoreInput, 'districtId'>,
): DistrictTrustScoreResult[] {
  return MAP_DISTRICT_IDENTITY_IDS.map((districtId) =>
    buildDistrictTrustScoreResult({ ...input, districtId }),
  );
}

export function getPrimaryDistrictTrustPressure(
  result: DistrictTrustScoreResult,
): DistrictTrustPressureDomain {
  return result.pressureDomains[0] ?? 'generic';
}

export const __districtTrustModelInternals = {
  isRecord,
  readRecord,
};
