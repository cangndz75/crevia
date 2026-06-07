export type {
  RewardComebackHubPresentation,
  RewardComebackInput,
  RewardComebackJournalPresentation,
  RewardComebackMapPresentation,
  RewardComebackMoment,
  RewardComebackMomentKind,
  RewardComebackMomentSourceKind,
  RewardComebackMomentTone,
  RewardComebackReportPresentation,
  RewardComebackResultPresentation,
  RewardComebackSocialPresentation,
  RewardComebackSourceSignals,
  RewardComebackSurface,
  RewardComebackVisibility,
  RewardComebackVisibilityModel,
} from './rewardComebackTypes';

export {
  REWARD_COMEBACK_COPY_LIMITS,
  REWARD_COMEBACK_DAY1_LINE,
  REWARD_COMEBACK_FORBIDDEN_TERMS,
  REWARD_COMEBACK_MOMENT_COPY,
  REWARD_COMEBACK_MOMENT_LABELS,
  REWARD_COMEBACK_VARIANT_KINDS,
  resolveRewardComebackMaxMoments,
  resolveRewardComebackVisibility,
} from './rewardComebackConstants';

export {
  buildRewardComebackMomentForKind,
  buildRewardComebackVisibilityModel,
} from './rewardComebackModel';

export {
  buildRewardComebackEceLine,
  buildRewardComebackHubLine,
  buildRewardComebackJournalLine,
  buildRewardComebackMapLine,
  buildRewardComebackReportLine,
  buildRewardComebackResultLine,
  buildRewardComebackSocialLine,
  clampRewardComebackCopy,
  isDuplicateRewardComebackLine,
  makeRewardComebackDuplicateKey,
  normalizeRewardComebackText,
  rewardComebackCopyContainsForbiddenTerms,
  rewardComebackCopyIsBlaming,
  sanitizeRewardComebackCopy,
} from './rewardComebackPresentation';

export {
  buildRewardComebackHubPresentation,
  buildRewardComebackJournalPresentation,
  buildRewardComebackMapPresentation,
  buildRewardComebackReportPresentation,
  buildRewardComebackResultPresentation,
  buildRewardComebackSocialPresentation,
} from './rewardComebackWiring';
