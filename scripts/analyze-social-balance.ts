/**
 * Sosyal Nabız 7 günlük drift denge simülasyonu.
 * Çalıştır: npm run analyze:social
 */

import { SOCIAL_NEIGHBORHOOD_IDS } from '../src/core/social/socialConstants';
import { processSocialPulseEndOfDay } from '../src/core/social/socialEngine';
import { createInitialSocialPulseState } from '../src/core/social/socialSeed';
import {
  calculateNeighborhoodSocialScore,
  selectNeighborhoodSocialRisks,
} from '../src/core/social/socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialPulseState,
  SocialRiskLevel,
  SocialTopic,
} from '../src/core/social/socialTypes';

const PILOT_DAYS = 7;

type ScenarioId =
  | 'passive_baseline'
  | 'no_active_topics'
  | 'misinformation_pressure'
  | 'crisis_pressure'
  | 'gratitude_wave'
  | 'mixed_social_week';

type BalanceVerdict = 'PASS' | 'WARN' | 'FAIL';

type DaySnapshot = {
  day: number;
  globalPulseScore: number;
  globalRiskLevel: SocialRiskLevel;
  highOrCriticalNeighborhoodCount: number;
};

type ScenarioSummary = {
  scenarioName: ScenarioId;
  day1GlobalPulseScore: number;
  day7GlobalPulseScore: number;
  delta: number;
  day7GlobalRiskLevel: SocialRiskLevel;
  lowestNeighborhoodScore: number;
  highestNeighborhoodScore: number;
  criticalNeighborhoodCount: number;
  highOrCriticalNeighborhoodCount: number;
  maxMisinformation: number;
  maxComplaintHeat: number;
  maxCrisisSpread: number;
  maxMediaAttention: number;
  averageTrust: number;
  averageFatigue: number;
};

type ScenarioResult = {
  id: ScenarioId;
  daily: DaySnapshot[];
  summary: ScenarioSummary;
  findings: { verdict: BalanceVerdict; message: string }[];
};

function cloneState(state: SocialPulseState): SocialPulseState {
  const neighborhoods: Record<string, NeighborhoodSocialProfile> = {};
  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const profile = state.neighborhoods[id];
    if (!profile) continue;
    neighborhoods[id] = {
      ...profile,
      activeTopicIds: [...profile.activeTopicIds],
    };
  }
  return {
    ...state,
    neighborhoods,
    activeTopics: state.activeTopics.map((t) => ({ ...t })),
    mentionFeed: [...state.mentionFeed],
    outcomeHistory: [...state.outcomeHistory],
  };
}

function withTopics(
  state: SocialPulseState,
  topics: SocialTopic[],
): SocialPulseState {
  const next = cloneState(state);
  next.activeTopics = topics;
  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const profile = next.neighborhoods[id];
    if (!profile) continue;
    profile.activeTopicIds = topics
      .filter((t) => t.neighborhoodId === id)
      .map((t) => t.id);
  }
  return next;
}

function makeTopic(
  partial: Pick<SocialTopic, 'id' | 'neighborhoodId' | 'type' | 'severity'> &
    Partial<SocialTopic>,
): SocialTopic {
  return {
    title: partial.title ?? 'Simülasyon konusu',
    intensity: partial.intensity ?? 60,
    createdDay: partial.createdDay ?? 1,
    ...partial,
  };
}

function buildScenarioState(id: ScenarioId): SocialPulseState {
  const base = createInitialSocialPulseState(1);
  base.lastProcessedDay = 0;

  switch (id) {
    case 'passive_baseline':
      return cloneState(base);

    case 'no_active_topics':
      return withTopics(base, []);

    case 'misinformation_pressure':
      return withTopics(base, [
        makeTopic({
          id: 'sim-misinfo-merkez',
          neighborhoodId: 'merkez',
          type: 'misinformation',
          severity: 'high',
          title: 'Yanlış bilgi baskısı',
          intensity: 75,
          expiresDay: PILOT_DAYS + 2,
        }),
      ]);

    case 'crisis_pressure':
      return withTopics(base, [
        makeTopic({
          id: 'sim-crisis-merkez',
          neighborhoodId: 'merkez',
          type: 'crisis_pressure',
          severity: 'high',
          title: 'Kriz baskısı',
          intensity: 80,
          expiresDay: PILOT_DAYS + 2,
        }),
      ]);

    case 'gratitude_wave':
      return withTopics(base, [
        makeTopic({
          id: 'sim-gratitude-cumhuriyet',
          neighborhoodId: 'cumhuriyet',
          type: 'gratitude_wave',
          severity: 'high',
          title: 'Teşekkür dalgası',
          intensity: 70,
          expiresDay: PILOT_DAYS + 2,
        }),
      ]);

    case 'mixed_social_week':
      return withTopics(base, [
        makeTopic({
          id: 'sim-mixed-crisis-merkez',
          neighborhoodId: 'merkez',
          type: 'crisis_pressure',
          severity: 'high',
          title: 'Merkez kriz',
          intensity: 78,
          expiresDay: PILOT_DAYS + 2,
        }),
        makeTopic({
          id: 'sim-mixed-misinfo-cumhuriyet',
          neighborhoodId: 'cumhuriyet',
          type: 'misinformation',
          severity: 'medium',
          title: 'Cumhuriyet söylenti',
          intensity: 62,
          expiresDay: PILOT_DAYS + 2,
        }),
        makeTopic({
          id: 'sim-mixed-complaint-sanayi',
          neighborhoodId: 'sanayi',
          type: 'service_delay',
          severity: 'medium',
          title: 'Sanayi gecikme',
          intensity: 58,
          expiresDay: PILOT_DAYS + 2,
        }),
        makeTopic({
          id: 'sim-mixed-gratitude-yesilvadi',
          neighborhoodId: 'yesilvadi',
          type: 'gratitude_wave',
          severity: 'medium',
          title: 'Yeşilvadi teşekkür',
          intensity: 55,
          expiresDay: PILOT_DAYS + 2,
        }),
      ]);

    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function snapshotDay(state: SocialPulseState, day: number): DaySnapshot {
  const risks = selectNeighborhoodSocialRisks(state);
  const highOrCritical = risks.filter(
    (r) => r.riskLevel === 'high' || r.riskLevel === 'critical',
  ).length;

  return {
    day,
    globalPulseScore: state.globalPulseScore,
    globalRiskLevel: state.globalRiskLevel,
    highOrCriticalNeighborhoodCount: highOrCritical,
  };
}

function simulateScenario(id: ScenarioId): ScenarioResult {
  let state = buildScenarioState(id);
  const daily: DaySnapshot[] = [];

  for (let day = 1; day <= PILOT_DAYS; day += 1) {
    state = processSocialPulseEndOfDay(state, day);
    daily.push(snapshotDay(state, day));
  }

  const risks = selectNeighborhoodSocialRisks(state);
  const scores = risks.map((r) => r.score);
  const profiles = Object.values(state.neighborhoods);

  const summary: ScenarioSummary = {
    scenarioName: id,
    day1GlobalPulseScore: daily[0]?.globalPulseScore ?? 0,
    day7GlobalPulseScore: daily[PILOT_DAYS - 1]?.globalPulseScore ?? 0,
    delta:
      (daily[PILOT_DAYS - 1]?.globalPulseScore ?? 0) -
      (daily[0]?.globalPulseScore ?? 0),
    day7GlobalRiskLevel: state.globalRiskLevel,
    lowestNeighborhoodScore: scores.length ? Math.min(...scores) : 0,
    highestNeighborhoodScore: scores.length ? Math.max(...scores) : 0,
    criticalNeighborhoodCount: risks.filter((r) => r.riskLevel === 'critical')
      .length,
    highOrCriticalNeighborhoodCount: risks.filter(
      (r) => r.riskLevel === 'high' || r.riskLevel === 'critical',
    ).length,
    maxMisinformation: Math.max(...profiles.map((p) => p.misinformation), 0),
    maxComplaintHeat: Math.max(...profiles.map((p) => p.complaintHeat), 0),
    maxCrisisSpread: Math.max(...profiles.map((p) => p.crisisSpread), 0),
    maxMediaAttention: Math.max(...profiles.map((p) => p.mediaAttention), 0),
    averageTrust:
      profiles.length === 0
        ? 0
        : Math.round(
            profiles.reduce((s, p) => s + p.trust, 0) / profiles.length,
          ),
    averageFatigue:
      profiles.length === 0
        ? 0
        : Math.round(
            profiles.reduce((s, p) => s + p.fatigue, 0) / profiles.length,
          ),
  };

  return {
    id,
    daily,
    summary,
    findings: judgeScenario(id, summary, daily, state),
  };
}

function addFinding(
  findings: { verdict: BalanceVerdict; message: string }[],
  verdict: BalanceVerdict,
  message: string,
): void {
  findings.push({ verdict, message });
}

function worstVerdict(verdicts: BalanceVerdict[]): BalanceVerdict {
  if (verdicts.includes('FAIL')) return 'FAIL';
  if (verdicts.includes('WARN')) return 'WARN';
  return 'PASS';
}

function judgeGlobalRange(
  globalDay7: number,
  findings: { verdict: BalanceVerdict; message: string }[],
): void {
  if (globalDay7 < 25 || globalDay7 > 90) {
    addFinding(
      findings,
      'FAIL',
      `Gün 7 global nabız aralık dışı: ${globalDay7} (hedef 25–85)`,
    );
  } else if (globalDay7 < 35 || globalDay7 > 80) {
    addFinding(
      findings,
      'WARN',
      `Gün 7 global nabız sınırda: ${globalDay7} (ideal 35–80)`,
    );
  } else {
    addFinding(
      findings,
      'PASS',
      `Gün 7 global nabız dengeli: ${globalDay7}`,
    );
  }
}

function judgeScenario(
  id: ScenarioId,
  summary: ScenarioSummary,
  daily: DaySnapshot[],
  finalState: SocialPulseState,
): { verdict: BalanceVerdict; message: string }[] {
  const findings: { verdict: BalanceVerdict; message: string }[] = [];

  judgeGlobalRange(summary.day7GlobalPulseScore, findings);

  if (summary.criticalNeighborhoodCount >= 3) {
    addFinding(
      findings,
      'FAIL',
      `critical mahalle sayısı çok yüksek: ${summary.criticalNeighborhoodCount}`,
    );
  } else if (summary.criticalNeighborhoodCount > 1) {
    addFinding(
      findings,
      'WARN',
      `critical mahalle sayısı: ${summary.criticalNeighborhoodCount}`,
    );
  } else {
    addFinding(
      findings,
      'PASS',
      `critical mahalle sayısı kabul edilebilir: ${summary.criticalNeighborhoodCount}`,
    );
  }

  if (summary.highOrCriticalNeighborhoodCount >= 3) {
    addFinding(
      findings,
      'WARN',
      `yüksek/critical mahalle: ${summary.highOrCriticalNeighborhoodCount}`,
    );
  }

  const day1 = daily[0]?.globalPulseScore ?? 0;
  const day7 = summary.day7GlobalPulseScore;
  const delta = day7 - day1;

  switch (id) {
    case 'passive_baseline': {
      if (day7 < 35 || day7 > 80) {
        addFinding(
          findings,
          day7 < 25 || day7 > 90 ? 'FAIL' : 'WARN',
          `passive_baseline gün 7 nabız hedef dışı: ${day7} (hedef 35–80)`,
        );
      } else {
        addFinding(findings, 'PASS', `passive_baseline gün 7: ${day7}`);
      }
      if (summary.highOrCriticalNeighborhoodCount >= 4) {
        addFinding(
          findings,
          'FAIL',
          'passive_baseline tüm haritayı high/critical yapıyor',
        );
      }
      if (delta < -20) {
        addFinding(
          findings,
          'WARN',
          `passive_baseline 7 günde sert düşüş: ${delta}`,
        );
      }
      break;
    }

    case 'no_active_topics': {
      if (day7 < 25) {
        addFinding(
          findings,
          'FAIL',
          `no_active_topics skor çöktü: ${day7}`,
        );
      } else if (delta < -18) {
        addFinding(
          findings,
          'WARN',
          `no_active_topics sert düşüş: ${delta}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `no_active_topics doğal decay kontrollü: Δ${delta}`,
        );
      }
      break;
    }

    case 'misinformation_pressure': {
      const merkez = finalState.neighborhoods.merkez;
      const seedMerkez = createInitialSocialPulseState(1).neighborhoods.merkez!;
      if (
        merkez &&
        merkez.misinformation <= seedMerkez.misinformation + 2
      ) {
        addFinding(
          findings,
          'WARN',
          'misinformation_pressure misinformation artışı zayıf',
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `misinformation yükseldi: max ${summary.maxMisinformation}`,
        );
      }
      if (summary.criticalNeighborhoodCount >= 2) {
        addFinding(
          findings,
          'FAIL',
          'misinformation_pressure haritayı çökertti',
        );
      }
      break;
    }

    case 'crisis_pressure': {
      const merkez = finalState.neighborhoods.merkez;
      const seedMerkez = createInitialSocialPulseState(1).neighborhoods.merkez!;
      const crisisVisible =
        merkez != null &&
        (merkez.crisisSpread > seedMerkez.crisisSpread + 3 ||
          merkez.complaintHeat > seedMerkez.complaintHeat + 5);
      if (!crisisVisible) {
        addFinding(
          findings,
          'WARN',
          'crisis_pressure kriz metrikleri yeterince artmadı',
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `kriz baskısı görünür: spread ${merkez?.crisisSpread}, şikayet ${merkez?.complaintHeat}`,
        );
      }
      if (summary.criticalNeighborhoodCount >= 3) {
        addFinding(
          findings,
          'FAIL',
          'crisis_pressure tüm mahalleleri critical yaptı',
        );
      }
      break;
    }

    case 'gratitude_wave': {
      const cumhuriyet = finalState.neighborhoods.cumhuriyet;
      const seedCumhuriyet =
        createInitialSocialPulseState(1).neighborhoods.cumhuriyet!;
      const cumhuriyetScore = cumhuriyet
        ? calculateNeighborhoodSocialScore(cumhuriyet)
        : 0;
      const seedScore = calculateNeighborhoodSocialScore(seedCumhuriyet);
      if (
        cumhuriyet &&
        (cumhuriyet.gratitude <= seedCumhuriyet.gratitude ||
          cumhuriyetScore <= seedScore)
      ) {
        addFinding(
          findings,
          'WARN',
          'gratitude_wave pozitif etki zayıf veya ters',
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `gratitude_wave olumlu: skor ${seedScore} → ${cumhuriyetScore}`,
        );
      }
      if (delta > 0) {
        addFinding(findings, 'PASS', `global skor arttı: Δ${delta}`);
      }
      break;
    }

    case 'mixed_social_week': {
      if (summary.highOrCriticalNeighborhoodCount >= 4) {
        addFinding(
          findings,
          'WARN',
          `mixed_social_week yoğun baskı: ${summary.highOrCriticalNeighborhoodCount} high/critical`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          'mixed_social_week harita dağılımı kontrollü',
        );
      }
      break;
    }

    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }

  return findings;
}

function scenarioOverallVerdict(
  findings: { verdict: BalanceVerdict; message: string }[],
): BalanceVerdict {
  return worstVerdict(findings.map((f) => f.verdict));
}

function pad(value: string | number, width: number): string {
  const text = String(value);
  return text.length >= width ? text : ' '.repeat(width - text.length) + text;
}

function printScenario(result: ScenarioResult): BalanceVerdict {
  const s = result.summary;
  const overall = scenarioOverallVerdict(result.findings);

  console.log('');
  console.log('═'.repeat(72));
  console.log(`SENARYO: ${result.id}  [${overall}]`);
  console.log('─'.repeat(72));
  console.log(
    [
      pad('Metrik', 28),
      pad('Değer', 12),
    ].join(''),
  );
  console.log('─'.repeat(72));
  const rows: [string, string | number][] = [
    ['day1 globalPulseScore', s.day1GlobalPulseScore],
    ['day7 globalPulseScore', s.day7GlobalPulseScore],
    ['delta', s.delta],
    ['day7 globalRiskLevel', s.day7GlobalRiskLevel],
    ['lowestNeighborhoodScore', s.lowestNeighborhoodScore],
    ['highestNeighborhoodScore', s.highestNeighborhoodScore],
    ['criticalNeighborhoodCount', s.criticalNeighborhoodCount],
    ['highOrCriticalNeighborhoodCount', s.highOrCriticalNeighborhoodCount],
    ['maxMisinformation', s.maxMisinformation],
    ['maxComplaintHeat', s.maxComplaintHeat],
    ['maxCrisisSpread', s.maxCrisisSpread],
    ['maxMediaAttention', s.maxMediaAttention],
    ['averageTrust', s.averageTrust],
    ['averageFatigue', s.averageFatigue],
  ];
  for (const [label, value] of rows) {
    console.log(`${pad(label, 28)} ${pad(value, 12)}`);
  }

  console.log('─'.repeat(72));
  console.log('Günlük trace:');
  for (const snap of result.daily) {
    console.log(
      `  Day ${snap.day}: global ${snap.globalPulseScore}, risk ${snap.globalRiskLevel}, high/critical ${snap.highOrCriticalNeighborhoodCount}`,
    );
  }

  console.log('─'.repeat(72));
  console.log('Judgement:');
  for (const f of result.findings) {
    console.log(`  [${f.verdict}] ${f.message}`);
  }

  return overall;
}

function main(): void {
  console.log('Crevia — Social Daily Drift Balance Simulation (7 gün)');
  console.log(`Mahalleler: ${SOCIAL_NEIGHBORHOOD_IDS.join(', ')}`);

  const scenarioIds: ScenarioId[] = [
    'passive_baseline',
    'no_active_topics',
    'misinformation_pressure',
    'crisis_pressure',
    'gratitude_wave',
    'mixed_social_week',
  ];

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const id of scenarioIds) {
    const result = simulateScenario(id);
    const overall = printScenario(result);
    if (overall === 'PASS') passCount += 1;
    else if (overall === 'WARN') warnCount += 1;
    else failCount += 1;
  }

  console.log('');
  console.log('═'.repeat(72));
  console.log(`ÖZET: PASS=${passCount}  WARN=${warnCount}  FAIL=${failCount}`);
  if (failCount > 0) {
    console.log('Sonuç: FAIL — drift tuning aşamasında sabitler gözden geçirilmeli.');
    process.exit(1);
  }
  if (warnCount > 0) {
    console.log('Sonuç: WARN — kabul edilebilir; ince ayar önerilebilir.');
  } else {
    console.log('Sonuç: PASS — drift dengesi pilot aralığında.');
  }
}

main();
