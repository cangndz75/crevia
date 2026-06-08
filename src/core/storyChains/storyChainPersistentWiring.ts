import type { PersistentStoryChainDayCloseInput } from './storyChainPersistentTypes';

export type StoryChainDayCloseStoreInput = {
  closingDay: number;
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  districtId?: string | null;
  carryOverLine?: string | null;
  carryOverUnresolved?: boolean;
  districtReportIssueKind?: string | null;
  tomorrowRiskLine?: string | null;
  tomorrowRiskSoftened?: boolean;
  rewardComebackLine?: string | null;
  rewardComebackKind?: string | null;
  mainOperationFeelLine?: string | null;
  operationSignals?: PersistentStoryChainDayCloseInput['operationSignals'];
  trustImproving?: boolean;
  trustRecovering?: boolean;
  crisisPrevented?: boolean;
  routeBalanced?: boolean;
  containerRelief?: boolean;
  socialResponse?: boolean;
  resourceRecovered?: boolean;
  crisisWatch?: boolean;
};

export function buildPersistentStoryChainDayCloseInput(
  input: StoryChainDayCloseStoreInput,
): PersistentStoryChainDayCloseInput {
  return {
    day: input.closingDay,
    isPostPilot: input.isPostPilot,
    isPilotCompleted: input.isPilotCompleted,
    districtId: input.districtId,
    carryOverLine: input.carryOverLine,
    carryOverUnresolved: input.carryOverUnresolved,
    districtReportIssueKind: input.districtReportIssueKind,
    tomorrowRiskLine: input.tomorrowRiskLine,
    tomorrowRiskSoftened: input.tomorrowRiskSoftened,
    rewardComebackLine: input.rewardComebackLine,
    rewardComebackKind: input.rewardComebackKind,
    mainOperationFeelLine: input.mainOperationFeelLine,
    operationSignals: input.operationSignals,
    trustImproving: input.trustImproving,
    trustRecovering: input.trustRecovering,
    crisisPrevented: input.crisisPrevented,
    routeBalanced: input.routeBalanced,
    containerRelief: input.containerRelief,
    socialResponse: input.socialResponse,
    resourceRecovered: input.resourceRecovered,
    crisisWatch: input.crisisWatch,
  };
}
