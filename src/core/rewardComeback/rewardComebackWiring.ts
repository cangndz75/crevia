import { buildRewardComebackVisibilityModel } from './rewardComebackModel';
import {
  buildRewardComebackHubLine,
  buildRewardComebackJournalLine,
  buildRewardComebackMapLine,
  buildRewardComebackReportLine,
  buildRewardComebackResultLine,
  buildRewardComebackSocialLine,
} from './rewardComebackPresentation';
import type {
  RewardComebackHubPresentation,
  RewardComebackInput,
  RewardComebackJournalPresentation,
  RewardComebackMapPresentation,
  RewardComebackReportPresentation,
  RewardComebackResultPresentation,
  RewardComebackSocialPresentation,
} from './rewardComebackTypes';

export function buildRewardComebackHubPresentation(
  input: RewardComebackInput,
): RewardComebackHubPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const hubLine = buildRewardComebackHubLine(model, input.existingLines ?? []);

  return {
    model,
    hubLine,
    visible:
      model.visibility !== 'hidden' &&
      Boolean(hubLine) &&
      model.moments.length > 0 &&
      !input.isDay1Tutorial,
  };
}

export function buildRewardComebackReportPresentation(
  input: RewardComebackInput,
): RewardComebackReportPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const reportLine = buildRewardComebackReportLine(model, input.existingLines ?? []);

  return {
    model,
    reportLine,
    visible: Boolean(reportLine) && model.day >= 2,
  };
}

export function buildRewardComebackResultPresentation(
  input: RewardComebackInput,
): RewardComebackResultPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const resultLine = buildRewardComebackResultLine(model, input.existingLines ?? []);

  return {
    model,
    resultLine,
    label: model.primaryMoment?.playerFacingLabel,
    visible: Boolean(resultLine) && model.day >= 2,
  };
}

export function buildRewardComebackSocialPresentation(
  input: RewardComebackInput,
): RewardComebackSocialPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const socialLine = buildRewardComebackSocialLine(model, input.existingLines ?? []);

  return {
    model,
    socialLine,
    visible: Boolean(socialLine) && model.day >= 2,
  };
}

export function buildRewardComebackMapPresentation(
  input: RewardComebackInput,
): RewardComebackMapPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const mapLine = buildRewardComebackMapLine(model, input.existingLines ?? []);

  return {
    model,
    mapLine,
    mapReactionKind: model.primaryMoment?.mapReactionKind,
    visible: Boolean(mapLine) && model.day >= 3,
  };
}

export function buildRewardComebackJournalPresentation(
  input: RewardComebackInput,
): RewardComebackJournalPresentation {
  const model = buildRewardComebackVisibilityModel(input);
  const journalLine = buildRewardComebackJournalLine(model, input.existingLines ?? []);

  return {
    model,
    journalLine,
    visible: Boolean(journalLine) && model.day >= 4,
  };
}
