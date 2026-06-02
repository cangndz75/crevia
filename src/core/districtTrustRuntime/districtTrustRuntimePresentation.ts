import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';

import {
  DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
  DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH,
  DISTRICT_TRUST_RUNTIME_PANIC_TERMS,
  getDistrictTrustRuntimeBandDefinition,
} from './districtTrustRuntimeConstants';
import {
  buildDistrictTrustRuntimeSnapshot,
  getDistrictTrustDistrictSnapshot,
} from './districtTrustRuntimeModel';
import { buildDistrictTrustRankVisibility } from './districtTrustRuntimeSignals';
import type {
  CreviaDistrictTrustBand,
  CreviaDistrictTrustDistrictSnapshot,
  CreviaDistrictTrustPresentationModel,
  CreviaDistrictTrustSignalContext,
} from './districtTrustRuntimeTypes';

function clampCopy(text: string, max = DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function districtTrustRuntimeCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function districtTrustRuntimeCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_TRUST_RUNTIME_PANIC_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string, max = DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH): string {
  const clamped = clampCopy(text, max);
  if (districtTrustRuntimeCopyContainsForbiddenTerms(clamped) || districtTrustRuntimeCopyContainsPanicTerms(clamped)) {
    return clampCopy('Mahalle güveni operasyon tonunu etkiliyor.', max);
  }
  return clamped;
}

function districtSnapshot(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext,
): CreviaDistrictTrustDistrictSnapshot {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  return getDistrictTrustDistrictSnapshot(snapshot, districtId) ?? snapshot.districts[0]!;
}

export function buildDistrictTrustMapLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  return safeCopy(`${district.districtName}: ${def.shortLabel} — ${def.mapTone === 'recovery' ? 'toparlanma izleniyor' : 'güven sinyali aktif'}.`);
}

export function buildDistrictTrustReportLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  return safeCopy(`${district.districtName} — ${def.reportCopyIntent}`, DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH);
}

export function buildDistrictTrustAdvisorLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  return safeCopy(`${district.districtName}: ${def.advisorCopyIntent}`);
}

export function buildDistrictTrustTomorrowPreviewLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  if (district.trend === 'recovering' || district.trend === 'improving') {
    return safeCopy(`${district.districtName} yarın toparlanma adımı için uygun görünüyor.`);
  }
  return safeCopy(`${district.districtName} güven sinyali yarınki öncelikleri etkileyebilir.`);
}

export function buildDistrictTrustEventContextLine(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const identity = DISTRICT_IDENTITIES[normalized];
  const district = districtSnapshot(normalized, context);
  return safeCopy(`${identity.eventContextLine} Güven: ${getDistrictTrustRuntimeBandDefinition(district.band).shortLabel}.`);
}

export function buildDistrictTrustCompactChip(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  return safeCopy(`${district.districtName} · ${def.shortLabel}`, 48);
}

export function buildDistrictTrustDebugRows(
  context: CreviaDistrictTrustSignalContext = {},
): string[] {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const rows = [
    `day: ${snapshot.day}`,
    `health: ${snapshot.healthStatus}`,
    `tutorialSimplified: ${snapshot.isTutorialSimplified}`,
    `focus: ${snapshot.focusDistrictId}`,
  ];
  for (const district of snapshot.districts) {
    rows.push(`${district.districtId}: score ${district.score} band ${district.band} trend ${district.trend}`);
  }
  return rows;
}

export function buildDistrictTrustPresentationModel(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustPresentationModel {
  const district = districtSnapshot(districtId, context);
  const def = getDistrictTrustRuntimeBandDefinition(district.band);
  const visibility = buildDistrictTrustRankVisibility(context);

  return {
    districtId: district.districtId,
    districtName: district.districtName,
    band: district.band,
    bandLabel: def.label,
    shortLabel: def.shortLabel,
    tone: def.tone,
    mapLine: buildDistrictTrustMapLine(district.districtId, context),
    reportLine: buildDistrictTrustReportLine(district.districtId, context),
    advisorLine: buildDistrictTrustAdvisorLine(district.districtId, context),
    tomorrowPreviewLine: buildDistrictTrustTomorrowPreviewLine(district.districtId, context),
    eventContextLine: buildDistrictTrustEventContextLine(district.districtId, context),
    compactChip: buildDistrictTrustCompactChip(district.districtId, context),
    visibility,
  };
}

export function validateDistrictTrustPresentationCopy(model: CreviaDistrictTrustPresentationModel): boolean {
  const lines = [
    model.mapLine,
    model.reportLine,
    model.advisorLine,
    model.tomorrowPreviewLine,
    model.eventContextLine,
    model.compactChip,
  ].filter(Boolean) as string[];

  for (const line of lines) {
    if (line.length > DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH + 1) return false;
    if (districtTrustRuntimeCopyContainsForbiddenTerms(line)) return false;
    if (districtTrustRuntimeCopyContainsPanicTerms(line)) return false;
  }

  const unique = new Set(lines.map((l) => l.toLocaleLowerCase('tr-TR')));
  if (unique.size < lines.length) return false;

  return true;
}

export function listDistrictTrustRuntimeBands(): readonly CreviaDistrictTrustBand[] {
  return ['fragile', 'strained', 'watch', 'stable', 'trusted', 'improving', 'recovering'];
}
