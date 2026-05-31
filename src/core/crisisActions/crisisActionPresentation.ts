import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  ALL_CRISIS_ACTION_TYPES,
  CRISIS_ACTION_DEFINITIONS,
  CRISIS_ACTION_UI_COPY,
} from './crisisActionConstants';
import {
  deriveCrisisActionAccessMode,
  getCrisisActionAdvisorLine,
  selectBestCrisisActionType,
  buildCrisisActionEngineInputFromStore,
  isCrisisActionOfferVisible,
} from './crisisActionEngine';
import {
  getActiveCrisisAction,
  getSelectedCrisisActionForDay,
  hasSelectedCrisisActionForDay,
} from './crisisActionState';
import type {
  CrisisActionEngineInput,
  CrisisActionHubModel,
  CrisisActionReportModel,
  CrisisActionSheetModel,
  CrisisActionTone,
  CrisisActionType,
  CrisisResolutionAction,
} from './crisisActionTypes';

export function getCrisisActionTypeLabel(type: CrisisActionType): string {
  return CRISIS_ACTION_DEFINITIONS[type].label;
}

export function getCrisisActionIconKey(type: CrisisActionType): string {
  return CRISIS_ACTION_DEFINITIONS[type].iconKey;
}

export function getCrisisActionTone(action: CrisisResolutionAction): CrisisActionTone {
  if (action.type === 'monitor_only') return 'warning';
  if (action.type === 'crisis_coordination' || action.type === 'field_rebalance') {
    return 'positive';
  }
  return 'neutral';
}

export function buildCrisisActionAdvisorLine(
  input: CrisisActionEngineInput,
  action: CrisisResolutionAction,
): string | undefined {
  return getCrisisActionAdvisorLine(input, action);
}

export function buildCrisisActionHubModel(
  input: CrisisActionEngineInput,
  options?: { compact?: boolean },
): CrisisActionHubModel | undefined {
  const day = input.gameState.city.day;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return undefined;
  if (deriveCrisisActionAccessMode(input) !== 'active') return undefined;
  if (!isCrisisActionOfferVisible(input)) return undefined;

  const selected = getSelectedCrisisActionForDay(input.crisisActionState, day);
  const active = getActiveCrisisAction(input.crisisActionState);
  const action = selected ?? active;
  if (!action) return undefined;

  const tone = getCrisisActionTone(action);
  const advisorLine = buildCrisisActionAdvisorLine(input, action);

  if (selected) {
    return {
      title: CRISIS_ACTION_UI_COPY.hubTitle,
      subtitle: CRISIS_ACTION_UI_COPY.hubSubtitle,
      actionLabel: action.title,
      summary: action.summary,
      reasonLine: action.reasonLine,
      tradeoffLine: action.tradeoffLine,
      advisorLine,
      tone,
      ctaLabel: '',
      selectedLabel: CRISIS_ACTION_UI_COPY.selectedLabel,
      compact: options?.compact ?? false,
      visible: true,
    };
  }

  return {
    title: CRISIS_ACTION_UI_COPY.hubTitle,
    subtitle: CRISIS_ACTION_UI_COPY.hubSubtitle,
    actionLabel: action.title,
    summary: action.summary,
    reasonLine: action.reasonLine,
    tradeoffLine: action.tradeoffLine,
    advisorLine,
    tone,
    ctaLabel: CRISIS_ACTION_UI_COPY.ctaSelect,
    compact: options?.compact ?? false,
    visible: true,
  };
}

export function buildCrisisActionSheetModel(
  input: CrisisActionEngineInput,
): CrisisActionSheetModel | undefined {
  if (deriveCrisisActionAccessMode(input) !== 'active') return undefined;
  if (hasSelectedCrisisActionForDay(input.crisisActionState, input.gameState.city.day)) {
    return undefined;
  }

  const recommended = selectBestCrisisActionType(input);

  return {
    title: CRISIS_ACTION_UI_COPY.sheetTitle,
    subtitle: CRISIS_ACTION_UI_COPY.sheetSubtitle,
    actionRows: ALL_CRISIS_ACTION_TYPES.map((type) => {
      const def = CRISIS_ACTION_DEFINITIONS[type];
      return {
        id: type,
        label: def.label,
        summary: def.summary,
        tradeoff: def.tradeoff,
        tone: type === 'monitor_only' ? 'warning' : 'neutral',
        iconKey: def.iconKey,
        isRecommended: type === recommended,
      };
    }),
    confirmLabel: CRISIS_ACTION_UI_COPY.ctaApply,
    footerNote: CRISIS_ACTION_UI_COPY.sheetFooter,
  };
}

export function buildCrisisActionReportModel(
  input: CrisisActionEngineInput,
  closingDay?: number,
): CrisisActionReportModel {
  const day = closingDay ?? input.gameState.city.day;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) {
    return { title: '', lines: [], footerNote: '', tone: 'neutral', visible: false };
  }
  if (deriveCrisisActionAccessMode(input) !== 'active') {
    return { title: '', lines: [], footerNote: '', tone: 'neutral', visible: false };
  }

  const summary = input.crisisActionState.dailySummary;
  const selected = getSelectedCrisisActionForDay(input.crisisActionState, day);
  const processed = Object.values(input.crisisActionState.actionsById).find(
    (a) => a.day === day && a.status === 'processed',
  );
  const action = processed ?? selected;

  if (!action && (!summary || summary.processedCount === 0)) {
    return { title: '', lines: [], footerNote: '', tone: 'neutral', visible: false };
  }

  const lines =
    summary?.reportLines && summary.reportLines.length > 0
      ? summary.reportLines.slice(0, 3)
      : action
        ? [action.summary, action.tradeoffLine].filter(Boolean).slice(0, 3)
        : [];

  return {
    title: CRISIS_ACTION_UI_COPY.reportTitle,
    lines,
    footerNote: CRISIS_ACTION_UI_COPY.reportFooter,
    tone: action ? getCrisisActionTone(action) : 'neutral',
    visible: lines.length > 0,
  };
}

export function buildCrisisActionPresentationInputFromStore(state: {
  gameState: CrisisActionEngineInput['gameState'];
  monetization: CrisisActionEngineInput['monetization'];
  crisisState: CrisisActionEngineInput['crisisState'];
  operationSignals: CrisisActionEngineInput['operationSignals'];
  assignments?: CrisisActionEngineInput['assignments'];
  dailyOperationsPlan?: CrisisActionEngineInput['dailyOperationsPlan'];
  mainOperationSeason?: CrisisActionEngineInput['mainOperationSeason'];
  advisorState?: CrisisActionEngineInput['advisorState'];
  crisisActionState: CrisisActionEngineInput['crisisActionState'];
}): CrisisActionEngineInput {
  return buildCrisisActionEngineInputFromStore(state);
}
