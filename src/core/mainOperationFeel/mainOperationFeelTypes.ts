import type { CityEchoBinding } from '@/core/cityEchoBinding/cityEchoBindingTypes';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

export type MainOperationFeelAccessMode = 'light' | 'full' | 'unknown';

export type MainOperationFeelTone =
  | 'opening'
  | 'expanding'
  | 'steady'
  | 'watch'
  | 'recovery';

export type MainOperationFeelModel = {
  day: number;
  isPostPilot: boolean;
  accessMode: MainOperationFeelAccessMode;
  title: string;
  subtitle: string;
  scopeLine: string;
  cityStateLine?: string;
  districtFocusLine?: string;
  operationTempoLine?: string;
  eceLine?: string;
  mapLine?: string;
  reportLine?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  tone: MainOperationFeelTone;
  priorityDistrictIds: string[];
  visibleDistrictScope: string[];
  shouldShowHubHero: boolean;
  shouldShowReportSection: boolean;
  shouldShowMapHint: boolean;
  maxVisibleLines: number;
  sourceSignals: string[];
  visible: boolean;
};

export type MainOperationFeelOperationSignalsInput = {
  priorityDistrictId?: string;
  dailyFocus?: string;
  vehicles?: { status?: string; summary?: string };
  containers?: { status?: string; summary?: string };
  personnel?: { status?: string; summary?: string };
  districts?: { status?: string; summary?: string };
  overall?: { status?: string; summary?: string };
};

export type MainOperationFeelInput = {
  day: number;
  isPilotCompleted?: boolean;
  accessMode?: 'none' | 'limited' | 'full';
  postPilotPhase?: PostPilotPhase;
  mainOperationSeason?: MainOperationSeasonState | null;
  operationSignals?: MainOperationFeelOperationSignalsInput | null;
  districtTrustRuntime?: Record<string, { state?: string }> | null;
  districtMemoryRuntime?: Record<string, { kind?: string }> | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityEchoBinding?: CityEchoBinding | null;
  progressionBridgeScopeLine?: string | null;
  operationSignalsSummary?: string | null;
  contentPackPresentationHint?: string | null;
  existingLines?: string[];
};

export type MainOperationFeelHubPresentation = {
  model: MainOperationFeelModel;
  heroTitle: string;
  heroSubtitle: string;
  scopeLine: string;
  detailLine?: string;
  ctaLabel?: string;
  compact: boolean;
  visible: boolean;
};

export type MainOperationFeelReportPresentation = {
  model: MainOperationFeelModel;
  reportLine?: string;
  supportLine?: string;
  visible: boolean;
};

export type MainOperationFeelMapPresentation = {
  model: MainOperationFeelModel;
  hintLine?: string;
  visible: boolean;
};
