import type {
  SocialDecisionEchoModel,
  SocialEchoContext,
  SocialEchoSummary,
} from './socialEchoTypes';
import {
  buildSocialDecisionEcho,
  buildSocialEchoContext,
  buildSocialEchoSummary,
} from './socialEchoSelectors';

export type SocialDecisionEchoCardViewModel = {
  title: string;
  mention: string;
  tags: string[];
  iconKey: string;
  tone: SocialDecisionEchoModel['tone'];
  maxLines: number;
  compact: boolean;
  visibility: SocialDecisionEchoModel['visibility'];
};

export function buildSocialDecisionEchoCardModel(
  context: SocialEchoContext,
): SocialDecisionEchoCardViewModel | null {
  const echo = buildSocialDecisionEcho(context);
  if (!echo) return null;
  const compact = echo.visibility === 'compact' || echo.visibility === 'hidden';
  return {
    title: echo.title,
    mention: echo.mention,
    tags: echo.tags.slice(0, 2),
    iconKey: echo.iconKey,
    tone: echo.tone,
    maxLines: echo.maxLines,
    compact,
    visibility: echo.visibility,
  };
}

export function buildSocialPulseEchoLine(context: SocialEchoContext): string | undefined {
  const echo = buildSocialDecisionEcho(context);
  return echo?.mention;
}

export function buildSocialEchoTopicLabel(model: SocialDecisionEchoModel): string {
  if (model.districtLabel) {
    return `${model.districtLabel} · ${model.tags[0] ?? 'Sosyal'}`;
  }
  return model.tags[0] ?? 'Sosyal Nabız';
}

export function buildSocialEchoTagList(model: SocialDecisionEchoModel): string[] {
  return model.tags.slice(0, 2);
}

export function buildSocialEchoDebugSummary(summary: SocialEchoSummary): string {
  const primary = summary.primaryEcho;
  return [
    `echo=${primary?.mention?.slice(0, 48) ?? '-'}`,
    `source=${primary?.source ?? '-'}`,
    `domain=${primary?.domain ?? '-'}`,
    `visibility=${primary?.visibility ?? '-'}`,
    `warnings=${summary.warnings.join(',') || '-'}`,
  ].join(' | ');
}

export function formatSocialEchoForDocs(): string {
  return [
    '# Dynamic Social Echo',
    '',
    'Deterministik sosyal karar yankısı presentation katmanı.',
    '',
    '## Kaynak önceliği',
    '1. eventEcho social mention',
    '2. carry-over memory',
    '3. eventDomain socialEchoLine',
    '4. dailyReport / operationSignals',
    '5. domain fallback',
  ].join('\n');
}

export function buildSocialEchoContextFromPulseArgs(args: {
  day: number;
  lastDecisionResult?: SocialEchoContext['eventResult'];
  currentEvent?: SocialEchoContext['currentEvent'];
  eventDomainFocus?: SocialEchoContext['eventDomainFocus'];
  carryOverMemory?: SocialEchoContext['carryOverMemory'];
  dailyReport?: SocialEchoContext['dailyReport'];
  operationSignals?: SocialEchoContext['operationSignals'];
  socialPulseState?: SocialEchoContext['socialPulseState'];
}): SocialEchoContext {
  const resultEchoText = args.lastDecisionResult?.subsystemOutcomes?.find(
    (o) => o.key === 'social',
  )?.primaryText;

  return buildSocialEchoContext({
    day: args.day,
    eventResult: args.lastDecisionResult,
    currentEvent:
      args.currentEvent ??
      (args.lastDecisionResult
        ? {
            id: args.lastDecisionResult.eventId,
            title: args.lastDecisionResult.eventTitle,
            neighborhoodId: args.lastDecisionResult.neighborhoodId,
          }
        : undefined),
    eventDomainFocus: args.eventDomainFocus,
    carryOverMemory: args.carryOverMemory,
    dailyReport: args.dailyReport,
    operationSignals: args.operationSignals,
    socialPulseState: args.socialPulseState,
    resultEchoText,
  });
}

export { buildSocialEchoSummary, buildSocialDecisionEcho, buildSocialEchoContext };
