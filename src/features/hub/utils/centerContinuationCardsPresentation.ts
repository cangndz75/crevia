import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import type { CityJournalHubPresentation } from '@/core/cityJournal';
import {
  buildDecisionConsequenceHubLine,
  buildDecisionConsequenceThreadsFromHub,
} from '@/core/decisionConsequence';
import {
  buildHubCityMemoryHint,
  type CityMemoryVisibilityResult,
} from '@/core/cityMemoryVisibility';
import {
  buildPrimaryFollowUpActionCard,
  type FollowUpActionResult,
} from '@/core/followUpActions';
import {
  buildPrimaryFollowUpExecutionCard,
  type FollowUpExecutionResult,
} from '@/core/followUpExecution';
import {
  buildPrimaryDominantStrategyCard,
  type DominantStrategyDetectorResult,
} from '@/core/dominantStrategyDetector';
import {
  buildPrimaryCityRhythmCard,
  type CityRhythmDirectorResult,
} from '@/core/cityRhythmDirector';
import {
  buildPrimaryDay8StrategicContentCard,
  type Day8StrategicContentResult,
} from '@/core/day8StrategicContent';
import { buildPrimaryDistrictNeglectRecoveryCard } from '@/core/districtNeglectRecovery';
import {
  buildEceContinuationLine,
  type EceStrategyLineResult,
} from '@/core/eceStrategyLines';
import {
  buildOneMoreDayContinuationLine,
  type OneMoreDayRetentionResult,
} from '@/core/oneMoreDayRetention';
import type { GameState } from '@/core/models/GameState';

import { buildHubBadgeShowcaseSummary } from './hubBadgeShowcaseModel';
import type { CenterActiveTarget } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterDailyReward } from './centerDailyRewardPresentation';
import type { CenterHeaderSummary } from './centerHeaderPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';
import type { CenterOperationSignalItem } from './centerOperationSignalsPresentation';
import type { CenterQuickActions } from './centerQuickActionsPresentation';
import type { CenterRecommendedPlan } from './centerRecommendedPlanPresentation';

export const CENTER_CONTINUATION_CARDS_MAX = 3;
export const CENTER_CONTINUATION_CARDS_DAY1_MAX = 2;

export type CenterContinuationCardKind =
  | 'last_event'
  | 'next_unlock'
  | 'report_preview'
  | 'story_chain'
  | 'city_journal'
  | 'carry_over'
  | 'maintenance'
  | 'team'
  | 'authority'
  | 'badge'
  | 'empty';

export type CenterContinuationCardTone =
  | 'calm'
  | 'positive'
  | 'warning'
  | 'teaching'
  | 'neutral';

export type CenterContinuationCardPriority = 'low' | 'normal' | 'high';

export type CenterContinuationCardActionKey =
  | 'view_report'
  | 'view_journal'
  | 'view_story'
  | 'view_authority'
  | 'view_badges'
  | 'view_operations'
  | 'view_maintenance'
  | 'none';

export type CenterContinuationCardMotionHint = {
  shouldHighlight: boolean;
  attentionLevel: 'none' | 'soft';
};

export type CenterContinuationCard = {
  id: string;
  kind: CenterContinuationCardKind;
  title: string;
  body: string;
  label?: string;
  tone: CenterContinuationCardTone;
  priority: CenterContinuationCardPriority;
  iconKey: string;
  route?: string;
  actionKey: CenterContinuationCardActionKey;
  enabled: boolean;
  sourceLabel: string;
  sourceIds: string[];
  isLocked?: boolean;
  lockedReason?: string;
  motionHint?: CenterContinuationCardMotionHint;
};

export type CenterContinuationCardsDisplayMode = 'compact' | 'list' | 'empty' | 'locked';

export type CenterContinuationCards = {
  visibility: CenterHomeVisibilityState;
  title?: string;
  cards: CenterContinuationCard[];
  displayMode: CenterContinuationCardsDisplayMode;
  helperText?: string;
  accessibilityLabel: string;
};

export type BuildCenterContinuationCardsInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  advisorSuggestion?: CenterAdvisorSuggestion | null;
  operationSignalItems?: CenterOperationSignalItem[];
  quickActions?: CenterQuickActions | null;
  recommendedPlan?: CenterRecommendedPlan | null;
  citySummary?: CenterCitySummary | null;
  dailyReward?: CenterDailyReward | null;
  headerSummary?: CenterHeaderSummary | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubImpactExplanationLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  oneMoreDayRetention?: OneMoreDayRetentionResult | null;
  eceStrategyLines?: EceStrategyLineResult | null;
  cityMemoryVisibility?: CityMemoryVisibilityResult | null;
  followUpActions?: FollowUpActionResult | null;
  followUpExecution?: FollowUpExecutionResult | null;
  dominantStrategyDetector?: DominantStrategyDetectorResult | null;
  districtNeglectRecovery?: import('@/core/districtNeglectRecovery').DistrictNeglectRecoveryResult | null;
  day8StrategicContent?: Day8StrategicContentResult | null;
  cityRhythmDirector?: CityRhythmDirectorResult | null;
};

const ALLOWED_KINDS: CenterContinuationCardKind[] = [
  'last_event',
  'next_unlock',
  'report_preview',
  'story_chain',
  'city_journal',
  'carry_over',
  'maintenance',
  'team',
  'authority',
  'badge',
  'empty',
];

const ALLOWED_TONES: CenterContinuationCardTone[] = [
  'calm',
  'positive',
  'warning',
  'teaching',
  'neutral',
];

const ALLOWED_PRIORITIES: CenterContinuationCardPriority[] = ['low', 'normal', 'high'];

const ALLOWED_ACTION_KEYS: CenterContinuationCardActionKey[] = [
  'view_report',
  'view_journal',
  'view_story',
  'view_authority',
  'view_badges',
  'view_operations',
  'view_maintenance',
  'none',
];

const SAFE_ACTION_KEYS_WITH_ROUTE: CenterContinuationCardActionKey[] = [
  'view_report',
  'view_journal',
  'view_story',
  'view_authority',
  'view_badges',
  'view_operations',
  'view_maintenance',
];

const ALLOWED_ATTENTION_LEVELS: Array<CenterContinuationCardMotionHint['attentionLevel']> = [
  'none',
  'soft',
];

type Candidate = CenterContinuationCard & { sortRank: number };

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function uniqueSourceIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function collectDedupeLines(input: BuildCenterContinuationCardsInput): string[] {
  const lines: string[] = [];
  const push = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) lines.push(trimmed);
  };

  push(input.activeTarget.title);
  push(input.activeTarget.description);
  push(input.activeTarget.helperText);

  push(input.advisorSuggestion?.recommendation);
  push(input.advisorSuggestion?.contextLine);
  push(input.advisorSuggestion?.reason);

  push(input.recommendedPlan?.title);
  push(input.recommendedPlan?.body);
  push(input.recommendedPlan?.insight?.text);
  push(input.recommendedPlan?.subtitle);

  for (const signal of input.operationSignalItems ?? []) {
    push(signal.title);
    push(signal.description);
  }

  for (const item of input.quickActions?.items ?? []) {
    push(item.label);
    push(item.description);
  }

  push(input.dailyReward?.helperText);
  push(input.headerSummary?.notification.label);
  push(input.citySummary?.primaryInsight?.text);

  return lines;
}

function isBlockedByRecommendedPlan(
  recommendedPlan: CenterRecommendedPlan | null | undefined,
  kind: CenterContinuationCardKind,
  body: string,
): boolean {
  if (!recommendedPlan) return false;
  if (linesAreDuplicate(body, recommendedPlan.body)) return true;
  if (linesAreDuplicate(body, recommendedPlan.title)) return true;

  const planType = recommendedPlan.planType;
  if (kind === 'city_journal' && planType === 'city_journal') return true;
  if (kind === 'story_chain' && planType === 'story_chain') return true;
  if (kind === 'carry_over' && planType === 'carry_over') return true;
  if (kind === 'report_preview' && planType === 'district_report') return true;
  return false;
}

function dedupeBody(lines: string[], body: string, fallback: string): string {
  const trimmed = body.trim();
  if (!trimmed || lines.some((line) => linesAreDuplicate(line, trimmed))) {
    return fallback;
  }
  return trimmed;
}

function buildCardBase(
  partial: Omit<Candidate, 'sortRank'> & { sortRank: number },
): Candidate {
  const enabled = partial.enabled && Boolean(partial.route?.trim());
  return {
    ...partial,
    enabled,
    actionKey: enabled ? partial.actionKey : 'none',
    route: enabled ? partial.route : undefined,
    sourceIds: uniqueSourceIds(partial.sourceIds),
    motionHint: partial.motionHint ?? {
      shouldHighlight: partial.priority === 'high',
      attentionLevel: partial.priority === 'high' ? 'soft' : 'none',
    },
  };
}

function operationSignalsCoverTopic(
  signals: CenterOperationSignalItem[],
  topic: 'maintenance' | 'team',
  line: string,
): boolean {
  const pattern =
    topic === 'maintenance'
      ? /bakım|araç|yorgunluk|vehicle|maintenance/i
      : /ekip|personel|team|yorgun/i;
  if (signals.some((signal) => pattern.test(`${signal.title} ${signal.description}`))) {
    return linesAreDuplicate(
      line,
      signals.find((signal) => pattern.test(`${signal.title} ${signal.description}`))?.description,
    );
  }
  return false;
}

function buildContinuationConsequenceLine(
  input: BuildCenterContinuationCardsInput,
  avoidLines: Array<string | null | undefined>,
): string | null {
  return buildDecisionConsequenceHubLine(
    buildDecisionConsequenceThreadsFromHub({
      day: input.day,
      impactLine: input.hubImpactExplanationLine,
      districtLine: input.hubDistrictReportLine,
      storyLine: input.hubStoryChainLine,
      cityJournalLine: input.hubCityJournal?.primaryLine ?? input.hubCityJournal?.secondaryLine,
    }),
    avoidLines,
  );
}

function collectCandidates(input: BuildCenterContinuationCardsInput): Candidate[] {
  const dedupeLines = collectDedupeLines(input);
  const candidates: Candidate[] = [];
  const signals = input.operationSignalItems ?? [];

  if (input.day > 1 && input.activeTarget.status === 'completed') {
    const body = dedupeBody(
      dedupeLines,
      'Bugünkü kararın etkisi raporda izleniyor.',
      'Son operasyon sonucu raporda özetlendi.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'last_event', body)) {
      candidates.push(
        buildCardBase({
          id: 'last-event-result',
          kind: 'last_event',
          title: 'Son Olay',
          body,
          label: 'Rapor hazır',
          tone: 'positive',
          priority: 'normal',
          iconKey: 'checkmark-circle-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Son operasyon',
          sourceIds: ['last-event', input.activeTarget.id],
          sortRank: 10,
        }),
      );
    }
  }

  const districtLine = input.hubDistrictReportLine?.trim();
  if (districtLine && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      districtLine,
      'Günün etkisi sonuç ekranında özetlenecek.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)) {
      candidates.push(
        buildCardBase({
          id: 'district-report-preview',
          kind: 'report_preview',
          title: 'Kısa Rapor',
          body,
          label: 'Önizleme',
          tone: 'neutral',
          priority: 'normal',
          iconKey: 'document-text-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Mahalle raporu',
          sourceIds: ['district-report'],
          sortRank: 11,
        }),
      );
    }
  }

  const authority = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: input.gameState.pilot.authorityState,
    day: input.day,
  });
  if (authority.visible && authority.nextPermissionLine?.trim() && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      authority.nextPermissionLine,
      'Bir sonraki yetki, yeni görünürlük alanı açabilir.',
    );
    candidates.push(
      buildCardBase({
        id: 'authority-next-unlock',
        kind: 'authority',
        title: 'Yaklaşan Açılım',
        body,
        label: 'Yetki',
        tone: 'calm',
        priority: 'normal',
        iconKey: 'shield-checkmark-outline',
        route: '/profile',
        actionKey: 'view_authority',
        enabled: true,
        sourceLabel: 'Yetki önizlemesi',
        sourceIds: ['authority-preview', authority.nextPermissionTitle ?? 'next-permission'],
        sortRank: 20,
      }),
    );
  }

  const storyLine = input.hubStoryChainLine?.trim();
  if (storyLine && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      storyLine,
      'Bu karar yeni bir mahalle hafızasına bağlanabilir.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'story_chain', body)) {
      candidates.push(
        buildCardBase({
          id: 'story-chain',
          kind: 'story_chain',
          title: 'Şehir Hikâyesi',
          body,
          label: 'Devam',
          tone: 'neutral',
          priority: 'normal',
          iconKey: 'book-outline',
          actionKey: 'view_story',
          enabled: false,
          sourceLabel: 'Hikâye zinciri',
          sourceIds: ['story-chain'],
          sortRank: 30,
        }),
      );
    }
  }

  const journalSecondary = input.hubCityJournal?.secondaryLine?.trim();
  const journalPrimary = input.hubCityJournal?.primaryLine?.trim();
  const journalTeaser = journalSecondary || (journalPrimary && input.day > 1 ? journalPrimary : null);
  if (journalTeaser && input.day > 1 && input.hubCityJournal?.visible) {
    const body = dedupeBody(
      dedupeLines,
      journalTeaser,
      'Şehir günlüğü bugünkü kararların etkisini kaydediyor.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'city_journal', body)) {
      candidates.push(
        buildCardBase({
          id: 'city-journal-teaser',
          kind: 'city_journal',
          title: 'Şehir Günlüğü',
          body,
          label: 'Kayıt',
          tone: 'calm',
          priority: 'low',
          iconKey: 'journal-outline',
          route: '/reports',
          actionKey: 'view_journal',
          enabled: true,
          sourceLabel: 'Şehir günlüğü',
          sourceIds: ['city-journal-teaser'],
          sortRank: 31,
        }),
      );
    }
  }

  const carryLine = input.hubImpactExplanationLine?.trim();
  if (carryLine && input.day > 1) {
    const consequenceLine = buildContinuationConsequenceLine(input, dedupeLines);
    const body = dedupeBody(
      dedupeLines,
      consequenceLine || carryLine,
      'Önceki karar bugünkü operasyon akışını etkiliyor.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'carry_over', body)) {
      candidates.push(
        buildCardBase({
          id: 'carry-over',
          kind: 'carry_over',
          title: 'Dünden Kalan',
          body,
          label: 'Etki',
          tone: 'warning',
          priority: 'normal',
          iconKey: 'time-outline',
          actionKey: 'none',
          enabled: false,
          sourceLabel: 'Karar hafızası',
          sourceIds: ['carry-over'],
          sortRank: 40,
        }),
      );
    }
  }

  const retentionLine = buildOneMoreDayContinuationLine(input.oneMoreDayRetention, dedupeLines);
  if (retentionLine && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      retentionLine,
      'Yarin icin kisa devam odagi hazir.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)) {
      candidates.push(
        buildCardBase({
          id: 'one-more-day-retention',
          kind: 'report_preview',
          title: 'Devam Odagi',
          body,
          label: 'Yarin',
          tone: input.oneMoreDayRetention?.primaryHook?.tone === 'warning' ? 'warning' : 'calm',
          priority: input.day >= 8 ? 'high' : 'normal',
          iconKey: 'arrow-forward-circle-outline',
          route: input.oneMoreDayRetention?.ctaRoute,
          actionKey: 'view_operations',
          enabled: true,
          sourceLabel: 'Bir sonraki gun',
          sourceIds: [
            'one-more-day-retention',
            ...(input.oneMoreDayRetention?.sourceIds ?? []),
          ],
          sortRank: input.day >= 8 ? 12 : 32,
        }),
      );
    }
  }

  const eceContinuationLine = buildEceContinuationLine(input.eceStrategyLines, [
    ...dedupeLines,
    retentionLine,
  ]);
  if (eceContinuationLine && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      eceContinuationLine,
      'Ece sonraki adim icin kisa bir takip notu hazirladi.',
    );
    if (!isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)) {
      candidates.push(
        buildCardBase({
          id: 'ece-strategy-continuation',
          kind: 'report_preview',
          title: 'Ece Notu',
          body,
          label: 'Ece',
          tone: 'calm',
          priority: input.eceStrategyLines?.primaryLine?.confidence === 'high' ? 'high' : 'normal',
          iconKey: 'chatbubble-ellipses-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Ece strateji notu',
          sourceIds: ['ece-strategy-line', ...(input.eceStrategyLines?.sourceIds ?? [])],
          sortRank: input.day >= 8 ? 13 : 33,
        }),
      );
    }
  }

  const districtNeglectCard = buildPrimaryDistrictNeglectRecoveryCard(input.districtNeglectRecovery, [
    ...dedupeLines,
    retentionLine,
    eceContinuationLine,
  ].filter((line): line is string => Boolean(line)));
  if (districtNeglectCard && input.day >= 8) {
    const body = dedupeBody(
      dedupeLines,
      districtNeglectCard.line,
      'Mahalle sinyali bugun izlenmeye deger.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'district-neglect-recovery',
          kind: 'report_preview',
          title: districtNeglectCard.title,
          body,
          label: districtNeglectCard.badgeLabel,
          tone:
            districtNeglectCard.tone === 'positive'
              ? 'positive'
              : districtNeglectCard.tone === 'cautious'
                ? 'warning'
                : 'calm',
          priority: districtNeglectCard.tone === 'strategic' ? 'high' : 'normal',
          iconKey: 'map-outline',
          route: '/map',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Mahalle durumu',
          sourceIds: ['district-neglect-recovery', districtNeglectCard.id],
          sortRank: 13.5,
        }),
      );
    }
  }

  const strategicContentCard = buildPrimaryDay8StrategicContentCard(input.day8StrategicContent, [
    ...dedupeLines,
    retentionLine,
    eceContinuationLine,
    districtNeglectCard?.line,
  ].filter((line): line is string => Boolean(line)));
  if (strategicContentCard && input.day >= 8) {
    const body = dedupeBody(
      dedupeLines,
      strategicContentCard.line,
      'Bugunun stratejik odağı netleşiyor.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'day8-strategic-content',
          kind: 'report_preview',
          title: strategicContentCard.title,
          body,
          label: strategicContentCard.badgeLabel,
          tone:
            strategicContentCard.tone === 'positive'
              ? 'positive'
              : strategicContentCard.tone === 'cautious'
                ? 'warning'
                : 'calm',
          priority: strategicContentCard.tone === 'strategic' ? 'high' : 'normal',
          iconKey: 'compass-outline',
          route: '/',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Stratejik odak',
          sourceIds: ['day8-strategic-content', strategicContentCard.id],
          sortRank: 12.5,
        }),
      );
    }
  }

  const rhythmCard = buildPrimaryCityRhythmCard(input.cityRhythmDirector, [
    ...dedupeLines,
    retentionLine,
    eceContinuationLine,
    strategicContentCard?.line,
    districtNeglectCard?.line,
  ].filter((line): line is string => Boolean(line)));
  if (rhythmCard && input.day >= 8) {
    const body = dedupeBody(
      dedupeLines,
      rhythmCard.line,
      'Bugunun sehir ritmi sakin ama dikkat istiyor.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'city-rhythm-director',
          kind: 'report_preview',
          title: rhythmCard.title,
          body,
          label: rhythmCard.badgeLabel,
          tone:
            rhythmCard.tone === 'positive'
              ? 'positive'
              : rhythmCard.tone === 'cautious'
                ? 'warning'
                : 'calm',
          priority: rhythmCard.tone === 'strategic' || rhythmCard.tone === 'balanced' ? 'high' : 'normal',
          iconKey: 'pulse-outline',
          route: '/',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Gün ritmi',
          sourceIds: ['city-rhythm-director', rhythmCard.id],
          sortRank: 12,
        }),
      );
    }
  }

  const cityMemoryHint = buildHubCityMemoryHint(input.cityMemoryVisibility, [
    ...dedupeLines,
    retentionLine,
    eceContinuationLine,
  ].filter((line): line is string => Boolean(line)));
  if (cityMemoryHint && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      cityMemoryHint.line,
      'Sehir hafizasindaki iz bugun takip edilmeye deger.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'city_journal', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'city-memory-continuation',
          kind: 'city_journal',
          title: cityMemoryHint.title,
          body,
          label: cityMemoryHint.badgeLabel,
          tone: cityMemoryHint.tone === 'cautious' ? 'warning' : 'calm',
          priority: input.day >= 8 ? 'high' : 'normal',
          iconKey: 'book-outline',
          route: '/reports',
          actionKey: 'view_journal',
          enabled: true,
          sourceLabel: 'Sehir hafizasi',
          sourceIds: ['city-memory-visibility', ...(input.cityMemoryVisibility?.sourceIds ?? [])],
          sortRank: input.day >= 8 ? 14 : 34,
        }),
      );
    }
  }

  const followUpCard = buildPrimaryFollowUpActionCard(input.followUpActions);
  const executionCard = buildPrimaryFollowUpExecutionCard(input.followUpExecution);
  if (executionCard && input.day >= 8 && executionCard.status !== 'blocked') {
    const body = dedupeBody(
      dedupeLines,
      executionCard.resultLine ?? executionCard.line,
      'Dunku takip icin kisa bir uygulama notu hazir.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'follow-up-execution-continuation',
          kind: 'report_preview',
          title: executionCard.status === 'executed' ? 'Takip Tamamlandi' : 'Takip Uygulama',
          body,
          label: executionCard.status === 'executed' ? 'Tamam' : executionCard.badgeLabel,
          tone:
            executionCard.tone === 'positive'
              ? 'positive'
              : executionCard.tone === 'cautious'
                ? 'warning'
                : 'calm',
          priority: executionCard.status === 'executed' ? 'high' : 'normal',
          iconKey: executionCard.status === 'executed' ? 'checkmark-done-outline' : 'play-circle-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Takip uygulama',
          sourceIds: ['follow-up-execution', ...(input.followUpExecution?.sourceIds ?? [])],
          sortRank: executionCard.status === 'executed' ? 12.2 : 14.8,
        }),
      );
    }
  }

  const dominantStrategyCard = buildPrimaryDominantStrategyCard(input.dominantStrategyDetector);
  if (dominantStrategyCard && input.day >= 8) {
    const body = dedupeBody(
      dedupeLines,
      dominantStrategyCard.counterSignalLine ?? dominantStrategyCard.line,
      'Ece karar tarzina dair kisa bir denge notu hazirladi.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'dominant-strategy-continuation',
          kind: 'report_preview',
          title: 'Strateji Notu',
          body,
          label: dominantStrategyCard.badgeLabel,
          tone:
            dominantStrategyCard.tone === 'encouraging'
              ? 'positive'
              : dominantStrategyCard.tone === 'cautious'
                ? 'warning'
                : 'calm',
          priority: dominantStrategyCard.visibilityLevel === 'detailed' ? 'high' : 'normal',
          iconKey: 'analytics-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Strateji farkindaligi',
          sourceIds: ['dominant-strategy-detector', ...(input.dominantStrategyDetector?.sourceIds ?? [])],
          sortRank: 14.9,
        }),
      );
    }
  }

  if (followUpCard && input.day > 1) {
    const followUpHubLine =
      followUpCard.benefitLine?.trim() &&
      !linesAreDuplicate(followUpCard.benefitLine, followUpCard.line)
        ? followUpCard.benefitLine
        : followUpCard.title;
    const body = dedupeBody(
      dedupeLines,
      followUpHubLine,
      'Küçük bir takip adımı öneriliyor.',
    );
    if (
      body &&
      !isBlockedByRecommendedPlan(input.recommendedPlan, 'report_preview', body)
    ) {
      candidates.push(
        buildCardBase({
          id: 'follow-up-action-continuation',
          kind: 'report_preview',
          title: 'Takip Önerisi',
          body,
          label: followUpCard.badgeLabel ?? 'Takip',
          tone: followUpCard.tone === 'cautious' ? 'warning' : 'calm',
          priority: input.day >= 8 ? 'high' : 'normal',
          iconKey: 'eye-outline',
          route: '/reports',
          actionKey: 'view_report',
          enabled: true,
          sourceLabel: 'Takip önerisi',
          sourceIds: ['follow-up-actions', ...(input.followUpActions?.sourceIds ?? [])],
          sortRank: input.day >= 8 ? 15 : 35,
        }),
      );
    }
  }

  const maintenanceLine = input.hubVehicleMaintenanceLine?.trim();
  if (
    maintenanceLine &&
    input.day > 1 &&
    !operationSignalsCoverTopic(signals, 'maintenance', maintenanceLine)
  ) {
    const body = dedupeBody(
      dedupeLines,
      maintenanceLine,
      'Araç yorgunluğu sonraki yönlendirmeyi etkileyebilir.',
    );
    candidates.push(
      buildCardBase({
        id: 'vehicle-maintenance',
        kind: 'maintenance',
        title: 'Bakım Notu',
        body,
        label: 'İzleniyor',
        tone: 'warning',
        priority: 'low',
        iconKey: 'construct-outline',
        route: '/events',
        actionKey: 'view_maintenance',
        enabled: true,
        sourceLabel: 'Araç bakımı',
        sourceIds: ['vehicle-maintenance'],
        sortRank: 50,
      }),
    );
  }

  const teamLine = input.hubTeamSpecializationLine?.trim();
  if (teamLine && input.day > 1 && !operationSignalsCoverTopic(signals, 'team', teamLine)) {
    const body = dedupeBody(
      dedupeLines,
      teamLine,
      'Yorgun ekiplerle arka arkaya görev risk oluşturabilir.',
    );
    candidates.push(
      buildCardBase({
        id: 'team-specialization',
        kind: 'team',
        title: 'Ekip Durumu',
        body,
        label: 'Dikkat',
        tone: 'warning',
        priority: 'low',
        iconKey: 'people-outline',
        route: '/events',
        actionKey: 'view_operations',
        enabled: true,
        sourceLabel: 'Ekip yorgunluğu',
        sourceIds: ['team-specialization'],
        sortRank: 51,
      }),
    );
  }

  const badge = buildHubBadgeShowcaseSummary(input.gameState.pilot.badgeState, input.day);
  if (badge.visible && badge.nearUnlockTitle?.trim() && input.day > 1) {
    const body = dedupeBody(
      dedupeLines,
      `${badge.headline} ${badge.nearUnlockTitle}`,
      `Rozet ilerlemesi: ${badge.nearUnlockTitle}`,
    );
    candidates.push(
      buildCardBase({
        id: 'badge-progress',
        kind: 'badge',
        title: 'Rozet İlerlemesi',
        body,
        label: badge.countLabel,
        tone: 'positive',
        priority: 'low',
        iconKey: 'ribbon-outline',
        route: '/profile',
        actionKey: 'view_badges',
        enabled: true,
        sourceLabel: 'Rozet vitrini',
        sourceIds: ['badge-showcase', badge.nearUnlockTitle],
        sortRank: 60,
      }),
    );
  }

  return candidates;
}

function pickUniqueCards(candidates: Candidate[], maxCards: number): CenterContinuationCard[] {
  const picked: CenterContinuationCard[] = [];
  const usedIds = new Set<string>();
  const usedBodies = new Set<string>();

  const sorted = [...candidates].sort((a, b) => a.sortRank - b.sortRank || a.id.localeCompare(b.id));

  for (const candidate of sorted) {
    if (picked.length >= maxCards) break;
    if (usedIds.has(candidate.id)) continue;
    const bodyKey = normalizeLine(candidate.body);
    if (usedBodies.has(bodyKey)) continue;

    const { sortRank: _sortRank, ...card } = candidate;
    picked.push(card);
    usedIds.add(candidate.id);
    usedBodies.add(bodyKey);
    for (const sourceId of candidate.sourceIds) {
      usedIds.add(sourceId);
    }
  }

  return picked;
}

function buildDay1Cards(): CenterContinuationCard[] {
  return [
    {
      id: 'day1-report-preview',
      kind: 'report_preview',
      title: 'Rapor Önizlemesi',
      body: 'İlk sonuçtan sonra açılır.',
      label: 'Kilitli',
      tone: 'teaching',
      priority: 'low',
      iconKey: 'document-text-outline',
      actionKey: 'none',
      enabled: false,
      isLocked: true,
      lockedReason: 'İlk operasyonu tamamla',
      sourceLabel: 'Day 1 teaser',
      sourceIds: ['day1-report-preview'],
      motionHint: { shouldHighlight: false, attentionLevel: 'none' },
    },
    {
      id: 'day1-next-unlock',
      kind: 'next_unlock',
      title: 'Yaklaşan Açılım',
      body: 'İlk operasyonla merkez akışı genişler.',
      label: 'Başlangıç',
      tone: 'teaching',
      priority: 'low',
      iconKey: 'sparkles-outline',
      actionKey: 'none',
      enabled: false,
      isLocked: true,
      lockedReason: 'İlk operasyon sonrası',
      sourceLabel: 'Day 1 teaser',
      sourceIds: ['day1-next-unlock'],
      motionHint: { shouldHighlight: false, attentionLevel: 'none' },
    },
  ];
}

function buildAccessibilityLabel(section: Pick<CenterContinuationCards, 'title' | 'cards' | 'helperText'>): string {
  return [
    section.title ?? 'Devam',
    section.helperText,
    ...section.cards.map((card) => `${card.title}. ${card.body}. ${card.label ?? ''}`),
  ]
    .filter(Boolean)
    .join('. ');
}

export function buildCenterContinuationCards(
  input: BuildCenterContinuationCardsInput,
): CenterContinuationCards {
  if (input.day <= 1) {
    const cards = buildDay1Cards().slice(0, CENTER_CONTINUATION_CARDS_DAY1_MAX);
    const section: CenterContinuationCards = {
      visibility: 'visible',
      title: 'Devam',
      cards,
      displayMode: 'locked',
      helperText: 'İlk operasyon sonrası devam sinyalleri açılır.',
      accessibilityLabel: '',
    };
    section.accessibilityLabel = buildAccessibilityLabel(section);
    return section;
  }

  const candidates = collectCandidates(input);
  const cards = pickUniqueCards(candidates, CENTER_CONTINUATION_CARDS_MAX);

  if (cards.length === 0) {
    return {
      visibility: 'hidden',
      title: 'Devam',
      cards: [],
      displayMode: 'empty',
      accessibilityLabel: 'Devam alanı gizli. Ek devam sinyali yok.',
    };
  }

  const displayMode: CenterContinuationCardsDisplayMode =
    cards.length >= 3 ? 'list' : 'compact';

  const section: CenterContinuationCards = {
    visibility: 'visible',
    title: 'Devam',
    cards,
    displayMode,
    helperText: cards.length === 1 ? 'Kısa devam sinyali' : undefined,
    accessibilityLabel: '',
  };
  section.accessibilityLabel = buildAccessibilityLabel(section);
  return section;
}

export function centerContinuationCardsCoreFieldsValid(section: CenterContinuationCards): boolean {
  if (section.visibility === 'hidden') return true;
  return Boolean(section.accessibilityLabel.trim());
}

export function centerContinuationCardsMaxItems(section: CenterContinuationCards): boolean {
  return section.cards.length <= CENTER_CONTINUATION_CARDS_MAX;
}

export function centerContinuationCardsUniqueIds(section: CenterContinuationCards): boolean {
  const ids = section.cards.map((card) => card.id);
  return new Set(ids).size === ids.length;
}

export function centerContinuationCardsUniqueSourceIds(section: CenterContinuationCards): boolean {
  const ids = section.cards.flatMap((card) => card.sourceIds);
  const perCardUnique = section.cards.every(
    (card) => new Set(card.sourceIds).size === card.sourceIds.length,
  );
  return perCardUnique && new Set(ids).size === ids.length;
}

export function centerContinuationCardsEnumsValid(section: CenterContinuationCards): boolean {
  return section.cards.every(
    (card) =>
      ALLOWED_KINDS.includes(card.kind) &&
      ALLOWED_TONES.includes(card.tone) &&
      ALLOWED_PRIORITIES.includes(card.priority) &&
      ALLOWED_ACTION_KEYS.includes(card.actionKey) &&
      (!card.motionHint || ALLOWED_ATTENTION_LEVELS.includes(card.motionHint.attentionLevel)),
  );
}

export function centerContinuationCardsRouteSafety(section: CenterContinuationCards): boolean {
  return section.cards.every((card) => {
    if (!card.enabled) return !card.route || card.actionKey === 'none';
    return Boolean(card.route?.trim()) && SAFE_ACTION_KEYS_WITH_ROUTE.includes(card.actionKey);
  });
}

export function centerContinuationCardsDay1Safe(section: CenterContinuationCards): boolean {
  if (section.displayMode !== 'locked') return true;
  return section.cards.length <= CENTER_CONTINUATION_CARDS_DAY1_MAX;
}

export function centerContinuationCardsEmptySafe(section: CenterContinuationCards): boolean {
  if (section.displayMode !== 'empty') return true;
  return section.cards.length === 0;
}

export function centerContinuationCardsNotDuplicateRecommendedPlan(
  section: CenterContinuationCards,
  recommendedPlan: CenterRecommendedPlan,
): boolean {
  return section.cards.every(
    (card) =>
      !linesAreDuplicate(card.body, recommendedPlan.body) &&
      !linesAreDuplicate(card.title, recommendedPlan.title),
  );
}

export function centerContinuationCardsNotDuplicateActiveTarget(
  section: CenterContinuationCards,
  activeTarget: CenterActiveTarget,
): boolean {
  return section.cards.every(
    (card) =>
      !linesAreDuplicate(card.body, activeTarget.title) &&
      !linesAreDuplicate(card.body, activeTarget.description),
  );
}

export function centerContinuationCardsNotDuplicateAdvisor(
  section: CenterContinuationCards,
  advisorRecommendation: string,
): boolean {
  return section.cards.every((card) => !linesAreDuplicate(card.body, advisorRecommendation));
}

export function centerContinuationCardsNotDuplicateSignals(
  section: CenterContinuationCards,
  signalTitles: string[],
): boolean {
  return section.cards.every(
    (card) => signalTitles.every((title) => !linesAreDuplicate(card.body, title)),
  );
}

export function centerContinuationCardsNotDuplicateQuickActions(
  section: CenterContinuationCards,
  quickActionLabels: string[],
): boolean {
  return section.cards.every((card) => {
    if (!card.label) return true;
    const normalizedLabel = normalizeLine(card.label);
    return quickActionLabels.every((label) => normalizeLine(label) !== normalizedLabel);
  });
}
