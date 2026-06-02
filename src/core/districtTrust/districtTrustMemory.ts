import { getDistrictIdentity } from '@/core/districts/districtIdentityPresentation';

import type {
  DistrictTrustMemoryItem,
  DistrictTrustMemoryKind,
  DistrictTrustPressureDomain,
  DistrictTrustScoreResult,
  DistrictTrustSignalSource,
} from './districtTrustTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textBlob(...values: unknown[]): string {
  return values
    .flatMap((value): string[] => {
      if (typeof value === 'string') return [value];
      if (Array.isArray(value)) return value.map((item) => textBlob(item));
      if (isRecord(value)) return Object.values(value).map((item) => textBlob(item));
      return [];
    })
    .join(' ')
    .toLocaleLowerCase('tr-TR');
}

export function buildDistrictTrustMemoryKind(input: {
  trend?: string;
  pressureDomains?: DistrictTrustPressureDomain[];
  source?: DistrictTrustSignalSource;
  text?: string;
}): DistrictTrustMemoryKind {
  const text = `${input.trend ?? ''} ${input.source ?? ''} ${input.text ?? ''}`.toLocaleLowerCase('tr-TR');
  if (text.includes('resolved') || text.includes('çözüldü') || text.includes('azaldı')) {
    return 'recent_improvement';
  }
  if (input.pressureDomains?.includes('crisis') || text.includes('crisis') || text.includes('kriz')) {
    return 'crisis_watch';
  }
  if (input.pressureDomains?.includes('resource_recovery') || text.includes('recovery') || text.includes('toparlan')) {
    return 'recovery_window';
  }
  if (input.pressureDomains?.some((domain) => domain === 'vehicle_route' || domain === 'personnel' || domain === 'container')) {
    return 'resource_strain';
  }
  if (text.includes('carry') || text.includes('yarın') || text.includes('ertesi')) {
    return 'unresolved_carry_over';
  }
  if (text.includes('gratitude') || text.includes('teşekkür') || text.includes('güven')) {
    return 'public_confidence_gain';
  }
  if (text.includes('repeated') || text.includes('tekrar')) {
    return 'repeated_pressure';
  }
  return 'stable_operation';
}

function makeMemoryItem(input: {
  districtId: DistrictTrustScoreResult['districtId'];
  kind: DistrictTrustMemoryKind;
  title: string;
  description: string;
  source: DistrictTrustSignalSource;
  tone: DistrictTrustMemoryItem['tone'];
  day?: number;
  priority: number;
}): DistrictTrustMemoryItem {
  return {
    id: `${input.districtId}-${input.kind}-${input.source}`,
    districtId: input.districtId,
    kind: input.kind,
    title: input.title,
    description: input.description,
    source: input.source,
    tone: input.tone,
    day: input.day,
    priority: input.priority,
  };
}

export function limitDistrictMemoryItems(
  items: readonly DistrictTrustMemoryItem[],
  max = 2,
): DistrictTrustMemoryItem[] {
  return [...items]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, Math.max(0, max));
}

export function buildDistrictTrustMemoryItems(input: {
  districtId: DistrictTrustScoreResult['districtId'];
  trustScoreResult: DistrictTrustScoreResult;
  recentEvents?: unknown;
  carryOver?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  socialPulse?: unknown;
}): DistrictTrustMemoryItem[] {
  const district = getDistrictIdentity(input.districtId);
  const items: DistrictTrustMemoryItem[] = [];
  const pressure = input.trustScoreResult.pressureDomains;
  const carryText = textBlob(input.carryOver);
  const resourceText = textBlob(input.resourceFatigue);
  const crisisText = textBlob(input.crisisState);
  const socialText = textBlob(input.socialPulse);
  const recentText = textBlob(input.recentEvents);

  if (
    pressure.length >= 2 ||
    recentText.includes('repeated') ||
    recentText.includes('tekrar')
  ) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind: 'repeated_pressure',
        title: `${district.shortLabel} baskısı`,
        description: `${district.shortLabel} içinde tekrarlayan operasyon baskısı izleniyor.`,
        source: 'recent_event',
        tone: 'warning',
        priority: 70,
      }),
    );
  }

  if (carryText.includes('unresolved') || carryText.includes('pending') || carryText.includes('yarın')) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind: 'unresolved_carry_over',
        title: 'Ertelenen iz',
        description: `${district.shortLabel} karar izi ertesi güne taşınıyor.`,
        source: 'carry_over',
        tone: 'warning',
        priority: 80,
      }),
    );
  }

  if (
    resourceText.includes('strained') ||
    resourceText.includes('critical') ||
    pressure.some((domain) => domain === 'vehicle_route' || domain === 'personnel' || domain === 'container')
  ) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind: 'resource_strain',
        title: 'Kaynak baskısı',
        description: `${district.shortLabel} kaynak dengesi izleniyor.`,
        source: 'resource_fatigue',
        tone: 'warning',
        priority: 65,
      }),
    );
  }

  if (crisisText.includes('watch') || crisisText.includes('elevated') || pressure.includes('crisis')) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind: 'crisis_watch',
        title: 'Kriz eşiği',
        description: `${district.shortLabel} için risk eşiği dikkatle izleniyor.`,
        source: 'crisis_state',
        tone: 'warning',
        priority: 90,
      }),
    );
  }

  if (
    input.trustScoreResult.trend === 'recovering' ||
    input.trustScoreResult.trend === 'improving' ||
    recentText.includes('reward') ||
    recentText.includes('recovery') ||
    socialText.includes('gratitude')
  ) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind:
          socialText.includes('gratitude') || recentText.includes('reward')
            ? 'public_confidence_gain'
            : 'recovery_window',
        title: 'Toparlanma izi',
        description: `${district.shortLabel} güveni son sinyallerle toparlanıyor.`,
        source: socialText ? 'social_pulse' : 'recent_event',
        tone: 'positive',
        priority: 85,
      }),
    );
  }

  if (items.length === 0) {
    items.push(
      makeMemoryItem({
        districtId: input.districtId,
        kind: 'stable_operation',
        title: 'Sakin operasyon',
        description: `${district.shortLabel} için görünür güven baskısı sınırlı.`,
        source: 'district_identity',
        tone: 'neutral',
        priority: 20,
      }),
    );
  }

  return limitDistrictMemoryItems(items, 2);
}

export function buildDistrictMemoryLine(
  items: readonly DistrictTrustMemoryItem[],
): string | undefined {
  const first = limitDistrictMemoryItems(items, 1)[0];
  if (!first) return undefined;
  const line = first.description.replace(/\s+/g, ' ').trim();
  return line.length <= 96 ? line : `${line.slice(0, 93).trim()}...`;
}

export const __districtTrustMemoryInternals = {
  asString,
};
