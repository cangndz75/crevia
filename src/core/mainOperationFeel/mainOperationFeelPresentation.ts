import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import type { MainOperationEngineInput } from '@/core/mainOperation/mainOperationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { PostPilotOperationState } from '@/core/postPilot/postPilotOperationTypes';
import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

import {
  buildMainOperationFeelModel,
  isMainOperationFeelDuplicate,
  shouldShowMainOperationFeel,
} from './mainOperationFeelModel';
import type {
  MainOperationFeelHubPresentation,
  MainOperationFeelInput,
  MainOperationFeelMapPresentation,
  MainOperationFeelModel,
  MainOperationFeelReportPresentation,
} from './mainOperationFeelTypes';

export type BuildMainOperationFeelFromStoreInput = {
  gameState: GameState;
  monetization: MonetizationState;
  mainOperationSeason?: MainOperationEngineInput['mainOperationSeason'];
  operationSignals?: OperationSignalsState | null;
  postPilotOperation?: PostPilotOperationState | null;
  districtTrustRuntime?: Record<string, { state?: string }> | null;
  districtMemoryRuntime?: Record<string, { kind?: string }> | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEchoBinding?: CityEchoBinding | null;
  progressionBridgeScopeLine?: string | null;
  operationSignalsSummary?: string | null;
  contentPackPresentationHint?: string | null;
  existingLines?: string[];
};

export function buildMainOperationFeelInputFromStore(
  input: BuildMainOperationFeelFromStoreInput,
): MainOperationFeelInput {
  const day = input.gameState.city.day;
  const accessMode = deriveMainOperationAccessMode(input.gameState, input.monetization);

  return {
    day,
    isPilotCompleted: input.gameState.pilot.status === 'completed',
    accessMode,
    postPilotPhase: input.postPilotOperation?.phase ?? input.gameState.pilot.postPilotOperation?.phase,
    mainOperationSeason: input.mainOperationSeason ?? undefined,
    operationSignals: input.operationSignals ?? undefined,
    districtTrustRuntime: input.districtTrustRuntime ?? undefined,
    districtMemoryRuntime: input.districtMemoryRuntime ?? undefined,
    tomorrowRisk: input.tomorrowRisk ?? undefined,
    cityEchoBinding: input.cityEchoBinding ?? undefined,
    progressionBridgeScopeLine: input.progressionBridgeScopeLine ?? undefined,
    operationSignalsSummary: input.operationSignalsSummary ?? undefined,
    contentPackPresentationHint: input.contentPackPresentationHint ?? undefined,
    existingLines: input.existingLines ?? [],
  };
}

export function buildMainOperationFeelFromStore(
  input: BuildMainOperationFeelFromStoreInput,
): MainOperationFeelModel {
  return buildMainOperationFeelModel(buildMainOperationFeelInputFromStore(input));
}

export function buildMainOperationFeelHubPresentation(
  model: MainOperationFeelModel,
): MainOperationFeelHubPresentation {
  const compact = model.tone !== 'opening';
  const detailLine = compact
    ? model.districtFocusLine ?? model.operationTempoLine
    : model.cityStateLine ?? model.districtFocusLine;

  return {
    model,
    heroTitle: model.title,
    heroSubtitle: model.subtitle,
    scopeLine: model.scopeLine,
    detailLine,
    ctaLabel: model.primaryCTA,
    compact,
    visible: model.visible && model.shouldShowHubHero,
  };
}

export function buildMainOperationFeelReportPresentation(
  model: MainOperationFeelModel,
  existingLines: string[] = [],
): MainOperationFeelReportPresentation {
  const reportLine =
    model.reportLine && !isMainOperationFeelDuplicate(model.reportLine, existingLines)
      ? model.reportLine
      : undefined;

  const supportLine =
    model.districtFocusLine &&
    reportLine &&
    !isMainOperationFeelDuplicate(model.districtFocusLine, [...existingLines, reportLine])
      ? model.districtFocusLine
      : model.operationTempoLine &&
          reportLine &&
          !isMainOperationFeelDuplicate(model.operationTempoLine, [...existingLines, reportLine])
        ? model.operationTempoLine
        : undefined;

  return {
    model,
    reportLine,
    supportLine,
    visible: model.visible && model.shouldShowReportSection && Boolean(reportLine),
  };
}

export function buildMainOperationFeelMapHint(
  model: MainOperationFeelModel,
  existingLines: string[] = [],
): MainOperationFeelMapPresentation {
  const hintLine =
    model.mapLine && !isMainOperationFeelDuplicate(model.mapLine, existingLines)
      ? model.mapLine
      : undefined;

  return {
    model,
    hintLine,
    visible: model.visible && model.shouldShowMapHint && Boolean(hintLine),
  };
}

export function buildMainOperationFeelEceLine(
  model: MainOperationFeelModel,
  existingLines: string[] = [],
): string | undefined {
  if (!model.visible || !model.eceLine) return undefined;
  if (isMainOperationFeelDuplicate(model.eceLine, existingLines)) return undefined;
  return model.eceLine;
}

export function shouldSuppressMainOperationFeelForDay(input: MainOperationFeelInput): boolean {
  return !shouldShowMainOperationFeel(input);
}

export {
  buildMainOperationFeelModel,
  isMainOperationFeelDuplicate,
  mainOperationFeelContainsForbiddenWords,
  normalizeMainOperationFeelText,
  shouldShowMainOperationFeel,
} from './mainOperationFeelModel';

export { MAIN_OPERATION_FEEL_COPY } from './mainOperationFeelConstants';
