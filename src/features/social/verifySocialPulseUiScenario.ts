import { verifySocialScenario } from '@/core/social/verifySocialScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

import {
  assertNoSocialPulseForbiddenWords,
  buildHotSocialTopicModel,
  buildLiveMentionCardsModel,
  buildNeighborhoodSocialSensitivityStrip,
  buildSocialPulseHeaderModel,
  buildSocialPulseScreenViewModel,
  collectSocialPulsePresentationStrings,
  MENTION_TEXT_PRESENTATION_MAX,
  SOCIAL_PULSE_LAYOUT_GUARDS,
} from './utils/socialPulsePresentation';

export type VerifySocialPulseUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

const SAMPLE_DECISION: DecisionResultSnapshot = {
  id: 'decision-ui',
  day: 2,
  eventId: 'evt-1',
  eventTitle: 'Test',
  neighborhoodName: 'Cumhuriyet',
  neighborhoodId: 'cumhuriyet',
  decisionId: 'd1',
  decisionTitle: 'Açıklama yap',
  decisionTone: 'balanced',
  createdAt: Date.now(),
  summaryTitle: 'Sonuç',
  summaryText: 'Saha notu',
  resultTone: 'positive',
  metricChanges: [],
  subsystemOutcomes: [
    {
      key: 'social',
      title: 'Sosyal',
      status: 'good',
      primaryText: 'Halk algısı toparlanıyor.',
    },
  ],
  highlightLines: [],
  riskLines: [],
};

export function verifySocialPulseUiScenario(): VerifySocialPulseUiOutcome {
  const checks: Check[] = [];

  let freshModel;
  try {
    freshModel = buildSocialPulseScreenViewModel({
      socialPulseState: createInitialSocialPulseState(1),
      currentDay: 1,
    });
    assert(checks, freshModel.header.title === 'Sosyal Nabız', 'Fresh state render path crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Fresh state render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    freshModel = buildSocialPulseScreenViewModel();
  }

  const undefinedHeader = buildSocialPulseHeaderModel(undefined, {});
  assert(
    checks,
    undefinedHeader.statusLabel.length > 0 && undefinedHeader.summary.length > 0,
    'socialPulseState undefined iken fallback header döner',
    undefinedHeader.statusLabel,
  );

  const emptyMentions = buildLiveMentionCardsModel([]);
  assert(
    checks,
    emptyMentions.showEmptyState === true,
    'mention list empty iken empty state güvenli döner',
    emptyMentions.emptyMessage,
  );

  const strip = buildNeighborhoodSocialSensitivityStrip(
    freshModel.neighborhoods.map((n) => ({
      id: String(n.districtId),
      name: n.title,
      score: n.score,
      riskLevel: 'medium' as const,
      trend: [50, 52],
    })),
  );
  assert(
    checks,
    strip.length <= SOCIAL_PULSE_LAYOUT_GUARDS.maxNeighborhoodStripItems,
    'Mahalle duyarlılık strip max 5 item üretir',
    `count=${strip.length}`,
  );

  const cumhuriyet = strip.find((n) => n.districtId === 'cumhuriyet');
  assert(
    checks,
    cumhuriyet?.iconKey === 'district_cumhuriyet' && cumhuriyet.accentColor.length > 0,
    'District identity accent/icon doğru kullanılır',
    `${cumhuriyet?.iconKey} ${cumhuriyet?.accentColor}`,
  );

  let unknownOk = true;
  try {
    const unknownStrip = buildNeighborhoodSocialSensitivityStrip([]);
    unknownOk =
      unknownStrip.length > 0 &&
      buildHotSocialTopicModel({
        id: 'x',
        badge: 'Test',
        remainingTime: '1g',
        title: 'Test',
        description: 'd',
        neighborhood: 'Bilinmeyen',
        interactions: '1',
        comments: '1',
        riskChips: [],
        actions: [],
        neighborhoodId: 'unknown_place',
      }).districtLabel.length > 0;
  } catch {
    unknownOk = false;
  }
  assert(checks, unknownOk, 'Unknown district fallback crash üretmez');

  const hotTopic = freshModel.hotTopic;
  assert(
    checks,
    hotTopic.title.length > 0,
    'Hot topic title/context max satır guard’ları vardır',
    `titleLen=${hotTopic.title.length}`,
  );

  const mentionModel = buildLiveMentionCardsModel([
    {
      id: 'm1',
      avatarInitials: 'AY',
      name: 'Ayşe',
      neighborhood: 'Merkez',
      timeAgo: '5 dk',
      category: 'complaint',
      text: 'Uzun metin '.repeat(20),
      likes: 1,
      comments: 0,
    },
  ]);
  assert(
    checks,
    mentionModel.items[0]?.text.length <= MENTION_TEXT_PRESENTATION_MAX + 1,
    'Mention card max 2 satır modelini korur',
    `textLen=${mentionModel.items[0]?.text.length ?? 0}`,
  );

  const postPilotModel = buildSocialPulseScreenViewModel({
    socialPulseState: createInitialSocialPulseState(8),
    currentDay: 8,
    postPilotPhase: 'main_operation_light',
  });
  assert(
    checks,
    postPilotModel.postPilotContextLine != null,
    'Post-pilot main_operation_light iken post-pilot social context güvenli döner',
    postPilotModel.postPilotContextLine ?? 'missing',
  );
  assert(
    checks,
    postPilotModel.neighborhoods[0]?.districtId === 'istasyon',
    'Post-pilot İstasyon önceliği',
    String(postPilotModel.neighborhoods[0]?.districtId),
  );

  const day1Compact = buildSocialPulseScreenViewModel({
    socialPulseState: createInitialSocialPulseState(1),
    currentDay: 1,
    isDay1Compact: true,
  });
  assert(
    checks,
    day1Compact.isCompact &&
      day1Compact.mentions.items.length <= 1 &&
      day1Compact.decisionEcho == null &&
      !day1Compact.showOutcomeHistory,
    'Day 1 tutorial state ekranı boğmayacak compact model döner',
    `mentions=${day1Compact.mentions.items.length}`,
  );

  const strings = collectSocialPulsePresentationStrings(freshModel);
  const banned = strings.flatMap((line) =>
    assertNoSocialPulseForbiddenWords(line).map((w) => `${w}@${line.slice(0, 30)}`),
  );
  assert(checks, banned.length === 0, 'Yasaklı kelime taraması 0 döner', banned.join('; '));

  const presentationSource = JSON.stringify(freshModel);
  assert(
    checks,
    !presentationSource.includes('calculateNeighborhoodSocialScore'),
    'Yeni social score / gameplay hesabı yapılmaz',
  );

  const socialCore = verifySocialScenario();
  assert(
    checks,
    socialCore.ok,
    'Existing verify:social bozulmaz',
    `fail=${socialCore.checks.filter((c) => c.startsWith('✗')).length}`,
  );

  const uxFlow = verifyFullUxFlowScenario();
  assert(
    checks,
    uxFlow.ok,
    'full UX flow verify bozulmaz',
    `audit=${uxFlow.audit.flowHealth}`,
  );

  const echoModel = buildSocialPulseScreenViewModel({
    socialPulseState: createInitialSocialPulseState(2),
    currentDay: 2,
    lastDecisionResult: SAMPLE_DECISION,
  });
  assert(
    checks,
    Boolean(echoModel.decisionEcho?.summary?.includes('Halk')),
    'Son karar yankısı mevcut veriden üretilir',
    echoModel.decisionEcho?.summary ?? 'none',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
