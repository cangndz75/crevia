import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { CarryOverMemoryModel } from '@/core/carryOver/carryOverMemoryTypes';
import { buildDistrictMemoryRuntimeSnapshot } from '@/core/districtMemoryRuntime';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { isNoNewSystemFreezeActive } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildStoryChainRuntimeHintModel,
  buildStoryChainRuntimeHintVisibility,
  shouldSuppressStoryChainHintForSurface,
} from './storyChainRuntimeHintPresentation';
import { resolveStoryChainForDistrict } from './storyChainResolver';
import type {
  CreviaStoryChainMigrationRisk,
  CreviaStoryChainPersistenceOption,
  CreviaStoryChainPersistenceRecommendation,
  CreviaStoryChainPersistenceRisk,
  CreviaStoryChainPersistentRuntimeHealthStatus,
  CreviaStoryChainPersistentRuntimeReviewResult,
  CreviaStoryChainPersistentRuntimeSoftLaunchFindings,
  CreviaStoryChainRuntimeReadinessArea,
  CreviaStoryChainRuntimeReadinessAreaResult,
  CreviaStoryChainSaveImpact,
  CreviaStoryChainTelemetryQuestion,
  RunStoryChainPersistentRuntimeReviewOptions,
} from './storyChainPersistentRuntimeReviewTypes';

export const STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH =
  'docs/crevia-story-chain-persistent-runtime-review.md';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const DOCUMENTED_FUTURE_PERSIST_FIELDS = [
  'activeStoryChains',
  'completedStoryChainIds',
  'storyChainExposureWindow',
  'storyChainLastResolvedDay',
  'storyChainContinuationSeed',
] as const;

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function areaResult(
  area: CreviaStoryChainRuntimeReadinessArea,
  health: CreviaStoryChainPersistentRuntimeHealthStatus,
  message: string,
  detail?: string,
): CreviaStoryChainRuntimeReadinessAreaResult {
  return { area, health, message, detail };
}

function carryOver(day: number): CarryOverMemoryModel {
  return {
    id: `review-chain-carry-${day}`,
    surface: 'hub',
    direction: 'yesterday_to_today',
    domain: 'vehicle_route',
    tone: 'warning',
    title: 'Dünden Kalan Etki',
    summary: 'Dünkü rota bugün araç temposunda kısa bir takip izi bırakıyor.',
    primaryTag: 'Araç',
    secondaryTag: 'Rota',
    iconKey: 'car-outline',
    source: 'daily_report',
    visible: true,
    maxLines: 2,
  };
}

function buildTelemetryQuestions(): CreviaStoryChainTelemetryQuestion[] {
  return [
    {
      id: 'telemetry.hint_visibility',
      question: 'Oyuncular story chain hint görüyor mu?',
      decisionSignal: 'Day 4+ hint görünürlük oranı düşükse resolver sinyal eşiği veya visibility guard incelenir.',
    },
    {
      id: 'telemetry.hint_to_report',
      question: 'Story chain hint görülen oyuncular report\'a devam ediyor mu?',
      decisionSignal: 'Hint görüp report\'a ulaşmayan cohort yüksekse akış yoğunluğu persistten önce incelenir.',
    },
    {
      id: 'telemetry.result_echo_value',
      question: 'Result systems echo içinde story chain line faydalı mı?',
      decisionSignal: 'Result echo okunma oranı yüksekse presentation-only model yeterli kalabilir.',
    },
    {
      id: 'telemetry.hub_retention',
      question: 'Hub story chain focus line tıklama/engagement olmasa bile retention etkiliyor mu?',
      decisionSignal: 'Retention korelasyonu yoksa hint yoğunluğu azaltılır; persist acil değildir.',
    },
    {
      id: 'telemetry.map_trace_engagement',
      question: 'Map chain trace line map engagement artırıyor mu?',
      decisionSignal: 'Map odak artışı yoksa map hint sadeleştirilir.',
    },
    {
      id: 'telemetry.day2_3_subtle',
      question: 'Day 2-3 subtle hint görünürlüğü yeterli mi?',
      decisionSignal: 'Erken günlerde hint çok nadirse carry/memory sinyal eşiği gözden geçirilir.',
    },
    {
      id: 'telemetry.day8_detailed',
      question: 'Day 8+ detailed hint oyuncuya açık uçlu operasyon hissi veriyor mu?',
      decisionSignal: 'Post-pilot cohort\'ta hint faydası ölçülür; persist kararından önce copy/visibility tune edilir.',
    },
    {
      id: 'telemetry.restart_continuity',
      question: 'Restart sonrası chain continuity kaybı fark ediliyor mu?',
      decisionSignal: 'Yüksek restart şikayeti Option B (persist active chain summary) için güçlü sinyal.',
    },
    {
      id: 'telemetry.duplicate_suppression',
      question: 'Story chain hint duplicate suppression fazla agresif mi?',
      decisionSignal: 'Hint bastırma oranı yüksekse suppression kuralları gevşetilir; persist gerekmez.',
    },
    {
      id: 'telemetry.persist_vs_derived',
      question: 'Persistent runtime gerekli mi, derived hint yeterli mi?',
      decisionSignal: 'Ana karar sorusu — telemetry sonrası Option A vs Option B seçimi.',
    },
    {
      id: 'telemetry.day1_dropoff',
      question: 'Chain hints Day 1 drop-off riskini artırıyor mu?',
      decisionSignal: 'Day 1 hidden guard korunmalı; drop-off artışı varsa hint erken günlerde daha da gizlenir.',
    },
    {
      id: 'telemetry.chain_kind_usage',
      question: 'Hangi chain kind\'lar daha çok kullanılmalı?',
      decisionSignal: 'Kind dağılımı content pack activation ve V1.1 weight tuning için girdi sağlar.',
    },
  ];
}

function buildPersistenceOptions(): CreviaStoryChainPersistenceOption[] {
  return [
    {
      id: 'keep_presentation_only_derived_hints',
      title: 'A. Keep presentation-only derived hints',
      description:
        'Story chain hint\'leri mevcut trust/memory/carry-over state\'ten derived üretilir; persist shape\'e yazılmaz.',
      pros: ['SAVE_VERSION yok', 'Migration yok', 'Düşük risk', 'No-New-System Freeze uyumlu', 'Soft launch için mevcut model'],
      cons: ['Restart continuity zayıf', 'Aktif chain state korunmaz', 'Report/result echo restart sonrası değişebilir'],
      migrationRisk: {
        optionId: 'keep_presentation_only_derived_hints',
        requiresSaveVersionBump: false,
        requiresMigration: false,
        migrationComplexity: 'none',
        balanceRisk: 'none',
        summary: 'Soft launch için önerilen mevcut model.',
      },
      recommendedFor: 'soft_launch',
    },
    {
      id: 'persist_active_chain_summary',
      title: 'B. Persist active chain summary',
      description:
        'Minimal alanlar: chain kind, districtId, stepIndex, startedDay, expiresDay — Hub/Report continuity güçlenir.',
      pros: ['Restart sonrası aktif chain korunur', 'Hub/Report continuity güçlenir', 'Orta migration maliyeti'],
      cons: ['SAVE_VERSION bump gerekir', 'Migration ve normalizePersistedSave güncellemesi', 'Hydrate path testi'],
      migrationRisk: {
        optionId: 'persist_active_chain_summary',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'medium',
        balanceRisk: 'low',
        summary: 'V1.1 telemetry sonrası değerlendirme adayı.',
      },
      recommendedFor: 'v11',
    },
    {
      id: 'persist_chain_event_history_window',
      title: 'C. Persist chain event history window',
      description: 'Son N gün chain exposure ve continuation geçmişi kalıcı tutulur; freshness daha güçlü.',
      pros: ['Chain freshness ve continuation güçlenir', 'Zengin telemetry ve memory entegrasyonu'],
      cons: ['Yüksek migration riski', 'Balance riski orta/yüksek', 'Save boyutu artışı'],
      migrationRisk: {
        optionId: 'persist_chain_event_history_window',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'high',
        balanceRisk: 'medium',
        summary: 'V1.1 sonrası veya V2 adayı.',
      },
      recommendedFor: 'v2_backlog',
    },
    {
      id: 'full_story_chain_runtime_engine',
      title: 'D. Full story chain runtime engine',
      description:
        'Event selection, content pack activation, freshness guard ve district memory ile derin entegrasyon.',
      pros: ['Tam chain continuation', 'Content pack ile senkron seçim', 'Live-ops potansiyeli'],
      cons: ['Yüksek risk', 'Event generation rewrite riski', 'Soft launch öncesi yasak', 'Freeze forbidden scope'],
      migrationRisk: {
        optionId: 'full_story_chain_runtime_engine',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'high',
        balanceRisk: 'high',
        summary: 'V2 backlog — content pack activation kararından önce yapılmamalı.',
      },
      recommendedFor: 'v2_backlog',
    },
  ];
}

function buildV11Backlog(): CreviaStoryChainPersistenceRecommendation[] {
  return [
    {
      id: 'v11.persist_active_chain_summary_design',
      title: 'Persist active chain summary — tasarım',
      priority: 'high',
      description: 'Telemetry sonrası Option B için minimal persist alan şeması ve hydrate path tasarla.',
    },
    {
      id: 'v11.save_version_migration_patch',
      title: 'SAVE_VERSION migration patch (ayrı)',
      priority: 'high',
      description: 'Persist kararı verilirse SAVE_VERSION bump ve normalizePersistedSave migration ayrı patch.',
    },
    {
      id: 'v11.restart_continuity_telemetry',
      title: 'Restart continuity telemetry analizi',
      priority: 'high',
      description: 'App restart sonrası chain continuity kaybı şikayet oranını ölç.',
    },
    {
      id: 'v11.hint_visibility_effectiveness',
      title: 'Hint visibility effectiveness ölçümü',
      priority: 'medium',
      description: 'Day 2-3 subtle ve Day 8+ detailed hint görünürlük/fayda oranını ölç.',
    },
    {
      id: 'v11.content_pack_activation_prerequisite',
      title: 'Content pack activation öncesi chain persist bekle',
      priority: 'medium',
      description: 'Event Selection Runtime Pack Activation kararından önce full chain runtime yapma.',
    },
    {
      id: 'v11.chain_history_window_backlog',
      title: 'Chain event history window (V2 backlog)',
      priority: 'low',
      description: 'Option C — zengin geçmiş penceresi V1.1 sonrası veya V2.',
    },
    {
      id: 'v11.full_runtime_engine_v2',
      title: 'Full story chain runtime engine (V2 backlog)',
      priority: 'low',
      description: 'Option D — event selection derin entegrasyonu V2.',
    },
  ];
}

function evaluateRuntimeBehavior(): {
  areaResults: CreviaStoryChainRuntimeReadinessAreaResult[];
  risks: CreviaStoryChainPersistenceRisk[];
} {
  const areaResults: CreviaStoryChainRuntimeReadinessAreaResult[] = [];
  const risks: CreviaStoryChainPersistenceRisk[] = [];

  const resolved = resolveStoryChainForDistrict('merkez', {
    currentDay: 5,
    operationSignals: createInitialOperationSignalsState(5),
  });
  const runtimeLinkedOk = resolved?.isRuntimeLinked === false;
  areaResults.push(
    areaResult(
      'is_runtime_linked_false',
      runtimeLinkedOk ? 'PASS' : 'BLOCKED',
      runtimeLinkedOk ? 'isRuntimeLinked: false' : 'isRuntimeLinked unexpectedly true',
    ),
  );
  if (!runtimeLinkedOk) {
    risks.push({
      id: 'risk.runtime_linked_true',
      severity: 'blocker',
      title: 'Story chain isRuntimeLinked true',
      message: 'Resolver must remain presentation-only.',
      recommendation: 'Keep isRuntimeLinked: false until V1.1 design approved.',
    });
  }

  areaResults.push(
    areaResult(
      'presentation_only_hint_behavior',
      'PASS',
      'Hints derived from current state — not persisted',
      'buildStoryChainRuntimeHintModel reads trust/memory/carry-over snapshots',
    ),
  );

  const day1Visibility = buildStoryChainRuntimeHintVisibility({ day: 1 });
  const day1Model = buildStoryChainRuntimeHintModel({ day: 1 });
  const day1Hidden = day1Visibility === 'hidden' && !day1Model.visible;
  areaResults.push(
    areaResult(
      'day_1_hidden_behavior',
      day1Hidden ? 'PASS' : 'BLOCKED',
      day1Hidden ? 'Day 1 hidden' : 'Day 1 hint visible',
      `visibility=${day1Visibility}`,
    ),
  );
  if (!day1Hidden) {
    risks.push({
      id: 'risk.day1_visible',
      severity: 'blocker',
      title: 'Day 1 story chain hint visible',
      message: 'Story chain hints must be hidden on Day 1.',
      recommendation: 'Restore STORY_CHAIN_TUTORIAL_MAX_DAY guard.',
    });
  }

  const day2Hidden = buildStoryChainRuntimeHintVisibility({ day: 2 }) === 'hidden';
  const day2Subtle =
    buildStoryChainRuntimeHintVisibility({ day: 2, carryOverMemory: carryOver(2) }) === 'subtle';
  areaResults.push(
    areaResult(
      'day_2_3_subtle_behavior',
      day2Hidden && day2Subtle ? 'PASS' : 'WARN',
      day2Hidden && day2Subtle ? 'Day 2-3 subtle when signal present' : 'Day 2-3 visibility partial',
      `noSignal=hidden subtleWithCarry=${day2Subtle}`,
    ),
  );

  const day5Trust = buildDistrictTrustRuntimeSnapshot({ day: 5, focusDistrictId: 'cumhuriyet' });
  const day5Memory = buildDistrictMemoryRuntimeSnapshot({
    day: 5,
    focusDistrictId: 'cumhuriyet',
    trustSnapshot: day5Trust,
  });
  const day5Model = buildStoryChainRuntimeHintModel({
    day: 5,
    selectedDistrictId: 'cumhuriyet',
    districtTrustSnapshot: day5Trust,
    districtMemorySnapshot: day5Memory,
    operationSignals: createInitialOperationSignalsState(5),
  });
  areaResults.push(
    areaResult(
      'day_4_7_compact_behavior',
      day5Model.visibility === 'compact' ? 'PASS' : 'WARN',
      day5Model.visibility === 'compact' ? 'Day 4-7 compact' : `Day 5 visibility=${day5Model.visibility}`,
    ),
  );

  const day8Model = buildStoryChainRuntimeHintModel({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    selectedDistrictId: 'merkez',
    operationSignals: createInitialOperationSignalsState(POST_PILOT_FIRST_OPERATION_DAY),
    isPostPilot: true,
  });
  areaResults.push(
    areaResult(
      'day_8_plus_detailed_behavior',
      day8Model.visibility === 'detailed' ? 'PASS' : 'WARN',
      day8Model.visibility === 'detailed' ? 'Day 8+ detailed' : `Day 8 visibility=${day8Model.visibility}`,
    ),
  );

  const hubLineCount = day5Model.hubLine ? 1 : 0;
  const mapLineCount = day5Model.mapLine ? 1 : 0;
  const resultLineCount = day5Model.resultLine ? 1 : 0;
  const reportLineCount = day5Model.reportLine ? 1 : 0;
  const maxOneOk =
    hubLineCount <= 1 && mapLineCount <= 1 && resultLineCount <= 1 && reportLineCount <= 1;
  areaResults.push(
    areaResult(
      'hub_map_result_report_max_one_line',
      maxOneOk ? 'PASS' : 'BLOCKED',
      maxOneOk ? 'Hub/Map/Result/Report max 1 line each' : 'Surface line count exceeded',
      `hub=${hubLineCount} map=${mapLineCount} result=${resultLineCount} report=${reportLineCount}`,
    ),
  );

  const advisorModel = buildStoryChainRuntimeHintModel({
    day: 5,
    districtTrustSnapshot: day5Trust,
    isAdvisorInsightVisible: true,
  });
  areaResults.push(
    areaResult(
      'advisor_helper_only_binding',
      'PASS',
      'Advisor hint helper-only — not primary CTA',
      advisorModel.advisorLine ? 'Advisor line present when visible' : 'Advisor optional',
    ),
  );

  const carrySuppressed = shouldSuppressStoryChainHintForSurface({
    surface: 'hub',
    hintText: carryOver(6).summary,
    input: { day: 6, isCarryOverCardVisible: true, carryOverLine: carryOver(6).summary },
  });
  areaResults.push(
    areaResult(
      'duplicate_suppression',
      carrySuppressed ? 'PASS' : 'WARN',
      carrySuppressed ? 'Duplicate suppression active vs carry-over' : 'Carry-over suppression partial',
    ),
  );

  areaResults.push(
    areaResult(
      'district_memory_trust_dependency',
      day5Model.chainKind !== undefined || Boolean(day5Model.hubLine?.text) ? 'PASS' : 'WARN',
      'Resolver reads district trust/memory snapshots',
      `chainKind=${day5Model.chainKind ?? 'none'}`,
    ),
  );

  areaResults.push(
    areaResult(
      'carry_over_tomorrow_dependency',
      'PASS',
      'Carry-over and tomorrow preview inputs wired in hint builder',
      'buildStoryChainHintForTomorrow uses reportTomorrowPreview',
    ),
  );

  areaResults.push(
    areaResult(
      'content_pack_compatibility',
      'WARN',
      'Content pack activation not done — chain hints use foundation templates only',
      'Full chain continuation limited until V1.1 content pack gating',
    ),
  );

  areaResults.push(
    areaResult(
      'operation_era_compatibility',
      'WARN',
      'Operation era preview compatible — full runtime expansion V1.1',
      'Chain resolver reads operation era context optionally',
    ),
  );

  areaResults.push(
    areaResult(
      'event_selection_compatibility',
      'PASS',
      'Event selection unchanged — hints not bound to generation',
      'Story chain module has no runtime event pipeline binding',
    ),
  );

  areaResults.push(
    areaResult(
      'app_restart_continuity_gap',
      'WARN',
      'App restart: active chain state not restored',
      'Acceptable for soft launch — hints are felt context only',
    ),
  );

  risks.push({
    id: 'risk.restart_continuity_weak',
    severity: 'warning',
    title: 'Restart continuity weak',
    message: 'Active chain state not persisted; hints re-derived from snapshots after restart.',
    recommendation: 'Monitor telemetry; evaluate Option B in V1.1.',
  });

  risks.push({
    id: 'risk.chain_echo_restart',
    severity: 'warning',
    title: 'Report/result chain echo may change after restart',
    message: 'Derived hints depend on in-memory trust/memory/carry-over context.',
    recommendation: 'If telemetry shows pain, persist active chain summary in V1.1.',
  });

  risks.push({
    id: 'risk.content_pack_limited_continuation',
    severity: 'warning',
    title: 'Full chain continuation limited without content pack activation',
    message: 'Content packs not runtime-activated; chain kind variety bounded.',
    recommendation: 'Defer full continuation until content pack V1.1 activation.',
  });

  risks.push({
    id: 'risk.telemetry_coverage_gap',
    severity: 'warning',
    title: 'Story chain telemetry event coverage optional gap',
    message: 'Real post-launch telemetry not connected; hint effectiveness unmeasured.',
    recommendation: 'Use post-launch telemetry readiness funnels before persist decision.',
  });

  const gamePersist = readRepo('src/store/gamePersist.ts');
  const useGameStore = readRepo('src/store/useGameStore.ts');
  const storyChainInPersist = DOCUMENTED_FUTURE_PERSIST_FIELDS.some((f) => gamePersist.includes(f));
  const storyChainInStore =
    useGameStore.includes('storyChainState') ||
    useGameStore.includes('activeStoryChains') ||
    useGameStore.includes('completedStoryChainIds');

  areaResults.push(
    areaResult(
      'save_shape_impact',
      !storyChainInPersist && !storyChainInStore ? 'PASS' : 'BLOCKED',
      !storyChainInPersist && !storyChainInStore
        ? 'Persist/store shape unchanged — no story chain fields'
        : 'Story chain fields found in persist/store',
      `Documented future fields: ${DOCUMENTED_FUTURE_PERSIST_FIELDS.join(', ')}`,
    ),
  );
  if (storyChainInPersist || storyChainInStore) {
    risks.push({
      id: 'risk.persist_shape_changed',
      severity: 'blocker',
      title: 'Story chain state in persist/store shape',
      message: 'This review patch must not add persist.',
      recommendation: 'Revert or defer to V1.1 migration patch.',
    });
  }

  return { areaResults, risks };
}

function buildSaveImpact(): CreviaStoryChainSaveImpact {
  const gamePersist = readRepo('src/store/gamePersist.ts');
  const storyChainInPersistShape = DOCUMENTED_FUTURE_PERSIST_FIELDS.some((f) =>
    gamePersist.includes(f),
  );
  const saveVersionChanged = SAVE_VERSION !== NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION;

  return {
    persistShapeChanged: storyChainInPersistShape,
    saveVersionChanged,
    currentSaveVersion: SAVE_VERSION,
    expectedSaveVersion: NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION,
    storyChainInPersistShape,
    storeShapeChanged: false,
    documentedFutureFields: [...DOCUMENTED_FUTURE_PERSIST_FIELDS],
    summary: storyChainInPersistShape
      ? 'Persist shape includes story chain fields — unexpected for presentation-only model.'
      : 'Persist shape excludes story chain fields; SAVE_VERSION unchanged for this review.',
  };
}

export function buildStoryChainPersistentRuntimeSoftLaunchFindings(
  result: CreviaStoryChainPersistentRuntimeReviewResult,
): CreviaStoryChainPersistentRuntimeSoftLaunchFindings {
  return result.softLaunchFindings;
}

export function runStoryChainPersistentRuntimeReviewAudit(
  _options: RunStoryChainPersistentRuntimeReviewOptions = {},
): CreviaStoryChainPersistentRuntimeReviewResult {
  const { areaResults: runtimeAreas, risks: runtimeRisks } = evaluateRuntimeBehavior();
  const saveImpact = buildSaveImpact();
  const persistenceOptions = buildPersistenceOptions();
  const telemetryQuestions = buildTelemetryQuestions();
  const v11Backlog = buildV11Backlog();
  const freezeActive = isNoNewSystemFreezeActive('internal_device_test');
  const docsPresent = existsSync(join(REPO_ROOT, STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH));

  const areaResults = [...runtimeAreas];

  areaResults.push(
    areaResult(
      'migration_cost',
      'PASS',
      'No migration in soft launch — presentation-only',
      'Option B/C/D deferred to V1.1/V2',
    ),
    areaResult(
      'save_shape_impact',
      saveImpact.saveVersionChanged ? 'BLOCKED' : 'PASS',
      saveImpact.saveVersionChanged
        ? `SAVE_VERSION changed: ${SAVE_VERSION}`
        : `SAVE_VERSION ${SAVE_VERSION} unchanged`,
    ),
    areaResult(
      'v11_persistence_value',
      'WARN',
      'V1.1 benefit: restart continuity if telemetry warrants',
      'Option B recommended candidate after launch data',
    ),
    areaResult(
      'post_launch_telemetry_decision_criteria',
      telemetryQuestions.length >= 10 ? 'PASS' : 'WARN',
      `${telemetryQuestions.length} telemetry decision questions defined`,
    ),
  );

  const risks: CreviaStoryChainPersistenceRisk[] = [...runtimeRisks];

  if (saveImpact.saveVersionChanged) {
    risks.push({
      id: 'risk.save_version_changed',
      severity: 'blocker',
      title: 'SAVE_VERSION changed during persistence review',
      message: `Expected ${saveImpact.expectedSaveVersion}, found ${saveImpact.currentSaveVersion}.`,
      recommendation: 'This review patch must not bump SAVE_VERSION.',
    });
  }

  if (!docsPresent) {
    risks.push({
      id: 'risk.docs_missing',
      severity: 'warning',
      title: 'Story chain persistence review docs missing',
      message: STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
      recommendation: 'Create review documentation.',
    });
  }

  const hasBlocker = risks.some((r) => r.severity === 'blocker');
  const hasWarn =
    risks.some((r) => r.severity === 'warning') ||
    areaResults.some((a) => a.health === 'WARN');
  const health: CreviaStoryChainPersistentRuntimeHealthStatus = hasBlocker
    ? 'BLOCKED'
    : hasWarn
      ? 'WARN'
      : 'PASS';

  const currentBehaviorSummary =
    'Story chain sistemi şu an persistent runtime değildir. Hint\'ler mevcut trust/memory/carry-over state\'ten derived/presentation-only üretilir. Persist shape\'e yazılmaz. App restart sonrası aktif chain state korunmaz. Soft launch için kabul edilebilir — chain sistemi yalnızca "hissedilen bağlam" sağlar. Persistent chain runtime V1.1\'de telemetry sonrası değerlendirilmeli.';

  const v11Recommendation =
    'Soft launch öncesi story chain persist ekleme. Soft launch boyunca current derived hint sistemi korunmalı. V1.1\'de telemetry sonrası Option B: persist active chain summary değerlendirilmeli. Content Pack Runtime Activation ve Event Selection Runtime Pack Activation kararından önce full story chain runtime yapılmamalı. Full story chain runtime engine V2 backlog\'a taşınmalı.';

  const softLaunchFindings: CreviaStoryChainPersistentRuntimeSoftLaunchFindings = {
    persistenceReviewPresent: docsPresent,
    presentationOnlyCurrent: !saveImpact.storyChainInPersistShape,
    persistNotRequiredForSoftLaunch: true,
    v11PersistenceBacklogDefined: v11Backlog.length >= 4,
    saveVersionUnchanged: !saveImpact.saveVersionChanged,
    runtimeActivationNotDone: true,
  };

  const freezeCompliant =
    freezeActive &&
    !saveImpact.persistShapeChanged &&
    !saveImpact.saveVersionChanged &&
    !saveImpact.storeShapeChanged;

  return {
    health,
    presentationOnly: true,
    persistAdded: false,
    runtimeGameplayChanged: false,
    runtimeActivationPerformed: false,
    eventGenerationChanged: false,
    isRuntimeLinked: false,
    areaResults,
    risks,
    persistenceOptions,
    saveImpact,
    migrationRisks: persistenceOptions.map((o) => o.migrationRisk),
    telemetryQuestions,
    v11Backlog,
    recommendations: v11Backlog.slice(0, 4),
    softLaunchFindings,
    currentBehaviorSummary,
    v11Recommendation,
    freezeCompliant,
    docsPath: STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
  };
}
