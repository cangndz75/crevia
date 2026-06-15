import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import { TOMORROW_RISK_FORBIDDEN_CTA_WORDS, TOMORROW_RISK_KINDS } from './tomorrowRiskConstants';
import {
  buildOneMoreDayCta,
  buildTomorrowRiskModel,
  isTomorrowRiskDuplicate,
  normalizeTomorrowRiskTextForVerify,
} from './tomorrowRiskModel';
import { buildTomorrowRiskPresentation } from './tomorrowRiskPresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

export type VerifyTomorrowRiskOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail = pass): boolean {
  checks.push(`${ok ? 'PASS' : 'FAIL'} ${ok ? pass : fail}`);
  return ok;
}

function containsForbiddenCta(text: string | null | undefined): boolean {
  const normalized = normalizeTomorrowRiskTextForVerify(text ?? '');
  return TOMORROW_RISK_FORBIDDEN_CTA_WORDS.some((word) =>
    normalized.includes(normalizeTomorrowRiskTextForVerify(word)),
  );
}

export function verifyTomorrowRiskScenario(): VerifyTomorrowRiskOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (value: boolean) => {
    ok = value && ok;
  };

  record(assert(checks, TOMORROW_RISK_KINDS.length >= 12, 'at least 12 tomorrow risk kinds'));
  for (const kind of [
    'route_pressure_tomorrow',
    'container_pressure_tomorrow',
    'social_trust_recovery',
    'personnel_fatigue_watch',
    'vehicle_fatigue_watch',
    'district_trust_watch',
    'crisis_prevention_watch',
    'resource_balance_watch',
    'recovery_momentum',
    'operation_era_hint',
    'post_pilot_next_scope',
    'generic_city_preparation',
    'fallback',
  ] as const) {
    record(assert(checks, TOMORROW_RISK_KINDS.includes(kind), `kind ${kind}`));
  }

  const carryOver = buildTomorrowRiskModel({
    day: 3,
    carryOver: {
      summary: 'Sanayi rota baskısı yarın izleme notunda kalıyor.',
      domain: 'route',
      visible: true,
    },
  });
  record(assert(checks, carryOver?.sourceSignals.includes('carry_over') === true, 'carryOver risk üretir'));
  record(assert(checks, carryOver?.priority === 'high', 'carryOver en güçlü sinyal'));

  const operationSignal = buildTomorrowRiskModel({
    day: 4,
    operationSignals: {
      vehicles: { status: 'watch', summary: 'Araç yükü yarın rota planında izlenmeli.' },
    },
  });
  record(assert(checks, operationSignal?.sourceSignals.includes('operation_signals') === true, 'operationSignals risk üretir'));

  const resourceFatigue = buildTomorrowRiskModel({
    day: 4,
    resourceFatigue: { standard_truck: { state: 'tired', note: 'vehicle fatigue' } },
  });
  record(assert(checks, resourceFatigue?.sourceSignals.includes('resource_fatigue') === true, 'resourceFatigue watch üretir'));

  const districtTrust = buildTomorrowRiskModel({
    day: 5,
    districtTrustRuntime: { cumhuriyet: { state: 'fragile' } },
  });
  record(assert(checks, districtTrust?.kind === 'district_trust_watch', 'districtTrust watch üretir'));

  const recovery = buildTomorrowRiskModel({
    day: 5,
    socialPulse: { globalPulseScore: 68, previousGlobalPulseScore: 60 },
  });
  record(assert(checks, recovery?.kind === 'recovery_momentum', 'social recovery momentum üretir'));

  const day1 = buildTomorrowRiskModel({
    day: 1,
    operationSignals: {
      overall: { status: 'critical', summary: 'Ağır risk dili olmamalı.' },
    },
  });
  record(assert(checks, day1 == null, 'Day 1 ağır risk dili göstermez'));

  const day7 = buildTomorrowRiskModel({
    day: 7,
    postPilotOperation: { phase: 'pilot_complete_idle' },
  });
  record(assert(checks, day7?.kind === 'post_pilot_next_scope', 'Day 7 post-pilot geçiş dili'));

  const day8 = buildTomorrowRiskModel({
    day: 8,
    postPilotOperation: { phase: 'main_operation_light' },
  });
  record(assert(checks, day8?.kind === 'operation_era_hint', 'Day 8+ operation context'));

  const fallback = buildTomorrowRiskModel({ day: 4 });
  record(assert(checks, fallback?.kind === 'generic_city_preparation', 'fallback üretilebilir'));

  const cta = buildOneMoreDayCta(operationSignal, 4);
  record(assert(checks, !containsForbiddenCta(cta), 'One More Day CTA FOMO içermez'));
  record(assert(checks, !containsForbiddenCta(carryOver?.ctaLine), 'forbidden words yok'));

  const reportPresentation = buildTomorrowRiskPresentation({
    day: 4,
    operationSignals: {
      containers: { status: 'watch', summary: 'Konteyner çevresi yarın izlenmeli.' },
    },
  });
  record(assert(checks, reportPresentation.report?.shouldShowInReport === true, 'Report integration helper var'));

  const hubPresentation = buildTomorrowRiskPresentation({
    day: 8,
    postPilotOperation: { phase: 'main_operation_light' },
  });
  record(assert(checks, hubPresentation.hub?.shouldShowInHub === true, 'Hub compact integration helper var'));

  const duplicate = buildTomorrowRiskModel({
    day: 3,
    carryOver: { summary: 'Aynı bilgi tekrar etmesin.', visible: true },
  });
  record(assert(checks, isTomorrowRiskDuplicate(duplicate, ['Aynı bilgi tekrar etmesin.']), 'Duplicate guard çalışır'));

  record(assert(checks, (operationSignal?.maxVisibleLines ?? 99) <= 3, 'max visible line kuralları var'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION değişmedi', 'SAVE_VERSION değişti'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('tomorrowRisk'), 'applyDecision değişmedi'));
  record(assert(checks, !readRepo('src/core/game/generateDailyEventSet.ts').includes('tomorrowRisk'), 'event generation değişmedi'));
  record(assert(checks, readRepo('package.json').includes('verify:tomorrow-risk'), 'package.json script var'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-tomorrow-risk-card.md')), 'docs var'));
  record(assert(checks, readRepo('src/features/reports/components/ReportTomorrowRiskCard.tsx').includes('numberOfLines'), 'Report UI line guard'));
  record(assert(checks, readRepo('src/features/hub/components/HubTomorrowRiskStrip.tsx').includes('numberOfLines'), 'Hub UI line guard'));

  return { ok, checks };
}
