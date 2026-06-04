import {
  DISTRICT_OPERATION_ACTION_FORBIDDEN_TERMS,
  DISTRICT_OPERATION_ACTION_MAX_COPY,
} from './districtOperationActionConstants';
import type { CreviaDistrictOperationAction } from './districtOperationActionTypes';

function clampCopy(text: string, max = DISTRICT_OPERATION_ACTION_MAX_COPY): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function districtOperationActionCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_OPERATION_ACTION_FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

function safeCopy(text: string): string {
  const copy = clampCopy(text);
  return districtOperationActionCopyContainsForbiddenTerms(copy)
    ? 'Mahalle odağı küçük ve kontrollü tutuluyor.'
    : copy;
}

export function buildDistrictOperationActionHubCopy(action: CreviaDistrictOperationAction): string {
  if (action.status === 'preview_only') {
    return safeCopy(`${action.districtName}: mahalle hamlesi yakında seçilebilir.`);
  }
  if (action.status === 'blocked') {
    return safeCopy(`${action.districtName}: bugün izleme modu korunuyor.`);
  }
  return safeCopy(`${action.districtName}: ${action.shortLabel} günlük hamle olabilir.`);
}

export function buildDistrictOperationActionMapCopy(action: CreviaDistrictOperationAction): string {
  return safeCopy(`${action.shortLabel}: ${action.reasonLine}`);
}

export function buildDistrictOperationActionReportLine(action: CreviaDistrictOperationAction): string {
  return safeCopy(action.effect.summaryLine);
}

export function buildDistrictOperationActionTomorrowLine(action: CreviaDistrictOperationAction): string {
  return safeCopy(action.effect.tomorrowLine);
}

export function buildDistrictOperationActionAnalyticsPayload(
  action: CreviaDistrictOperationAction | null | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!action) return undefined;
  return {
    day: action.day,
    districtId: action.districtId,
    operationKind: action.operationKind,
    status: action.status,
    rankBand: action.rankBand,
    isPostPilot: action.isPostPilot,
    source: 'district_operation_action',
  };
}

export function validateDistrictOperationActionCopy(action: CreviaDistrictOperationAction): boolean {
  const lines = [
    action.label,
    action.shortLabel,
    action.ctaLabel,
    action.reasonLine,
    action.effectPreviewLine,
    action.effect.summaryLine,
    action.effect.tomorrowLine,
    action.effect.advisorLine,
    buildDistrictOperationActionHubCopy(action),
    buildDistrictOperationActionMapCopy(action),
  ];
  return lines.every(
    (line) =>
      line.length <= DISTRICT_OPERATION_ACTION_MAX_COPY + 1 &&
      !districtOperationActionCopyContainsForbiddenTerms(line),
  );
}
