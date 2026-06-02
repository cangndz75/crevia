import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';

import {
  DISTRICT_OPERATIONS_RUNTIME_FORBIDDEN_COPY_TERMS,
  DISTRICT_OPERATIONS_RUNTIME_MAX_COPY_LENGTH,
  DISTRICT_OPERATIONS_RUNTIME_MOBILE_COPY_LENGTH,
  DISTRICT_OPERATIONS_RUNTIME_PANIC_TERMS,
  getDistrictOperationRuntimeKindDefinition,
} from './districtOperationsRuntimeConstants';
import {
  buildDistrictOperationsRuntimeSnapshot,
  getDistrictOperationRuntimeDistrictSnapshot,
} from './districtOperationsRuntimeModel';
import { buildDistrictOperationRankVisibility } from './districtOperationsRuntimeSignals';
import type {
  CreviaDistrictOperationRuntimeContext,
  CreviaDistrictOperationRuntimePresentationModel,
} from './districtOperationsRuntimeTypes';

function clampCopy(text: string, max = DISTRICT_OPERATIONS_RUNTIME_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function districtOperationsRuntimeCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_OPERATIONS_RUNTIME_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function districtOperationsRuntimeCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_OPERATIONS_RUNTIME_PANIC_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, max = DISTRICT_OPERATIONS_RUNTIME_MOBILE_COPY_LENGTH): string {
  const clamped = clampCopy(text, max);
  if (
    districtOperationsRuntimeCopyContainsForbiddenTerms(clamped) ||
    districtOperationsRuntimeCopyContainsPanicTerms(clamped)
  ) {
    return clampCopy('Mahalle operasyon önerisi sakin seyrediyor.', max);
  }
  return clamped;
}

function districtSnapshot(districtId: MapDistrictId | string, context: CreviaDistrictOperationRuntimeContext) {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  return getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId) ?? snapshot.districts[0]!;
}

export function buildDistrictOperationHubLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const visibility = buildDistrictOperationRankVisibility(context);
  if (visibility.mode === 'hidden') {
    return safeCopy('Sıradaki mahalle operasyonu: izleme modu.', 64);
  }

  const district = districtSnapshot(districtId, context);
  const primary = district.primary;
  if (!primary) return safeCopy('Sıradaki mahalle operasyonu henüz net değil.', 64);

  const label = visibility.showKind ? primary.shortLabel : 'Operasyon';
  return safeCopy(`Sıradaki mahalle operasyonu: ${district.districtName} · ${label}.`, 80);
}

export function buildDistrictOperationMapLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(district.primary?.mapLine ?? `${district.districtName}: operasyon ipucu.`);
}

export function buildDistrictOperationReportLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(
    district.primary?.reportLine ?? `${district.districtName} — operasyon önerisi.`,
    DISTRICT_OPERATIONS_RUNTIME_MAX_COPY_LENGTH,
  );
}

export function buildDistrictOperationAdvisorLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = district.primary?.kind
    ? getDistrictOperationRuntimeKindDefinition(district.primary.kind)
    : undefined;
  return safeCopy(district.primary?.advisorLine ?? def?.advisorHintIntent ?? 'Mahalle operasyonu izleniyor.');
}

export function buildDistrictOperationTomorrowPreviewLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = district.primary?.kind
    ? getDistrictOperationRuntimeKindDefinition(district.primary.kind)
    : undefined;
  return safeCopy(district.primary?.tomorrowLine ?? def?.tomorrowHintIntent ?? 'Yarın operasyon önerisi güncellenebilir.');
}

export function buildDistrictOperationCompactChip(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const visibility = buildDistrictOperationRankVisibility(context);
  const label = visibility.showKind ? (district.primary?.shortLabel ?? 'Operasyon') : 'Öneri';
  return safeCopy(`${district.districtName} · ${label}`, 48);
}

export function buildDistrictOperationDebugRows(context: CreviaDistrictOperationRuntimeContext = {}): string[] {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const rows = [
    `day: ${snapshot.day}`,
    `health: ${snapshot.healthStatus}`,
    `tutorialSimplified: ${snapshot.isTutorialSimplified}`,
  ];
  for (const district of snapshot.districts) {
    rows.push(
      `${district.districtId}: primary ${district.primary?.kind ?? 'none'} score ${district.primary?.score ?? 0}`,
    );
  }
  return rows;
}

export function buildDistrictOperationPresentationModel(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimePresentationModel {
  const district = districtSnapshot(districtId, context);
  const visibility = buildDistrictOperationRankVisibility(context);

  return {
    districtId: district.districtId,
    districtName: district.districtName,
    primaryKind: district.primary?.kind,
    hubLine: buildDistrictOperationHubLine(district.districtId, context),
    mapLine: buildDistrictOperationMapLine(district.districtId, context),
    reportLine: buildDistrictOperationReportLine(district.districtId, context),
    advisorLine: buildDistrictOperationAdvisorLine(district.districtId, context),
    tomorrowPreviewLine: buildDistrictOperationTomorrowPreviewLine(district.districtId, context),
    compactChip: buildDistrictOperationCompactChip(district.districtId, context),
    visibility,
  };
}

export function validateDistrictOperationPresentationCopy(
  model: CreviaDistrictOperationRuntimePresentationModel,
): boolean {
  const lines = [
    model.hubLine,
    model.mapLine,
    model.reportLine,
    model.advisorLine,
    model.tomorrowPreviewLine,
    model.compactChip,
  ].filter(Boolean) as string[];

  for (const line of lines) {
    if (line.length > DISTRICT_OPERATIONS_RUNTIME_MAX_COPY_LENGTH + 1) return false;
    if (districtOperationsRuntimeCopyContainsForbiddenTerms(line)) return false;
    if (districtOperationsRuntimeCopyContainsPanicTerms(line)) return false;
  }

  const unique = new Set(lines.map((l) => l.toLocaleLowerCase('tr-TR')));
  if (unique.size < lines.length) return false;

  return true;
}

export function buildDistrictOperationEventContextLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): string {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const identity = DISTRICT_IDENTITIES[normalized];
  const district = districtSnapshot(normalized, context);
  const def = district.primary?.kind
    ? getDistrictOperationRuntimeKindDefinition(district.primary.kind)
    : undefined;
  return safeCopy(`${identity.eventContextLine} Operasyon: ${def?.shortLabel ?? 'Öneri'}.`);
}

export function listDistrictOperationRuntimeKindsByDistrict(): Record<MapDistrictId, string[]> {
  const snapshot = buildDistrictOperationsRuntimeSnapshot({ day: 10 });
  const out = {} as Record<MapDistrictId, string[]>;
  for (const d of snapshot.districts) {
    out[d.districtId] = d.candidates.map((c) => c.kind);
  }
  return out;
}
