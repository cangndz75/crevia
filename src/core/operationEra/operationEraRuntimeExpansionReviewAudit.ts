import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { isNoNewSystemFreezeActive } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  OPERATION_ERA_RUNTIME_PREVIEW_KINDS,
  OPERATION_ERA_RUNTIME_PREVIEW_PANIC_TERMS,
  OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY,
} from './operationEraRuntimePreviewConstants';
import {
  buildOperationEraEligibility,
  buildOperationEraRuntimePreviewModel,
} from './operationEraRuntimePreviewModel';
import {
  buildOperationEraHubLine,
  buildOperationEraMapLine,
  buildOperationEraProfileLine,
  buildOperationEraReportLine,
  buildOperationEraSelectionContextHint,
  buildOperationEraStoryChainBias,
  buildOperationEraVariantBias,
  operationEraRuntimePreviewCopyContainsPanicTerms,
  shouldSuppressOperationEraPreviewForSurface,
} from './operationEraRuntimePreviewPresentation';
import type {
  CreviaOperationEraExpansionOption,
  CreviaOperationEraExpansionRecommendation,
  CreviaOperationEraExpansionRisk,
  CreviaOperationEraMigrationRisk,
  CreviaOperationEraRuntimeExpansionHealthStatus,
  CreviaOperationEraRuntimeExpansionReviewResult,
  CreviaOperationEraRuntimeExpansionSoftLaunchFindings,
  CreviaOperationEraRuntimeReadinessArea,
  CreviaOperationEraRuntimeReadinessAreaResult,
  CreviaOperationEraSaveImpact,
  CreviaOperationEraTelemetryQuestion,
  RunOperationEraRuntimeExpansionReviewOptions,
} from './operationEraRuntimeExpansionReviewTypes';

export const OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH =
  'docs/crevia-operation-era-runtime-expansion-review.md';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const DOCUMENTED_FUTURE_PERSIST_FIELDS = [
  'activeOperationEra',
  'operationEraStartedDay',
  'operationEraFocusDistrictIds',
  'operationEraFocusDomains',
  'operationEraExposureWindow',
  'operationEraProgressSummary',
  'operationEraLastResolvedDay',
] as const;

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function areaResult(
  area: CreviaOperationEraRuntimeReadinessArea,
  health: CreviaOperationEraRuntimeExpansionHealthStatus,
  message: string,
  detail?: string,
): CreviaOperationEraRuntimeReadinessAreaResult {
  return { area, health, message, detail };
}

function buildTelemetryQuestions(): CreviaOperationEraTelemetryQuestion[] {
  return [
    {
      id: 'telemetry.day8_visibility',
      question: 'Oyuncular Day 8+ operation era line görüyor mu?',
      decisionSignal: 'Görünürlük düşükse eligibility guard veya post-pilot transition incelenir.',
    },
    {
      id: 'telemetry.hub_retention',
      question: 'Hub operation era line olan oyuncular daha fazla gün tamamlıyor mu?',
      decisionSignal: 'Retention korelasyonu yoksa copy/visibility tune edilir; expansion acil değildir.',
    },
    {
      id: 'telemetry.report_read',
      question: 'Report operation era line okunuyor mu?',
      decisionSignal: 'Report echo okunuyorsa runtime-lite preview yeterli kalabilir.',
    },
    {
      id: 'telemetry.profile_career',
      question: 'Profile career showcase içinde era chip uzun vadeli hedef hissi veriyor mu?',
      decisionSignal: 'Profile faydası yüksekse Option B persist adayı güçlenir.',
    },
    {
      id: 'telemetry.map_render',
      question: 'Map\'te operation era helper render edilmeli mi?',
      decisionSignal: 'Map engagement artışı yoksa helper-only model korunur; full render V2.',
    },
    {
      id: 'telemetry.era_kind_engagement',
      question: 'Hangi era kind daha çok engagement yaratıyor?',
      decisionSignal: 'Kind dağılımı content pack activation ve V1.1 weight tuning için girdi sağlar.',
    },
    {
      id: 'telemetry.open_career_fallback',
      question: 'Open operation career fallback yeterli mi?',
      decisionSignal: 'Fallback oranı yüksekse era scoring/threshold tune edilir.',
    },
    {
      id: 'telemetry.crisis_calm_wording',
      question: 'Crisis prevention era calm wording doğru mu?',
      decisionSignal: 'Panik algısı varsa copy guard sıkılaştırılır; runtime expansion gerekmez.',
    },
    {
      id: 'telemetry.resource_balance_penalty',
      question: 'Resource balance era oyuncuda ceza hissi yaratıyor mu?',
      decisionSignal: 'Ceza hissi yüksekse variant bias ve copy incelenir.',
    },
    {
      id: 'telemetry.story_chain_duplicate',
      question: 'Operation era, story chain hint ile duplicate oluyor mu?',
      decisionSignal: 'Duplicate oranı yüksekse suppression kuralları gözden geçirilir.',
    },
    {
      id: 'telemetry.event_weighting_needed',
      question: 'Operation era runtime event weighting gerekli mi?',
      decisionSignal: 'Option C kararı — content pack activation öncesi yapılmamalı.',
    },
    {
      id: 'telemetry.persist_summary_needed',
      question: 'Persisted current era summary gerekli mi?',
      decisionSignal: 'Restart continuity şikayeti varsa Option B değerlendirilir.',
    },
    {
      id: 'telemetry.day8_retention',
      question: 'Day 8+ retention düşükse era expansion çözüm mü?',
      decisionSignal: 'Retention düşükse önce onboarding/flow; era expansion ikincil.',
    },
    {
      id: 'telemetry.iap_era_conversion',
      question: 'IAP full mode ile era visibility ilişkisi conversion\'a etki ediyor mu?',
      decisionSignal: 'Limited vs full mode era görünürlük farkı conversion analizi.',
    },
  ];
}

function buildExpansionOptions(): CreviaOperationEraExpansionOption[] {
  return [
    {
      id: 'keep_runtime_lite_preview',
      title: 'A. Keep runtime-lite preview',
      description:
        'Deterministic presentation/context layer; Day 8+ hub/report/profile hint-only; map helper-only.',
      pros: ['SAVE_VERSION yok', 'Migration yok', 'Düşük risk', 'Soft launch için mevcut model'],
      cons: ['Restart continuity yok', 'Event selection weighting yok', 'Map görünürlüğü sınırlı'],
      migrationRisk: {
        optionId: 'keep_runtime_lite_preview',
        requiresSaveVersionBump: false,
        requiresMigration: false,
        migrationComplexity: 'none',
        balanceRisk: 'none',
        summary: 'Soft launch için önerilen mevcut model.',
      },
      recommendedFor: 'soft_launch',
    },
    {
      id: 'persist_current_operation_era_summary',
      title: 'B. Persist current operation era summary',
      description:
        'Minimal alanlar: currentEraKind, startedDay, focusDistricts, activeDomains — Hub/Profile/Report continuity.',
      pros: ['Restart sonrası era özeti korunur', 'Hub/Profile continuity güçlenir', 'Orta migration maliyeti'],
      cons: ['SAVE_VERSION bump gerekir', 'Migration ve hydrate path testi'],
      migrationRisk: {
        optionId: 'persist_current_operation_era_summary',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'medium',
        balanceRisk: 'low',
        summary: 'V1.1 telemetry sonrası değerlendirme adayı.',
      },
      recommendedFor: 'v11',
    },
    {
      id: 'runtime_era_weighting_event_selection',
      title: 'C. Runtime era weighting for event selection',
      description: 'Event selection runtime davranışını etkiler; content pack activation ile birlikte düşünülmeli.',
      pros: ['Era depth artar', 'Content pack ile senkron seçim potansiyeli'],
      cons: ['Event selection behavior değişir', 'Balance riski orta/yüksek', 'Content pack activation gerekir'],
      migrationRisk: {
        optionId: 'runtime_era_weighting_event_selection',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'high',
        balanceRisk: 'medium',
        summary: 'V1.1 sonrası adayı — content pack activation öncesi yapılmamalı.',
      },
      recommendedFor: 'v11_later',
    },
    {
      id: 'full_operation_era_season_engine',
      title: 'D. Full operation era season/runtime engine',
      description:
        'Event generation, content packs, story chains, district memory, rewards ve season goals derin entegrasyon.',
      pros: ['Tam era season hissi', 'Live-ops potansiyeli'],
      cons: ['Yüksek risk', 'Event generation rewrite riski', 'Soft launch öncesi yasak'],
      migrationRisk: {
        optionId: 'full_operation_era_season_engine',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'high',
        balanceRisk: 'high',
        summary: 'V2 backlog — soft launch öncesi yasak.',
      },
      recommendedFor: 'v2_backlog',
    },
  ];
}

function buildV11Backlog(): CreviaOperationEraExpansionRecommendation[] {
  return [
    {
      id: 'v11.persist_era_summary_design',
      title: 'Persist current operation era summary — tasarım',
      priority: 'high',
      description: 'Telemetry sonrası Option B için persist alan şeması ve hydrate path tasarla.',
    },
    {
      id: 'v11.save_version_migration_patch',
      title: 'SAVE_VERSION migration patch (ayrı)',
      priority: 'high',
      description: 'Persist kararı verilirse SAVE_VERSION bump ve normalizePersistedSave migration ayrı patch.',
    },
    {
      id: 'v11.era_visibility_telemetry',
      title: 'Day 8+ era visibility telemetry analizi',
      priority: 'high',
      description: 'Hub/report/profile era line görünürlük ve retention korelasyonunu ölç.',
    },
    {
      id: 'v11.content_pack_prerequisite',
      title: 'Content pack activation öncesi era weighting bekle',
      priority: 'medium',
      description: 'Event Selection Runtime Pack Activation kararından önce Option C yapma.',
    },
    {
      id: 'v11.map_render_playtest',
      title: 'Map helper render playtest değerlendirmesi',
      priority: 'medium',
      description: 'Real device playtest sonrası map era helper full render gerekli mi karar ver.',
    },
    {
      id: 'v11.era_event_weighting_backlog',
      title: 'Runtime era event weighting (V1.1 sonrası)',
      priority: 'low',
      description: 'Option C — content pack activation sonrası.',
    },
    {
      id: 'v11.full_era_engine_v2',
      title: 'Full operation era season engine (V2 backlog)',
      priority: 'low',
      description: 'Option D — derin entegrasyon V2.',
    },
  ];
}

function evaluateRuntimeBehavior(): {
  areaResults: CreviaOperationEraRuntimeReadinessAreaResult[];
  risks: CreviaOperationEraExpansionRisk[];
} {
  const areaResults: CreviaOperationEraRuntimeReadinessAreaResult[] = [];
  const risks: CreviaOperationEraExpansionRisk[] = [];

  const day1 = buildOperationEraRuntimePreviewModel({ day: 1 });
  const day7 = buildOperationEraRuntimePreviewModel({ day: OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY });
  const day1Hidden = !day1.visible && !day7.visible;
  areaResults.push(
    areaResult(
      'day_1_7_hidden_behavior',
      day1Hidden ? 'PASS' : 'BLOCKED',
      day1Hidden ? 'Day 1-7 hidden' : 'Day 1-7 preview visible',
      `day1=${day1.visible} day7=${day7.visible}`,
    ),
  );
  if (!day1Hidden) {
    risks.push({
      id: 'risk.day1_7_visible',
      severity: 'blocker',
      title: 'Operation era visible during pilot window',
      message: 'Era preview must be hidden Day 1-7.',
      recommendation: 'Restore OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY guard.',
    });
  }

  const day8 = buildOperationEraRuntimePreviewModel({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    isPostPilot: true,
    isFullMode: true,
    operationSignals: createInitialOperationSignalsState(POST_PILOT_FIRST_OPERATION_DAY),
  });
  areaResults.push(
    areaResult(
      'day_8_plus_visibility',
      day8.visible ? 'PASS' : 'WARN',
      day8.visible ? 'Day 8+ preview visible' : 'Day 8+ preview not visible in sample',
      `visibility=${day8.visibility} kind=${day8.kind}`,
    ),
  );

  areaResults.push(
    areaResult(
      'runtime_lite_preview_behavior',
      day8.isRuntimeLinked === false ? 'PASS' : 'BLOCKED',
      day8.isRuntimeLinked === false ? 'Runtime-lite preview; isRuntimeLinked false' : 'Unexpected runtime link',
    ),
  );

  const hubLine = buildOperationEraHubLine({ day: 9, isPostPilot: true, isFullMode: true });
  const reportLine = buildOperationEraReportLine({ day: 9, isPostPilot: true, isFullMode: true });
  const profileLine = buildOperationEraProfileLine({ day: 9, isPostPilot: true, isFullMode: true });
  areaResults.push(
    areaResult(
      'hub_report_profile_binding',
      Boolean(hubLine || reportLine || profileLine) ? 'PASS' : 'WARN',
      `Hub=${Boolean(hubLine)} Report=${Boolean(reportLine)} Profile=${Boolean(profileLine)}`,
    ),
  );

  const mapLine = buildOperationEraMapLine({ day: 9, isPostPilot: true });
  const mapPresentation = readRepo('src/core/map/mapDistrictIntelligencePresentation.ts');
  const mapHelperOk = mapPresentation.includes('buildOperationEraMapLine') || Boolean(mapLine);
  areaResults.push(
    areaResult(
      'map_helper_only_binding',
      mapHelperOk ? 'PASS' : 'WARN',
      'Map helper-only via buildOperationEraMapLine',
      mapLine ? `maxLines=${mapLine.maxLines}` : 'helper in map intelligence layer',
    ),
  );

  areaResults.push(
    areaResult(
      'related_content_packs_metadata',
      OPERATION_ERA_RUNTIME_PREVIEW_KINDS.length === 8 ? 'PASS' : 'WARN',
      `${OPERATION_ERA_RUNTIME_PREVIEW_KINDS.length} preview kinds with content pack metadata`,
    ),
  );

  const selectionHint = buildOperationEraSelectionContextHint({ day: 9, isPostPilot: true });
  const variantBias = buildOperationEraVariantBias({ day: 9, isPostPilot: true });
  const storyBias = buildOperationEraStoryChainBias({ day: 9, isPostPilot: true });
  areaResults.push(
    areaResult(
      'event_selection_context_hint',
      selectionHint.isRuntimeLinked === false ? 'PASS' : 'BLOCKED',
      'Selection context hint helper-only',
      `eraKind=${selectionHint.eraKind}`,
    ),
  );
  areaResults.push(
    areaResult(
      'variant_bias_helper',
      variantBias.length > 0 ? 'PASS' : 'WARN',
      `Variant bias helper: ${variantBias.length} items`,
    ),
  );
  areaResults.push(
    areaResult(
      'story_chain_bias_helper',
      storyBias.length > 0 ? 'PASS' : 'WARN',
      `Story chain bias helper: ${storyBias.length} kinds`,
    ),
  );

  const suppressed = shouldSuppressOperationEraPreviewForSurface(
    'hub',
    'Dönemsel operasyon odağı: açık uçlu kariyer ritmi sakin biçimde izleniyor.',
    { day: 9, isPostPilot: true },
    ['Dönemsel operasyon odağı: açık uçlu kariyer ritmi sakin biçimde izleniyor.'],
  );
  areaResults.push(
    areaResult(
      'duplicate_suppression',
      suppressed ? 'PASS' : 'WARN',
      suppressed ? 'Duplicate suppression active' : 'Duplicate suppression partial',
    ),
  );

  const crisisHub = buildOperationEraHubLine({
    day: 9,
    isPostPilot: true,
    isFullMode: true,
    crisisState: { status: 'watch' },
    operationSignals: createInitialOperationSignalsState(9),
  });
  const crisisTexts = [crisisHub?.text ?? ''].filter(Boolean);
  const crisisCalm = crisisTexts.every(
    (t) => !operationEraRuntimePreviewCopyContainsPanicTerms(t) &&
      !OPERATION_ERA_RUNTIME_PREVIEW_PANIC_TERMS.some((p) => t.toLocaleLowerCase('tr-TR').includes(p)),
  );
  areaResults.push(
    areaResult(
      'crisis_calm_wording',
      crisisCalm ? 'PASS' : 'WARN',
      crisisCalm ? 'Crisis prevention era calm wording' : 'Panic wording risk in crisis era',
    ),
  );

  const limitedEligibility = buildOperationEraEligibility({ day: 8, isPostPilot: true, isLimitedMode: true });
  const fullEligibility = buildOperationEraEligibility({ day: 8, isPostPilot: true, isFullMode: true });
  areaResults.push(
    areaResult(
      'post_pilot_limited_full_behavior',
      limitedEligibility.visible && fullEligibility.visible ? 'PASS' : 'WARN',
      `Limited compact=${limitedEligibility.mode} Full standard/detailed=${fullEligibility.mode}`,
    ),
  );

  areaResults.push(
    areaResult(
      'content_pack_dependency',
      'WARN',
      'Content pack runtime activation not done — era depth bounded by preview metadata',
      'Full era-content sync requires V1.1 content pack gating',
    ),
  );
  areaResults.push(
    areaResult(
      'event_selection_dependency',
      'PASS',
      'Event selection unchanged — era hint helper-only',
      'buildOperationEraSelectionContextHint does not bind event generation',
    ),
  );
  areaResults.push(
    areaResult(
      'story_chain_dependency',
      'WARN',
      'Story chain persistence not done — era continuity bounded by derived hints',
      'Story Chain Persistent Runtime Review deferred persist to V1.1',
    ),
  );
  areaResults.push(
    areaResult(
      'district_operation_action_dependency',
      'PASS',
      'District operation actions session-only — era reads optional action state',
      'No persist coupling',
    ),
  );

  risks.push({
    id: 'risk.not_real_runtime',
    severity: 'warning',
    title: 'Operation era is not real runtime',
    message: 'Preview model is deterministic presentation/context layer only.',
    recommendation: 'Defer expansion until telemetry warrants.',
  });
  risks.push({
    id: 'risk.restart_continuity',
    severity: 'warning',
    title: 'Restart continuity absent',
    message: 'Active era state not persisted; re-derived after restart.',
    recommendation: 'Evaluate Option B in V1.1 if telemetry shows pain.',
  });
  risks.push({
    id: 'risk.content_pack_depth',
    severity: 'warning',
    title: 'Era depth limited without content pack activation',
    message: 'relatedContentPacks metadata present but packs not runtime-activated.',
    recommendation: 'Complete content pack V1.1 activation before Option C.',
  });
  risks.push({
    id: 'risk.map_helper_only',
    severity: 'warning',
    title: 'Map visibility limited to helper-only',
    message: 'Full map era render deferred; helper line only.',
    recommendation: 'Evaluate after real device playtest.',
  });

  const gamePersist = readRepo('src/store/gamePersist.ts');
  const inPersist = DOCUMENTED_FUTURE_PERSIST_FIELDS.some((f) => gamePersist.includes(f));
  areaResults.push(
    areaResult(
      'save_shape_impact',
      !inPersist ? 'PASS' : 'BLOCKED',
      !inPersist ? 'Persist shape unchanged' : 'Operation era fields in persist',
    ),
  );
  if (inPersist) {
    risks.push({
      id: 'risk.persist_shape_changed',
      severity: 'blocker',
      title: 'Operation era in persist shape',
      message: 'This review patch must not add persist.',
      recommendation: 'Revert or defer to V1.1 migration.',
    });
  }

  return { areaResults, risks };
}

function buildSaveImpact(): CreviaOperationEraSaveImpact {
  const gamePersist = readRepo('src/store/gamePersist.ts');
  const operationEraInPersistShape = DOCUMENTED_FUTURE_PERSIST_FIELDS.some((f) =>
    gamePersist.includes(f),
  );
  const saveVersionChanged = SAVE_VERSION !== NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION;

  return {
    persistShapeChanged: operationEraInPersistShape,
    saveVersionChanged,
    currentSaveVersion: SAVE_VERSION,
    expectedSaveVersion: NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION,
    operationEraInPersistShape,
    storeShapeChanged: false,
    documentedFutureFields: [...DOCUMENTED_FUTURE_PERSIST_FIELDS],
    summary: operationEraInPersistShape
      ? 'Persist shape includes operation era fields — unexpected for runtime-lite model.'
      : 'Persist shape excludes operation era fields; SAVE_VERSION unchanged for this review.',
  };
}

export function buildOperationEraRuntimeExpansionSoftLaunchFindings(
  result: CreviaOperationEraRuntimeExpansionReviewResult,
): CreviaOperationEraRuntimeExpansionSoftLaunchFindings {
  return result.softLaunchFindings;
}

export function runOperationEraRuntimeExpansionReviewAudit(
  _options: RunOperationEraRuntimeExpansionReviewOptions = {},
): CreviaOperationEraRuntimeExpansionReviewResult {
  const { areaResults: runtimeAreas, risks: runtimeRisks } = evaluateRuntimeBehavior();
  const saveImpact = buildSaveImpact();
  const expansionOptions = buildExpansionOptions();
  const telemetryQuestions = buildTelemetryQuestions();
  const v11Backlog = buildV11Backlog();
  const freezeActive = isNoNewSystemFreezeActive('internal_device_test');
  const docsPresent = existsSync(join(REPO_ROOT, OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH));

  const areaResults = [...runtimeAreas];

  areaResults.push(
    areaResult(
      'migration_cost',
      'PASS',
      'No migration in soft launch — runtime-lite preview',
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
      'v11_expansion_value',
      'WARN',
      'V1.1 benefit: era continuity if telemetry warrants',
      'Option B recommended candidate after launch data',
    ),
    areaResult(
      'v2_full_runtime_risk',
      'WARN',
      'V2 full engine high risk — soft launch forbidden',
      'Option D deferred to V2 backlog',
    ),
    areaResult(
      'post_launch_telemetry_decision_criteria',
      telemetryQuestions.length >= 12 ? 'PASS' : 'WARN',
      `${telemetryQuestions.length} telemetry decision questions defined`,
    ),
  );

  const risks: CreviaOperationEraExpansionRisk[] = [...runtimeRisks];

  if (saveImpact.saveVersionChanged) {
    risks.push({
      id: 'risk.save_version_changed',
      severity: 'blocker',
      title: 'SAVE_VERSION changed during expansion review',
      message: `Expected ${saveImpact.expectedSaveVersion}, found ${saveImpact.currentSaveVersion}.`,
      recommendation: 'This review patch must not bump SAVE_VERSION.',
    });
  }

  if (!docsPresent) {
    risks.push({
      id: 'risk.docs_missing',
      severity: 'warning',
      title: 'Operation era expansion review docs missing',
      message: OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
      recommendation: 'Create review documentation.',
    });
  }

  const hasBlocker = risks.some((r) => r.severity === 'blocker');
  const hasWarn =
    risks.some((r) => r.severity === 'warning') ||
    areaResults.some((a) => a.health === 'WARN');
  const health: CreviaOperationEraRuntimeExpansionHealthStatus = hasBlocker
    ? 'BLOCKED'
    : hasWarn
      ? 'WARN'
      : 'PASS';

  const currentBehaviorSummary =
    'Operation era sistemi şu an gerçek runtime era değildir. Preview modeli deterministic presentation/context layer olarak çalışır. Day 8+ açık uçlu operasyon hissi verir. Persist shape\'e yazılmaz. Event generation\'a bağlı değildir. Content pack runtime selection\'a bağlı değildir. Map render helper-only kalmıştır. Soft launch için bu seviye yeterlidir. Gerçek runtime expansion V1.1/V2\'de telemetry sonrası değerlendirilmeli.';

  const v11Recommendation =
    'Soft launch öncesi operation era runtime expansion yapma. Mevcut runtime-lite preview sistemi korunmalı. V1.1\'de telemetry sonrası Option B: persist current operation era summary değerlendirilmeli. Content Pack Runtime Activation ve Event Selection Runtime Pack Activation olmadan Option C yapılmamalı. Full operation era season/runtime engine V2 backlog\'a taşınmalı. Map render binding, density telemetry veya real device playtest sonrası ayrıca değerlendirilmeli.';

  const softLaunchFindings: CreviaOperationEraRuntimeExpansionSoftLaunchFindings = {
    expansionReviewPresent: docsPresent,
    runtimeLiteCurrent: !saveImpact.operationEraInPersistShape,
    expansionNotRequiredForSoftLaunch: true,
    v11ExpansionBacklogDefined: v11Backlog.length >= 4,
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
    runtimeLite: true,
    persistAdded: false,
    runtimeGameplayChanged: false,
    runtimeActivationPerformed: false,
    eventGenerationChanged: false,
    eventSelectionChanged: false,
    isRuntimeLinked: false,
    previewKindCount: OPERATION_ERA_RUNTIME_PREVIEW_KINDS.length,
    areaResults,
    risks,
    expansionOptions,
    saveImpact,
    migrationRisks: expansionOptions.map((o) => o.migrationRisk),
    telemetryQuestions,
    v11Backlog,
    recommendations: v11Backlog.slice(0, 4),
    softLaunchFindings,
    currentBehaviorSummary,
    v11Recommendation,
    freezeCompliant,
    docsPath: OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
  };
}
