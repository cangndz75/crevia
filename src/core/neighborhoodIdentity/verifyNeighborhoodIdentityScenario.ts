import { buildDailyReport } from '@/core/game/buildDailyReport';
import { getNeighborhoodIdentityEventWeightBonus } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import {
  buildNeighborhoodIdentityReportLine,
  enrichGoalDescriptionWithIdentity,
  getNeighborhoodDisplayName,
  getNeighborhoodEventBias,
  getNeighborhoodIdentity,
  getNeighborhoodIdentityChipLabel,
  getNeighborhoodSocialChipLabel,
  normalizeNeighborhoodId,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import {
  CANONICAL_NEIGHBORHOOD_IDS,
  NEIGHBORHOOD_IDENTITIES,
} from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';
import { getTopNeighborhoodSensitivityChips } from '@/core/neighborhoodIdentity/neighborhoodIdentityPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';

export type VerifyNeighborhoodIdentityResult = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

const MOCK_EVENT = {
  id: 'ev-test',
  title: 'Sosyal medya şikayeti',
  description: 'Test',
  category: 'social',
  eventType: 'social_media',
  district: 'Merkez',
  neighborhoodId: 'merkez',
  priority: 2,
  riskLevel: 'medium',
  contextTag: 'test',
  urgencyHours: 4,
  decisions: [],
  previewEffects: {
    publicSatisfaction: -5,
    risk: 3,
    xp: 0,
  },
} satisfies EventCard;

const MOCK_METRICS: GameMetrics = {
  publicSatisfaction: 55,
  staffMorale: 60,
  budget: 80_000,
};

export function verifyNeighborhoodIdentityScenario(): VerifyNeighborhoodIdentityResult {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      CANONICAL_NEIGHBORHOOD_IDS.length === 5,
      '5 canonical mahalle tanımlı',
      'canonical mahalle sayısı 5 değil',
    ) && ok;

  for (const id of CANONICAL_NEIGHBORHOOD_IDS) {
    const identity = NEIGHBORHOOD_IDENTITIES[id];
    ok =
      assert(
        checks,
        identity != null &&
          identity.representative.name.length > 0 &&
          identity.tagline.length > 0 &&
          identity.strengths.length > 0 &&
          identity.vulnerabilities.length > 0,
        `${id} kimlik alanları dolu`,
        `${id} eksik kimlik alanı`,
      ) && ok;

    for (const value of Object.values(identity.sensitivities)) {
      if (value < 0 || value > 100) {
        ok = assert(checks, false, '', `${id} sensitivity aralık dışı`) && ok;
      }
    }

    for (const value of Object.values(identity.eventBias)) {
      if (value < 0 || value > 1) {
        ok = assert(checks, false, '', `${id} eventBias aralık dışı`) && ok;
      }
    }
  }

  ok =
    assert(
      checks,
      normalizeNeighborhoodId('yesilpark') === 'yesilvadi',
      'yesilpark → yesilvadi',
      'yesilpark bridge hatalı',
    ) && ok;
  ok =
    assert(
      checks,
      normalizeNeighborhoodId('pazar') === 'sanayi',
      'pazar → sanayi',
      'pazar bridge hatalı',
    ) && ok;
  ok =
    assert(
      checks,
      normalizeNeighborhoodId('yeni-konut') === 'cumhuriyet',
      'yeni-konut → cumhuriyet',
      'yeni-konut bridge hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeNeighborhoodId('totally-unknown') === null,
      'bilinmeyen id null',
      'bilinmeyen id crash/null hatası',
    ) && ok;

  ok =
    assert(
      checks,
      getNeighborhoodDisplayName('broken-id') === 'Cumhuriyet',
      'eksik id fallback displayName',
      'eksik id fallback başarısız',
    ) && ok;

  const day1Boost = getNeighborhoodIdentityEventWeightBonus(MOCK_EVENT, {
    currentDay: 1,
    tutorialActive: true,
  });
  ok =
    assert(
      checks,
      day1Boost === 0,
      'gün 1 / tutorial event bias kapalı',
      'gün 1 bias sıfır değil',
    ) && ok;

  const day2Boost = getNeighborhoodIdentityEventWeightBonus(MOCK_EVENT, {
    currentDay: 2,
  });
  ok =
    assert(
      checks,
      day2Boost >= 0 && day2Boost <= 8,
      `gün 2 event weight bonus güvenli (${day2Boost})`,
      'event weight bonus aralık dışı',
    ) && ok;

  ok =
    assert(
      checks,
      getNeighborhoodEventBias('sanayi', 'waste') > getNeighborhoodEventBias('cumhuriyet', 'waste'),
      'Sanayi waste bias > Cumhuriyet',
      'waste bias sıralaması hatalı',
    ) && ok;

  const enriched = enrichGoalDescriptionWithIdentity(
    'sanayi',
    'Kritik konteyner baskısı oluşmadan günü tamamla.',
  );
  ok =
    assert(
      checks,
      enriched.length > 0,
      'goal description identity ile zenginleşir',
      'goal description zenginleştirme başarısız',
    ) && ok;

  const reportLine = buildNeighborhoodIdentityReportLine({
    neighborhoodId: 'merkez',
    status: 'good',
  });
  ok =
    assert(
      checks,
      reportLine != null && reportLine.length > 10,
      'report identity line üretilir',
      'report identity line boş',
    ) && ok;

  const report = buildDailyReport({
    day: 2,
    metrics: MOCK_METRICS,
    decisionHistory: [],
    activeEvents: [MOCK_EVENT],
    resolvedEventIds: [],
    snapshots: [],
  });
  ok =
    assert(
      checks,
      (report.neighborhoodIdentityLine?.length ?? 0) > 0,
      'buildDailyReport neighborhoodIdentityLine snapshot',
      'buildDailyReport identity line eksik',
    ) && ok;

  ok =
    assert(
      checks,
      getNeighborhoodSocialChipLabel('istasyon').length > 0,
      'social chip label güvenli',
      'social chip label boş',
    ) && ok;

  ok =
    assert(
      checks,
      getTopNeighborhoodSensitivityChips(null).length === 2,
      'sensitivity chips fallback',
      'sensitivity chips fallback başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      getNeighborhoodIdentityChipLabel(undefined).includes('·'),
      'hub chip label formatı',
      'hub chip label formatı hatalı',
    ) && ok;

  return { ok, checks };
}
