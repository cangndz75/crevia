/**
 * Sosyal Nabız 7 günlük karar stratejisi simülasyonu (decision effects + daily drift).
 * Çalıştır: npm run analyze:social-decisions
 */

import { applySocialDecisionEffect } from '../src/core/social/socialDecisionEffects';
import { processSocialPulseEndOfDay } from '../src/core/social/socialEngine';
import {
  SOCIAL_NEIGHBORHOOD_IDS,
  SOCIAL_VALUE_MAX,
  SOCIAL_VALUE_MIN,
} from '../src/core/social/socialConstants';
import { createInitialSocialPulseState } from '../src/core/social/socialSeed';
import {
  calculateNeighborhoodSocialScore,
  getSocialRiskLevel,
  selectNeighborhoodSocialRisks,
} from '../src/core/social/socialSelectors';
import type {
  NeighborhoodSocialProfile,
  SocialDecisionAction,
  SocialDecisionChoiceInput,
  SocialDecisionEffectInput,
  SocialDecisionEventInput,
  SocialPulseState,
  SocialRiskLevel,
} from '../src/core/social/socialTypes';

const PILOT_DAYS = 7;
const TARGET_NEIGHBORHOOD_ID = 'merkez';

type ScenarioId =
  | 'always_communicate'
  | 'always_dispatch'
  | 'always_silent'
  | 'permanent_solution_heavy'
  | 'mixed_reasonable'
  | 'wrong_player';

type BalanceVerdict = 'PASS' | 'WARN' | 'FAIL';

type DayPlan = {
  title: string;
  description: string;
};

type DayTrace = {
  day: number;
  action: SocialDecisionAction;
  globalPulseScore: number;
  targetScore: number;
  targetRisk: SocialRiskLevel;
  highOrCriticalNeighborhoodCount: number;
};

type ScenarioSummary = {
  scenarioName: ScenarioId;
  day1GlobalPulseScore: number;
  day7GlobalPulseScore: number;
  delta: number;
  day7GlobalRiskLevel: SocialRiskLevel;
  targetNeighborhoodScore: number;
  targetNeighborhoodRisk: SocialRiskLevel;
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
  outcomeHistoryCount: number;
};

type ScenarioResult = {
  id: ScenarioId;
  daily: DayTrace[];
  summary: ScenarioSummary;
  findings: { verdict: BalanceVerdict; message: string }[];
  initialTargetProfile: NeighborhoodSocialProfile;
  finalTargetProfile: NeighborhoodSocialProfile;
};

const MOCK_EVENT: SocialDecisionEventInput = {
  id: 'sim-social-crisis-merkez',
  title: 'Merkez Mahallesi Su Tahliyesi Sorunu',
  description: 'Yoğun yağış sonrası sosyal medya şikayetleri artıyor.',
  neighborhoodId: TARGET_NEIGHBORHOOD_ID,
  category: 'social',
  tags: ['şikayet', 'kriz', 'sosyal'],
};

function buildMockDecision(plan: DayPlan, day: number): SocialDecisionChoiceInput {
  return {
    id: `sim-decision-day-${day}`,
    title: plan.title,
    description: plan.description,
  };
}

function getDayPlan(scenarioId: ScenarioId, day: number): DayPlan {
  switch (scenarioId) {
    case 'always_communicate':
      return {
        title: 'Açıklama Yap',
        description: 'Halkı bilgilendir ve şeffaf kamuoyu açıklaması yap',
      };

    case 'always_dispatch':
      return {
        title: 'Ekip Yönlendir',
        description: 'Saha ekibi yönlendir ve müdahale başlat',
      };

    case 'always_silent':
      return {
        title: 'Sessiz Kal',
        description: 'Bekle ve görmezden gel, pasif kal',
      };

    case 'permanent_solution_heavy':
      if (day === 1 || day === 3 || day === 5) {
        return {
          title: 'Kalıcı çözüm',
          description: 'Altyapı yenileme ve kökten uzun vadeli sistemli çözüm yatırımı',
        };
      }
      return {
        title: 'Takip',
        description: 'Sosyal nabzı izle, gözlemle ve analiz raporla',
      };

    case 'mixed_reasonable': {
      const plans: DayPlan[] = [
        {
          title: 'Açıklama Yap',
          description: 'Halkı bilgilendir ve duyuru paylaş',
        },
        {
          title: 'Ekip Yönlendir',
          description: 'Saha ekibi sevk et ve müdahale başlat',
        },
        {
          title: 'Takip',
          description: 'Sosyal medyayı izle ve ölç',
        },
        {
          title: 'Bilgilendirme',
          description: 'Şeffaf açıklama ve basın bilgilendirmesi',
        },
        {
          title: 'Kalıcı çözüm',
          description: 'Altyapı yenile ve kökten iyileştir',
        },
        {
          title: 'Müdahale',
          description: 'Ekip gönder ve temizlik bakım başlat',
        },
        {
          title: 'Kamuoyu',
          description: 'Halka açıkla ve bilgi ver',
        },
      ];
      return plans[day - 1]!;
    }

    case 'wrong_player': {
      const plans: DayPlan[] = [
        { title: 'Sessiz Kal', description: 'Bekle ve görmezden gel' },
        { title: 'Sessiz', description: 'Pasif kal, risk al' },
        {
          title: 'Geç açıklama',
          description: 'Halkı bilgilendir (geç müdahale)',
        },
        { title: 'Bekle', description: 'Sessiz kal ve müdahale etme' },
        { title: 'İzle', description: 'Gözlemle ve raporla' },
        { title: 'Sessiz', description: 'Açıklama yapma, bekle' },
        {
          title: 'Son dakika ekip',
          description: 'Ekip yönlendir (geç müdahale)',
        },
      ];
      return plans[day - 1]!;
    }

    default: {
      const _exhaustive: never = scenarioId;
      return _exhaustive;
    }
  }
}

function cloneProfile(profile: NeighborhoodSocialProfile): NeighborhoodSocialProfile {
  return { ...profile, activeTopicIds: [...profile.activeTopicIds] };
}

function cloneState(state: SocialPulseState): SocialPulseState {
  const neighborhoods: SocialPulseState['neighborhoods'] = {};
  for (const id of SOCIAL_NEIGHBORHOOD_IDS) {
    const profile = state.neighborhoods[id];
    if (profile) {
      neighborhoods[id] = cloneProfile(profile);
    }
  }
  return {
    ...state,
    neighborhoods,
    activeTopics: state.activeTopics.map((t) => ({ ...t })),
    mentionFeed: [...state.mentionFeed],
    outcomeHistory: [...state.outcomeHistory],
  };
}

function metricsInRange(state: SocialPulseState): boolean {
  for (const profile of Object.values(state.neighborhoods)) {
    const values = [
      profile.trust,
      profile.complaintHeat,
      profile.misinformation,
      profile.gratitude,
      profile.crisisSpread,
      profile.mediaAttention,
      profile.fatigue,
    ];
    if (
      values.some(
        (v) => !Number.isFinite(v) || v < SOCIAL_VALUE_MIN || v > SOCIAL_VALUE_MAX,
      )
    ) {
      return false;
    }
  }
  const global = state.globalPulseScore;
  return (
    Number.isFinite(global) &&
    global >= SOCIAL_VALUE_MIN &&
    global <= SOCIAL_VALUE_MAX
  );
}

function buildSummary(
  id: ScenarioId,
  daily: DayTrace[],
  state: SocialPulseState,
): ScenarioSummary {
  const risks = selectNeighborhoodSocialRisks(state);
  const scores = risks.map((r) => r.score);
  const profiles = Object.values(state.neighborhoods);
  const targetRisk = risks.find((r) => r.neighborhoodId === TARGET_NEIGHBORHOOD_ID);

  return {
    scenarioName: id,
    day1GlobalPulseScore: daily[0]?.globalPulseScore ?? 0,
    day7GlobalPulseScore: daily[PILOT_DAYS - 1]?.globalPulseScore ?? 0,
    delta:
      (daily[PILOT_DAYS - 1]?.globalPulseScore ?? 0) -
      (daily[0]?.globalPulseScore ?? 0),
    day7GlobalRiskLevel: state.globalRiskLevel,
    targetNeighborhoodScore: targetRisk?.score ?? 0,
    targetNeighborhoodRisk: targetRisk?.riskLevel ?? 'medium',
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
    outcomeHistoryCount: state.outcomeHistory.length,
  };
}

function simulateScenario(id: ScenarioId): ScenarioResult {
  let state = createInitialSocialPulseState(1);
  state = { ...state, lastProcessedDay: 0 };
  const initialTarget = cloneProfile(state.neighborhoods[TARGET_NEIGHBORHOOD_ID]!);
  const daily: DayTrace[] = [];

  for (let day = 1; day <= PILOT_DAYS; day += 1) {
    const plan = getDayPlan(id, day);
    const input: SocialDecisionEffectInput = {
      event: MOCK_EVENT,
      decision: buildMockDecision(plan, day),
      day,
    };
    const effect = applySocialDecisionEffect(state, input);
    state = effect.state;
    state = processSocialPulseEndOfDay(state, day);

    const targetProfile = state.neighborhoods[TARGET_NEIGHBORHOOD_ID]!;
    const targetScore = calculateNeighborhoodSocialScore(targetProfile);
    const risks = selectNeighborhoodSocialRisks(state);
    const highOrCritical = risks.filter(
      (r) => r.riskLevel === 'high' || r.riskLevel === 'critical',
    ).length;

    daily.push({
      day,
      action: effect.action,
      globalPulseScore: state.globalPulseScore,
      targetScore,
      targetRisk: getSocialRiskLevel(targetScore),
      highOrCriticalNeighborhoodCount: highOrCritical,
    });
  }

  const finalTarget = state.neighborhoods[TARGET_NEIGHBORHOOD_ID]!;
  return {
    id,
    daily,
    summary: buildSummary(id, daily, state),
    findings: [],
    initialTargetProfile: initialTarget,
    finalTargetProfile: finalTarget,
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
  if (globalDay7 < 30 || globalDay7 > 92) {
    addFinding(
      findings,
      'FAIL',
      `Gün 7 global nabız aralık dışı: ${globalDay7} (hedef 30–92)`,
    );
  } else if (globalDay7 < 40 || globalDay7 > 85) {
    addFinding(
      findings,
      'WARN',
      `Gün 7 global nabız sınırda: ${globalDay7} (ideal 40–85)`,
    );
  } else {
    addFinding(
      findings,
      'PASS',
      `Gün 7 global nabız dengeli: ${globalDay7}`,
    );
  }
}

function judgeCommonChecks(
  result: ScenarioResult,
  stateAfterSim: SocialPulseState,
): void {
  const { summary, findings } = result;

  judgeGlobalRange(summary.day7GlobalPulseScore, findings);

  if (!metricsInRange(stateAfterSim)) {
    addFinding(findings, 'FAIL', 'Profil veya global metrik 0–100 dışında');
  }

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
  }

  if (summary.highOrCriticalNeighborhoodCount >= 3) {
    addFinding(
      findings,
      'WARN',
      `yüksek/critical mahalle: ${summary.highOrCriticalNeighborhoodCount}`,
    );
  }

  if (summary.outcomeHistoryCount > 12) {
    addFinding(
      findings,
      'FAIL',
      `outcomeHistory sınırı aşıldı: ${summary.outcomeHistoryCount}`,
    );
  } else {
    addFinding(
      findings,
      'PASS',
      `outcomeHistory sınırı korunuyor: ${summary.outcomeHistoryCount}`,
    );
  }

  const beforeIdempotent = cloneState(stateAfterSim);
  const afterSecondEod = processSocialPulseEndOfDay(stateAfterSim, PILOT_DAYS);
  if (
    afterSecondEod.globalPulseScore !== beforeIdempotent.globalPulseScore ||
    afterSecondEod.lastProcessedDay !== beforeIdempotent.lastProcessedDay
  ) {
    addFinding(
      findings,
      'FAIL',
      'processSocialPulseEndOfDay aynı gün için idempotent değil',
    );
  } else {
    addFinding(findings, 'PASS', 'gün sonu drift idempotent');
  }
}

function judgeScenario(
  result: ScenarioResult,
  allSummaries: Map<ScenarioId, ScenarioSummary>,
): void {
  judgeCommonChecks(result, rebuildFinalState(result));

  const { summary, findings, initialTargetProfile, finalTargetProfile } = result;
  const delta = summary.delta;
  const day7 = summary.day7GlobalPulseScore;
  const day1 = summary.day1GlobalPulseScore;
  const targetDelta =
    summary.targetNeighborhoodScore -
    calculateNeighborhoodSocialScore(initialTargetProfile);

  switch (result.id) {
    case 'always_communicate': {
      if (delta < 0) {
        addFinding(
          findings,
          'WARN',
          `always_communicate beklenenden zayıf: Δ${delta}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `always_communicate iyileşme/denge: Δ${delta}`,
        );
      }
      if (day7 > 90 || summary.highestNeighborhoodScore > 92) {
        addFinding(
          findings,
          'WARN',
          `always_communicate aşırı yüksek skor: global ${day7}, max mahalle ${summary.highestNeighborhoodScore}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          'always_communicate aşırı 90+ spam yok',
        );
      }
      break;
    }

    case 'always_dispatch': {
      const complaintDown =
        finalTargetProfile.complaintHeat < initialTargetProfile.complaintHeat;
      const crisisDown =
        finalTargetProfile.crisisSpread < initialTargetProfile.crisisSpread;
      if (complaintDown && crisisDown) {
        addFinding(
          findings,
          'PASS',
          `always_dispatch hedef şikayet/kriz düştü: şikayet ${initialTargetProfile.complaintHeat}→${finalTargetProfile.complaintHeat}, kriz ${initialTargetProfile.crisisSpread}→${finalTargetProfile.crisisSpread}`,
        );
      } else {
        addFinding(
          findings,
          'FAIL',
          'always_dispatch complaintHeat/crisisSpread düşürmedi (ters etki)',
        );
      }
      break;
    }

    case 'always_silent': {
      if (targetDelta > 0) {
        addFinding(
          findings,
          'FAIL',
          `always_silent hedef mahallede pozitif sonuç: hedef Δ${targetDelta}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `always_silent hedef skoru düşürdü: hedef Δ${targetDelta}`,
        );
      }
      if (delta > 0) {
        addFinding(
          findings,
          'WARN',
          `always_silent global skor arttı (drift etkisi): global Δ${delta}, hedef Δ${targetDelta}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `always_silent global skor düştü: global Δ${delta}`,
        );
      }
      if (summary.criticalNeighborhoodCount >= 3) {
        addFinding(
          findings,
          'FAIL',
          'always_silent 7 günde haritayı critical yaptı',
        );
      } else {
        addFinding(
          findings,
          'PASS',
          'always_silent haritayı tamamen çökertmedi',
        );
      }
      break;
    }

    case 'permanent_solution_heavy': {
      if (delta < 3) {
        addFinding(
          findings,
          'WARN',
          `permanent_solution_heavy zayıf toparlanma: Δ${delta}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `permanent_solution_heavy güçlü toparlanma: Δ${delta}`,
        );
      }
      if (summary.highestNeighborhoodScore > 95 || day7 > 92) {
        addFinding(
          findings,
          'FAIL',
          `permanent_solution_heavy 95+ spam: global ${day7}, max ${summary.highestNeighborhoodScore}`,
        );
      } else if (summary.highestNeighborhoodScore > 90) {
        addFinding(
          findings,
          'WARN',
          `permanent_solution_heavy yüksek skor: max ${summary.highestNeighborhoodScore}`,
        );
      }
      break;
    }

    case 'mixed_reasonable': {
      const scores = [...allSummaries.values()].map((s) => s.day7GlobalPulseScore);
      const sorted = [...scores].sort((a, b) => b - a);
      const rank = sorted.indexOf(day7);
      if (rank <= 1) {
        addFinding(
          findings,
          'PASS',
          `mixed_reasonable en iyi/dengeli senaryolardan biri (gün7=${day7}, sıra=${rank + 1}/${sorted.length})`,
        );
      } else {
        addFinding(
          findings,
          'WARN',
          `mixed_reasonable beklenenden düşük sıra: gün7=${day7}, sıra=${rank + 1}`,
        );
      }
      break;
    }

    case 'wrong_player': {
      const mixed = allSummaries.get('mixed_reasonable');
      if (mixed && day7 >= mixed.day7GlobalPulseScore) {
        addFinding(
          findings,
          'WARN',
          `wrong_player mixed_reasonable kadar kötü değil: ${day7} vs ${mixed.day7GlobalPulseScore}`,
        );
      } else {
        addFinding(
          findings,
          'PASS',
          `wrong_player kötü strateji sonucu düşük: gün7=${day7}`,
        );
      }
      if (day7 < 30) {
        addFinding(findings, 'FAIL', 'wrong_player sistemi çökertti (<30)');
      } else {
        addFinding(findings, 'PASS', 'wrong_player sistem çöküşü yok');
      }
      break;
    }

    default: {
      const _exhaustive: never = result.id;
      return _exhaustive;
    }
  }
}

/** Judgement için son state’i yeniden üret (hafif, deterministik). */
function rebuildFinalState(result: ScenarioResult): SocialPulseState {
  let state = createInitialSocialPulseState(1);
  state = { ...state, lastProcessedDay: 0 };
  for (let day = 1; day <= PILOT_DAYS; day += 1) {
    const plan = getDayPlan(result.id, day);
    const effect = applySocialDecisionEffect(state, {
      event: MOCK_EVENT,
      decision: buildMockDecision(plan, day),
      day,
    });
    state = processSocialPulseEndOfDay(effect.state, day);
  }
  return state;
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
  const rows: [string, string | number][] = [
    ['day1 globalPulseScore', s.day1GlobalPulseScore],
    ['day7 globalPulseScore', s.day7GlobalPulseScore],
    ['delta', s.delta],
    ['day7 globalRiskLevel', s.day7GlobalRiskLevel],
    ['targetNeighborhoodScore', s.targetNeighborhoodScore],
    ['targetNeighborhoodRisk', s.targetNeighborhoodRisk],
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
    ['outcomeHistoryCount', s.outcomeHistoryCount],
  ];
  for (const [label, value] of rows) {
    console.log(`${pad(label, 32)} ${pad(value, 12)}`);
  }

  console.log('─'.repeat(72));
  console.log('Günlük trace:');
  for (const snap of result.daily) {
    console.log(
      `  Day ${snap.day}: action ${snap.action}, global ${snap.globalPulseScore}, target ${snap.targetScore}, risk ${snap.targetRisk}, high/critical ${snap.highOrCriticalNeighborhoodCount}`,
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
  console.log(
    'Crevia — Social Decision Balance Simulation (7 gün, karar + drift)',
  );
  console.log(`Hedef mahalle: ${TARGET_NEIGHBORHOOD_ID}`);
  console.log(`Mahalleler: ${SOCIAL_NEIGHBORHOOD_IDS.join(', ')}`);

  const scenarioIds: ScenarioId[] = [
    'always_communicate',
    'always_dispatch',
    'always_silent',
    'permanent_solution_heavy',
    'mixed_reasonable',
    'wrong_player',
  ];

  const results: ScenarioResult[] = [];
  for (const id of scenarioIds) {
    results.push(simulateScenario(id));
  }

  const summaryMap = new Map<ScenarioId, ScenarioSummary>(
    results.map((r) => [r.id, r.summary]),
  );
  for (const result of results) {
    judgeScenario(result, summaryMap);
  }

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const result of results) {
    const overall = printScenario(result);
    if (overall === 'PASS') passCount += 1;
    else if (overall === 'WARN') warnCount += 1;
    else failCount += 1;
  }

  console.log('');
  console.log('═'.repeat(72));
  console.log(`ÖZET: PASS=${passCount}  WARN=${warnCount}  FAIL=${failCount}`);
  if (failCount > 0) {
    console.log(
      'Sonuç: FAIL — karar etkileri veya drift birlikte denge dışına çıktı.',
    );
    process.exit(1);
  }
  if (warnCount > 0) {
    console.log('Sonuç: WARN — kabul edilebilir; ince ayar önerilebilir.');
  } else {
    console.log('Sonuç: PASS — karar stratejileri pilot aralığında.');
  }
}

main();
