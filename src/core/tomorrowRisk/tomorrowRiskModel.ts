import {
  TOMORROW_RISK_CITY_CTA,
  TOMORROW_RISK_MAX_VISIBLE_LINES,
  TOMORROW_RISK_TITLE,
} from './tomorrowRiskConstants';
import { buildTomorrowRiskFromPackMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';

import type {
  TomorrowRiskDomain,
  TomorrowRiskInput,
  TomorrowRiskKind,
  TomorrowRiskModel,
  TomorrowRiskPriority,
  TomorrowRiskSource,
  TomorrowRiskTone,
} from './tomorrowRiskTypes';

function cleanText(value: string | null | undefined, limit = 154): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text: string, needles: string[]): boolean {
  const normalized = normalizeText(text);
  return needles.some((needle) => normalized.includes(normalizeText(needle)));
}

function signalStatusWeight(status: string | undefined): number {
  switch (status) {
    case 'critical':
      return 4;
    case 'strained':
    case 'risk':
      return 3;
    case 'watch':
    case 'warning':
      return 2;
    case 'stable':
    case 'steady':
      return 0;
    default:
      return 1;
  }
}

function priorityFromWeight(weight: number): TomorrowRiskPriority {
  if (weight >= 4) return 'high';
  if (weight >= 2) return 'medium';
  return 'low';
}

function domainFromText(text: string | undefined, fallback: TomorrowRiskDomain): TomorrowRiskDomain {
  const normalized = normalizeText(text ?? '');
  if (includesAny(normalized, ['rota', 'arac', 'hat'])) return 'route';
  if (includesAny(normalized, ['konteyner', 'atik', 'dolum'])) return 'container';
  if (includesAny(normalized, ['sosyal', 'guven', 'nabiz'])) return 'social';
  if (includesAny(normalized, ['personel', 'ekip'])) return 'personnel';
  if (includesAny(normalized, ['mahalle', 'bolge', 'semt'])) return 'district';
  if (includesAny(normalized, ['kriz', 'risk', 'onlem'])) return 'crisis';
  if (includesAny(normalized, ['kaynak', 'yorgunluk', 'denge'])) return 'resource';
  return fallback;
}

function kindForDomain(domain: TomorrowRiskDomain): TomorrowRiskKind {
  switch (domain) {
    case 'route':
      return 'route_pressure_tomorrow';
    case 'container':
      return 'container_pressure_tomorrow';
    case 'social':
      return 'social_trust_recovery';
    case 'personnel':
      return 'personnel_fatigue_watch';
    case 'vehicle':
      return 'vehicle_fatigue_watch';
    case 'district':
      return 'district_trust_watch';
    case 'crisis':
      return 'crisis_prevention_watch';
    case 'resource':
      return 'resource_balance_watch';
    case 'operation':
      return 'operation_era_hint';
    default:
      return 'generic_city_preparation';
  }
}

function titleForKind(kind: TomorrowRiskKind): string {
  switch (kind) {
    case 'route_pressure_tomorrow':
      return 'Yarın Rota Notu';
    case 'container_pressure_tomorrow':
      return 'Konteyner İzleme Notu';
    case 'social_trust_recovery':
    case 'recovery_momentum':
      return 'Toparlanma İvmesi';
    case 'personnel_fatigue_watch':
      return 'Ekip Temposu';
    case 'vehicle_fatigue_watch':
      return 'Araç Yorgunluğu';
    case 'district_trust_watch':
      return 'Mahalle Güveni';
    case 'crisis_prevention_watch':
      return 'Önleyici Takip';
    case 'post_pilot_next_scope':
      return 'Sıradaki Kapsam';
    case 'operation_era_hint':
      return 'Operasyon Dönemi';
    default:
      return TOMORROW_RISK_TITLE;
  }
}

function buildRisk(args: {
  day: number;
  kind: TomorrowRiskKind;
  mainLine: string;
  supportLine?: string;
  ctaLine?: string;
  tone: TomorrowRiskTone;
  priority: TomorrowRiskPriority;
  source: TomorrowRiskSource;
  relatedDomain?: TomorrowRiskDomain;
  relatedDistrictId?: string;
  relatedResource?: string;
  compact?: boolean;
}): TomorrowRiskModel {
  const shouldShowInReport = args.day > 1;
  const shouldShowInHub =
    args.day > 1 &&
    args.source !== 'fallback' &&
    (args.priority === 'high' ||
      args.source === 'carry_over' ||
      args.source === 'operation_era' ||
      (args.day >= 8 && args.compact === true));

  return {
    id: `tomorrow-risk-${args.kind}-${args.day}-${args.source}`,
    kind: args.kind,
    title: titleForKind(args.kind),
    mainLine: cleanText(args.mainLine),
    supportLine: cleanText(args.supportLine, 120) || undefined,
    ctaLine: cleanText(args.ctaLine ?? TOMORROW_RISK_CITY_CTA, 96),
    tone: args.tone,
    priority: args.priority,
    relatedDistrictId: args.relatedDistrictId,
    relatedDomain: args.relatedDomain,
    relatedResource: args.relatedResource,
    sourceSignals: [args.source],
    shouldShowInReport,
    shouldShowInHub,
    shouldShowAsCompact: args.compact === true || args.day <= 3 || args.day >= 8,
    maxVisibleLines: TOMORROW_RISK_MAX_VISIBLE_LINES,
  };
}

function isDuplicate(candidate: TomorrowRiskModel, existingLines: string[]): boolean {
  const candidateParts = [candidate.mainLine, candidate.supportLine, candidate.ctaLine]
    .filter(Boolean)
    .map((line) => normalizeText(line ?? ''));

  return existingLines.some((line) => {
    const existing = normalizeText(line);
    if (!existing) return false;
    return candidateParts.some((part) => {
      if (!part) return false;
      if (part === existing) return true;
      return part.length >= 24 && (existing.includes(part.slice(0, 24)) || part.includes(existing.slice(0, 24)));
    });
  });
}

function fromCarryOver(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const summary = cleanText(input.carryOver?.summary ?? input.carryOver?.detail);
  if (!summary || input.carryOver?.visible === false) return null;
  const domain = domainFromText(`${input.carryOver?.domain ?? ''} ${summary}`, 'city');
  return buildRisk({
    day: input.day,
    kind: kindForDomain(domain),
    mainLine: summary,
    supportLine: 'Dünkü kararın yarınki plan diliminde izlenebilir bir iz bıraktı.',
    tone: domain === 'social' ? 'recovery' : 'watch',
    priority: 'high',
    source: 'carry_over',
    relatedDomain: domain,
    relatedDistrictId: input.carryOver?.districtId,
    compact: true,
  });
}

function fromContentPackMeta(input: TomorrowRiskInput): TomorrowRiskModel | null {
  return buildTomorrowRiskFromPackMeta(input);
}

function fromTomorrowHint(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const hint = cleanText(input.tomorrowHint ?? input.reportTomorrowPreview?.summary);
  if (!hint || input.reportTomorrowPreview?.visible === false) return null;
  const domain = domainFromText(`${input.reportTomorrowPreview?.domain ?? ''} ${hint}`, 'operation');
  return buildRisk({
    day: input.day,
    kind: kindForDomain(domain),
    mainLine: hint,
    supportLine: 'Bu sinyal mevcut rapor önizlemesiyle aynı çizgide tutuldu.',
    tone: domain === 'social' ? 'recovery' : 'watch',
    priority: 'medium',
    source: 'tomorrow_hint',
    relatedDomain: domain,
  });
}

function fromOperationSignals(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const signals = input.operationSignals;
  if (!signals) return null;
  const ranked = [
    { domain: 'crisis' as const, signal: signals.overall, kind: 'crisis_prevention_watch' as const },
    { domain: 'route' as const, signal: signals.vehicles, kind: 'route_pressure_tomorrow' as const },
    { domain: 'container' as const, signal: signals.containers, kind: 'container_pressure_tomorrow' as const },
    { domain: 'personnel' as const, signal: signals.personnel, kind: 'personnel_fatigue_watch' as const },
    { domain: 'district' as const, signal: signals.districts, kind: 'district_trust_watch' as const },
  ].sort((a, b) => signalStatusWeight(b.signal?.status) - signalStatusWeight(a.signal?.status));

  const pick = ranked.find((item) => cleanText(item.signal?.summary) && signalStatusWeight(item.signal?.status) >= 2);
  if (!pick) return null;

  const weight = signalStatusWeight(pick.signal?.status);
  return buildRisk({
    day: input.day,
    kind: pick.kind,
    mainLine: pick.signal?.summary ?? '',
    supportLine: 'Belirgin operasyon sinyali yarın tek ana izleme notu olarak tutuldu.',
    tone: weight >= 4 ? 'risk' : 'watch',
    priority: priorityFromWeight(weight),
    source: 'operation_signals',
    relatedDomain: pick.domain,
    relatedDistrictId: signals.priorityDistrictId,
  });
}

function flattenUnknown(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function fromResourceFatigue(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const blob = flattenUnknown(input.resourceFatigue);
  if (!blob || !includesAny(blob, ['tired', 'fatigue', 'critical', 'maintenance', 'yorgun'])) return null;
  const vehicleHeavy = includesAny(blob, ['vehicle', 'truck', 'arac', 'maintenance']);
  return buildRisk({
    day: input.day,
    kind: vehicleHeavy ? 'vehicle_fatigue_watch' : 'personnel_fatigue_watch',
    mainLine: vehicleHeavy
      ? 'Araç temposu yarın rota dengesinde izleme notu olarak kalıyor.'
      : 'Ekip temposu yarın daha dengeli planla izlenmeli.',
    supportLine: 'Kaynak yorgunluğu büyütülmeden, tek sakin takip satırına indirildi.',
    tone: 'watch',
    priority: 'medium',
    source: 'resource_fatigue',
    relatedDomain: vehicleHeavy ? 'vehicle' : 'personnel',
    relatedResource: vehicleHeavy ? 'vehicle' : 'personnel',
  });
}

function fromDistrictTrust(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const blob = `${flattenUnknown(input.districtTrustRuntime)} ${flattenUnknown(input.districtMemoryRuntime)}`;
  if (!blob || !includesAny(blob, ['fragile', 'strained', 'watch', 'unresolved', 'carry'])) return null;
  return buildRisk({
    day: input.day,
    kind: 'district_trust_watch',
    mainLine: 'Mahalle güveni yarın kısa bir izleme notu gerektiriyor.',
    supportLine: 'Aynı mahallede tekrar eden baskı varsa öncelik sakin tutulmalı.',
    tone: 'watch',
    priority: 'medium',
    source: 'district_trust',
    relatedDomain: 'district',
    relatedDistrictId: input.operationSignals?.priorityDistrictId,
  });
}

function fromSocialRecovery(input: TomorrowRiskInput): TomorrowRiskModel | null {
  const score = input.socialPulse?.globalPulseScore ?? input.socialPulse?.score;
  const previous = input.socialPulse?.previousGlobalPulseScore;
  const trend = input.socialPulse?.trend;
  const recovering =
    trend === 'recovering' ||
    trend === 'positive' ||
    (typeof score === 'number' && typeof previous === 'number' && score > previous + 3);
  if (!recovering) return null;
  return buildRisk({
    day: input.day,
    kind: 'recovery_momentum',
    mainLine: 'Sosyal güven toparlanıyor; yarın doğru bir karar bu ivmeyi koruyabilir.',
    supportLine: 'Bu satır ödül dili değil, şehir hafızasının devam notu olarak gösterilir.',
    tone: 'recovery',
    priority: 'medium',
    source: 'social_recovery',
    relatedDomain: 'social',
  });
}

function fromPostPilot(input: TomorrowRiskInput): TomorrowRiskModel | null {
  if (input.day < 7) return null;
  const phase = input.postPilotOperation?.phase;
  if (!phase || phase === 'pilot_active') return null;
  return buildRisk({
    day: input.day,
    kind: input.day >= 8 ? 'operation_era_hint' : 'post_pilot_next_scope',
    mainLine:
      input.day >= 8
        ? 'Ana operasyon kapsamı yarın mahalle ve kaynak dengesinde hissedilebilir.'
        : 'Pilot sonrası kapsam yarın daha geniş bir operasyon notuna dönüşebilir.',
    supportLine: 'Geçiş dili sakin tutuldu; yeni rota veya gameplay sistemi açılmaz.',
    tone: 'opportunity',
    priority: input.day >= 8 ? 'medium' : 'low',
    source: input.day >= 8 ? 'operation_era' : 'post_pilot',
    relatedDomain: 'operation',
    compact: input.day >= 8,
  });
}

function fallback(input: TomorrowRiskInput): TomorrowRiskModel | null {
  if (input.day <= 1) return null;
  return buildRisk({
    day: input.day,
    kind: input.day >= 8 ? 'operation_era_hint' : 'generic_city_preparation',
    mainLine:
      input.day >= 8
        ? 'Şehir yarın ana operasyon gündemine sakin bir hazırlıkla giriyor.'
        : 'Şehir yarına hazırlanıyor.',
    supportLine:
      input.day <= 3
        ? 'Bugünkü kararların etkisi kısa bir izleme notu olarak kalacak.'
        : 'Kaynak, rota ve mahalle dengesi yarın yeniden okunacak.',
    tone: 'calm',
    priority: 'low',
    source: 'fallback',
    relatedDomain: 'city',
    compact: true,
  });
}

export function buildTomorrowRiskModel(input: TomorrowRiskInput): TomorrowRiskModel | null {
  if (!input.day || input.day <= 1) return null;

  const builders = [
    fromCarryOver,
    fromContentPackMeta,
    fromTomorrowHint,
    fromOperationSignals,
    fromResourceFatigue,
    fromDistrictTrust,
    fromSocialRecovery,
    fromPostPilot,
    fallback,
  ];

  for (const build of builders) {
    const candidate = build(input);
    if (!candidate) continue;
    if (isDuplicate(candidate, input.existingLines ?? [])) continue;
    return candidate;
  }

  return null;
}

export function buildOneMoreDayCta(model: TomorrowRiskModel | null, day: number): string | null {
  if (day <= 1) return null;
  if (!model) return TOMORROW_RISK_CITY_CTA;
  if (model.kind === 'recovery_momentum' || model.kind === 'social_trust_recovery') {
    return 'Toparlanma başladı. Yarın doğru bir karar bu ivmeyi koruyabilir.';
  }
  if (model.kind === 'route_pressure_tomorrow') {
    return 'Rota hattı izleme notunda. Bir sonraki gün bu baskıyı dengeleyebilir.';
  }
  if (model.kind === 'vehicle_fatigue_watch' || model.kind === 'resource_balance_watch') {
    return 'Ece yarın rota ve kaynak dengesini izlemeni öneriyor.';
  }
  return model.ctaLine ?? TOMORROW_RISK_CITY_CTA;
}

export function isTomorrowRiskDuplicate(
  model: TomorrowRiskModel | null | undefined,
  existingLines: string[],
): boolean {
  return model ? isDuplicate(model, existingLines) : false;
}

export function normalizeTomorrowRiskTextForVerify(value: string): string {
  return normalizeText(value);
}
