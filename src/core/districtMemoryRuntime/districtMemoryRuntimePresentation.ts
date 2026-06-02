import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';

import {
  DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
  DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH,
  DISTRICT_MEMORY_RUNTIME_PANIC_TERMS,
  getDistrictMemoryRuntimeKindDefinition,
} from './districtMemoryRuntimeConstants';
import {
  buildDistrictMemoryRuntimeSnapshot,
  getDistrictMemoryDistrictSnapshot,
} from './districtMemoryRuntimeModel';
import { buildDistrictMemoryRankVisibility } from './districtMemoryRuntimeSignals';
import type {
  CreviaDistrictMemoryKind,
  CreviaDistrictMemoryPresentationModel,
  CreviaDistrictMemorySignalContext,
  CreviaDistrictMemoryTrace,
} from './districtMemoryRuntimeTypes';

function clampCopy(text: string, max = DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function districtMemoryRuntimeCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function districtMemoryRuntimeCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_MEMORY_RUNTIME_PANIC_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, max = DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH): string {
  const clamped = clampCopy(text, max);
  if (districtMemoryRuntimeCopyContainsForbiddenTerms(clamped) || districtMemoryRuntimeCopyContainsPanicTerms(clamped)) {
    return clampCopy('Mahallede operasyon izi sakin seyrediyor.', max);
  }
  return clamped;
}

function districtSnapshot(districtId: MapDistrictId | string, context: CreviaDistrictMemorySignalContext) {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  return getDistrictMemoryDistrictSnapshot(snapshot, districtId) ?? snapshot.districts[0]!;
}

export function buildDistrictMemoryMapLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(district.primaryTrace?.mapHint ?? `${district.districtName}: ${getDistrictMemoryRuntimeKindDefinition(district.primaryKind).shortLabel} izi.`);
}

export function buildDistrictMemoryReportLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(district.primaryTrace?.reportHint ?? district.reasonLine, DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH);
}

export function buildDistrictMemoryAdvisorLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(district.primaryTrace?.advisorHint ?? getDistrictMemoryRuntimeKindDefinition(district.primaryKind).advisorCopyIntent);
}

export function buildDistrictMemoryTomorrowPreviewLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  return safeCopy(district.primaryTrace?.tomorrowHint ?? getDistrictMemoryRuntimeKindDefinition(district.primaryKind).tomorrowCopyIntent);
}

export function buildDistrictMemoryEventContextLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const identity = DISTRICT_IDENTITIES[normalized];
  const district = districtSnapshot(normalized, context);
  const def = getDistrictMemoryRuntimeKindDefinition(district.primaryKind);
  return safeCopy(`${identity.eventContextLine} Hafıza: ${def.shortLabel}.`);
}

export function buildDistrictMemoryCompactChip(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictMemoryRuntimeKindDefinition(district.primaryKind);
  const visibility = buildDistrictMemoryRankVisibility(context);
  const label = visibility.showKind ? def.shortLabel : 'Mahalle İzi';
  return safeCopy(`${district.districtName} · ${label}`, 48);
}

export function buildDistrictMemoryTraceRows(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): string[] {
  const district = districtSnapshot(districtId, context);
  return district.traces.map(
    (trace: CreviaDistrictMemoryTrace) =>
      `${trace.kind} (${trace.intensity}): ${trace.shortLine}`,
  );
}

export function buildDistrictMemoryDebugRows(context: CreviaDistrictMemorySignalContext = {}): string[] {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const rows = [
    `day: ${snapshot.day}`,
    `health: ${snapshot.healthStatus}`,
    `tutorialSimplified: ${snapshot.isTutorialSimplified}`,
    `trustRef: ${snapshot.trustSnapshotRef?.healthStatus ?? 'none'}`,
  ];
  for (const district of snapshot.districts) {
    rows.push(`${district.districtId}: kind ${district.primaryKind} trust ${district.trustBand ?? 'n/a'}`);
  }
  return rows;
}

export function buildDistrictMemoryPresentationModel(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemoryPresentationModel {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictMemoryRuntimeKindDefinition(district.primaryKind);
  const visibility = buildDistrictMemoryRankVisibility(context);

  return {
    districtId: district.districtId,
    districtName: district.districtName,
    kind: district.primaryKind,
    kindLabel: def.label,
    shortLabel: def.shortLabel,
    tone: def.tone,
    mapLine: buildDistrictMemoryMapLine(district.districtId, context),
    reportLine: buildDistrictMemoryReportLine(district.districtId, context),
    advisorLine: buildDistrictMemoryAdvisorLine(district.districtId, context),
    tomorrowPreviewLine: buildDistrictMemoryTomorrowPreviewLine(district.districtId, context),
    eventContextLine: buildDistrictMemoryEventContextLine(district.districtId, context),
    compactChip: buildDistrictMemoryCompactChip(district.districtId, context),
    visibility,
  };
}

export function validateDistrictMemoryPresentationCopy(model: CreviaDistrictMemoryPresentationModel): boolean {
  const lines = [
    model.mapLine,
    model.reportLine,
    model.advisorLine,
    model.tomorrowPreviewLine,
    model.eventContextLine,
    model.compactChip,
  ].filter(Boolean) as string[];

  for (const line of lines) {
    if (line.length > DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH + 1) return false;
    if (districtMemoryRuntimeCopyContainsForbiddenTerms(line)) return false;
    if (districtMemoryRuntimeCopyContainsPanicTerms(line)) return false;
  }

  const unique = new Set(lines.map((l) => l.toLocaleLowerCase('tr-TR')));
  if (unique.size < lines.length) return false;

  return true;
}

export function listDistrictMemoryRuntimeKinds(): readonly CreviaDistrictMemoryKind[] {
  return [
    'unresolved_carry_over',
    'repeated_pressure',
    'recent_improvement',
    'recovery_window',
    'trust_shift',
    'resource_strain',
    'social_echo',
    'crisis_watch',
    'operation_followup',
    'quiet_stable',
  ];
}
