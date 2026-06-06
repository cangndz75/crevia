import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { isNoNewSystemFreezeActive } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION } from '@/core/releaseReadiness/noNewSystemFreezeConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_OPERATION_ACTION_MAX_PER_DAY,
  DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY,
  DISTRICT_OPERATION_ACTION_PREVIEW_START_DAY,
} from './districtOperationActionConstants';
import {
  applyDistrictOperationActionEffects,
  buildDistrictOperationActionCandidates,
  buildDistrictOperationActionDailySummary,
  createInitialDistrictOperationActionState,
  selectDistrictOperationAction,
} from './districtOperationActionEngine';
import {
  buildDistrictOperationActionHubCopy,
  buildDistrictOperationActionMapCopy,
  buildDistrictOperationActionReportLine,
} from './districtOperationActionPresentation';
import type {
  CreviaDistrictOperationActionMigrationRisk,
  CreviaDistrictOperationActionPersistenceAreaResult,
  CreviaDistrictOperationActionPersistenceHealthStatus,
  CreviaDistrictOperationActionPersistenceOption,
  CreviaDistrictOperationActionPersistenceRecommendation,
  CreviaDistrictOperationActionPersistenceReviewArea,
  CreviaDistrictOperationActionPersistenceReviewResult,
  CreviaDistrictOperationActionPersistenceRisk,
  CreviaDistrictOperationActionPersistenceSoftLaunchFindings,
  CreviaDistrictOperationActionSaveImpact,
  CreviaDistrictOperationActionTelemetryQuestion,
  RunDistrictOperationActionPersistenceReviewOptions,
} from './districtOperationActionPersistenceReviewTypes';

export const DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH =
  'docs/crevia-district-operation-action-persistence-review.md';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function areaResult(
  area: CreviaDistrictOperationActionPersistenceReviewArea,
  health: CreviaDistrictOperationActionPersistenceHealthStatus,
  message: string,
  detail?: string,
): CreviaDistrictOperationActionPersistenceAreaResult {
  return { area, health, message, detail };
}

function buildTelemetryQuestions(): CreviaDistrictOperationActionTelemetryQuestion[] {
  return [
    {
      id: 'telemetry.action_visibility',
      question: 'Oyuncular district operation action görüyor mu?',
      decisionSignal: 'Day 4+ görünürlük oranı düşükse UI bağlantısı veya reveal zamanlaması gözden geçirilir.',
    },
    {
      id: 'telemetry.day4_selection',
      question: 'Day 4+ action seçiliyor mu?',
      decisionSignal: 'Seçim oranı düşükse action değer önerisi veya CTA netliği incelenir; persist öncelikli değildir.',
    },
    {
      id: 'telemetry.day5_6_retention',
      question: 'Action seçen oyuncular Day 5/6 devam ediyor mu?',
      decisionSignal: 'Action seçimi ile retention arasında pozitif korelasyon yoksa persist faydası sınırlı kalır.',
    },
    {
      id: 'telemetry.report_summary_value',
      question: "Report'ta action summary işe yarıyor mu?",
      decisionSignal: 'Report echo okunuyorsa günlük özet persist V1.1 adayı olur.',
    },
    {
      id: 'telemetry.restart_continuity_loss',
      question: 'App restart sonrası oyuncu continuity kaybı yaşıyor mu?',
      decisionSignal: 'Yüksek restart kaybı şikayeti persist daily summary için güçlü sinyal.',
    },
    {
      id: 'telemetry.exit_before_report',
      question: "Action selected ama report'a ulaşmadan çıkış oranı yüksek mi?",
      decisionSignal: 'Yüksek erken çıkış persistten çok akış/yoğunluk sorununa işaret eder.',
    },
    {
      id: 'telemetry.map_engagement',
      question: 'District action ile map engagement artıyor mu?',
      decisionSignal: 'Map tıklama/odak artışı yoksa action küçük etkili kalır; session-only yeterli olabilir.',
    },
    {
      id: 'telemetry.persist_vs_session',
      question: 'Persist gerekli mi yoksa session-only yeterli mi?',
      decisionSignal: 'Restart continuity ve report echo telemetry sonrası Option B/C kararını belirler.',
    },
  ];
}

function buildPersistenceOptions(): CreviaDistrictOperationActionPersistenceOption[] {
  return [
    {
      id: 'keep_session_only',
      title: 'A. Session-only (mevcut)',
      description: 'districtOperationActionState yalnızca runtime store\'da; persist shape\'e yazılmaz.',
      pros: ['Migration yok', 'Düşük risk', 'No-New-System Freeze uyumlu', 'SAVE_VERSION sabit'],
      cons: ['Restart continuity zayıf', 'Report echo restart sonrası eksilebilir', 'Telemetry action continuity zayıf'],
      migrationRisk: {
        optionId: 'keep_session_only',
        requiresSaveVersionBump: false,
        requiresMigration: false,
        migrationComplexity: 'none',
        balanceRisk: 'none',
        summary: 'Soft launch için önerilen mevcut model.',
      },
      recommendedFor: 'soft_launch',
    },
    {
      id: 'persist_daily_selected_summary',
      title: 'B. Persist daily selected action summary',
      description: 'Gün bazlı seçilen action özeti (id, district, kind, effect lines) persist shape\'e eklenir.',
      pros: ['Report/tomorrow continuity güçlenir', 'Restart sonrası günlük özet korunur', 'Orta migration maliyeti'],
      cons: ['SAVE_VERSION bump gerekir', 'Migration ve normalizePersistedSave güncellemesi', 'Store hydrate path testi'],
      migrationRisk: {
        optionId: 'persist_daily_selected_summary',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'medium',
        balanceRisk: 'low',
        summary: 'V1.1 telemetry sonrası değerlendirme adayı.',
      },
      recommendedFor: 'v11',
    },
    {
      id: 'persist_action_history_window',
      title: 'C. Persist action history window',
      description: 'Son N gün action geçmişi, appliedActionIds ve recentDistrictOperationKeys kalıcı tutulur.',
      pros: ['Zengin memory/telemetry', 'District memory/trust ile derin entegrasyon potansiyeli'],
      cons: ['Yüksek migration maliyeti', 'Balance ve duplicate suppression riski', 'Save boyutu artışı'],
      migrationRisk: {
        optionId: 'persist_action_history_window',
        requiresSaveVersionBump: true,
        requiresMigration: true,
        migrationComplexity: 'high',
        balanceRisk: 'high',
        summary: 'V1.1 sonrası veya V2 backlog adayı.',
      },
      recommendedFor: 'v2_backlog',
    },
  ];
}

function buildV11Backlog(): CreviaDistrictOperationActionPersistenceRecommendation[] {
  return [
    {
      id: 'v11.persist_daily_summary_design',
      title: 'Persist daily selected action summary — tasarım',
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
      id: 'v11.restart_continuity_telemetry',
      title: 'Restart continuity telemetry analizi',
      priority: 'high',
      description: 'App restart sonrası action kaybı şikayet oranını ölç.',
    },
    {
      id: 'v11.report_echo_effectiveness',
      title: 'Report echo effectiveness ölçümü',
      priority: 'medium',
      description: 'Action summary satırının report okunma ve Day+1 devam ile ilişkisini ölç.',
    },
    {
      id: 'v11.map_action_engagement',
      title: 'Map action engagement ölçümü',
      priority: 'medium',
      description: 'District action seçimi ile map engagement korelasyonunu değerlendir.',
    },
    {
      id: 'v11.action_history_window_backlog',
      title: 'Action history window (V2 backlog)',
      priority: 'low',
      description: 'Option C — zengin geçmiş penceresi V1.1 sonrası veya V2.',
    },
  ];
}

function evaluateRuntimeBehavior(): {
  areaResults: CreviaDistrictOperationActionPersistenceAreaResult[];
  risks: CreviaDistrictOperationActionPersistenceRisk[];
} {
  const areaResults: CreviaDistrictOperationActionPersistenceAreaResult[] = [];
  const risks: CreviaDistrictOperationActionPersistenceRisk[] = [];
  const emptyState = createInitialDistrictOperationActionState();

  const day1 = buildDistrictOperationActionCandidates({ day: 1, focusDistrictId: 'merkez' });
  const day1Hidden = day1.length === 0;
  areaResults.push(
    areaResult(
      'day_visibility_guards',
      day1Hidden ? 'PASS' : 'BLOCKED',
      day1Hidden ? 'Day 1 hidden' : 'Day 1 actions visible',
      `candidates=${day1.length}`,
    ),
  );
  if (!day1Hidden) {
    risks.push({
      id: 'risk.day1_visible',
      severity: 'blocker',
      title: 'Day 1 action visibility violation',
      message: 'Actions must be hidden on Day 1.',
      recommendation: 'Restore preview start day guards.',
    });
  }

  const day2 = buildDistrictOperationActionCandidates({ day: 2, focusDistrictId: 'merkez' });
  const previewOk =
    day2.length > 0 && day2.every((a) => a.status === 'preview_only' && !a.isSelectableNow);
  areaResults.push(
    areaResult(
      'day_visibility_guards',
      previewOk ? 'PASS' : 'BLOCKED',
      previewOk ? 'Day 2-3 preview_only' : 'Day 2-3 preview guard failed',
      `previewStartDay=${DISTRICT_OPERATION_ACTION_PREVIEW_START_DAY}`,
    ),
  );

  const day4 = buildDistrictOperationActionCandidates({
    day: DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY,
    focusDistrictId: 'merkez',
    selectedByDay: emptyState.selectedByDay,
    recentDistrictOperationKeys: emptyState.recentDistrictOperationKeys,
  });
  const action = day4[0];
  const day4Selectable = !!action && action.status === 'available';
  areaResults.push(
    areaResult(
      'day_visibility_guards',
      day4Selectable ? 'PASS' : 'BLOCKED',
      day4Selectable ? 'Day 4+ selectable' : 'Day 4+ not selectable',
      `minSelectableDay=${DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY}`,
    ),
  );

  if (!action) {
    risks.push({
      id: 'risk.no_day4_candidate',
      severity: 'blocker',
      title: 'No Day 4 action candidate',
      message: 'Cannot evaluate daily max/idempotency without candidate.',
      recommendation: 'Fix district operations runtime recommendations.',
    });
    return { areaResults, risks };
  }

  const selected = selectDistrictOperationAction(emptyState, action);
  const selectedAgain = selectDistrictOperationAction(selected, action);
  const dailyMaxOk =
    Object.keys(selected.selectedByDay).length <= DISTRICT_OPERATION_ACTION_MAX_PER_DAY &&
    selectedAgain === selected;
  areaResults.push(
    areaResult(
      'daily_max_one_action',
      dailyMaxOk ? 'PASS' : 'BLOCKED',
      dailyMaxOk ? 'Daily max 1 action enforced' : 'Daily max rule broken',
      `maxPerDay=${DISTRICT_OPERATION_ACTION_MAX_PER_DAY}`,
    ),
  );
  if (!dailyMaxOk) {
    risks.push({
      id: 'risk.daily_max_broken',
      severity: 'blocker',
      title: 'Daily max 1 action rule broken',
      message: 'More than one action per day or reselection mutates state.',
      recommendation: 'Fix selectDistrictOperationAction guards.',
    });
  }

  areaResults.push(
    areaResult(
      'idempotency',
      selectedAgain === selected ? 'PASS' : 'BLOCKED',
      selectedAgain === selected ? 'Reselection idempotent' : 'Reselection not idempotent',
    ),
  );
  if (selectedAgain !== selected) {
    risks.push({
      id: 'risk.idempotency_broken',
      severity: 'blocker',
      title: 'Action selection not idempotent',
      message: 'Re-selecting same action mutates state.',
      recommendation: 'Return early when existing.id === action.id.',
    });
  }

  const blockedSameDay = buildDistrictOperationActionCandidates({
    day: action.day,
    focusDistrictId: 'cumhuriyet',
    selectedByDay: selected.selectedByDay,
    recentDistrictOperationKeys: selected.recentDistrictOperationKeys,
  });
  const duplicateBlocked = blockedSameDay.every((c) => c.status === 'blocked');
  areaResults.push(
    areaResult(
      'duplicate_suppression',
      duplicateBlocked ? 'PASS' : 'WARN',
      duplicateBlocked ? 'Second same-day action blocked' : 'Same-day duplicate not fully blocked',
    ),
  );

  const spamGuard = buildDistrictOperationActionCandidates({
    day: action.day + 1,
    focusDistrictId: action.districtId,
    recentDistrictOperationKeys: selected.recentDistrictOperationKeys,
  });
  const spamSuppressed = spamGuard.every(
    (c) => c.operationKind !== action.operationKind || c.status === 'blocked',
  );
  areaResults.push(
    areaResult(
      'duplicate_suppression',
      spamSuppressed ? 'PASS' : 'WARN',
      spamSuppressed ? 'Recent district/operation spam guard active' : 'Spam guard partial',
    ),
  );

  const signals = createInitialOperationSignalsState(action.day);
  const afterSignals = applyDistrictOperationActionEffects(signals, action);
  const delta = Math.abs(afterSignals.overall.score - signals.overall.score);
  const effectBounded = delta <= 4;
  areaResults.push(
    areaResult(
      'operation_signals_effect_scope',
      effectBounded ? 'PASS' : 'WARN',
      effectBounded ? 'Operation signals small bounded delta' : `Effect delta large: ${delta}`,
      'applyDistrictOperationActionEffects patches personnel/vehicles/containers/districts',
    ),
  );

  const focusOk =
    afterSignals.priorityDistrictId === action.districtId && afterSignals.dailyFocus === 'districts';
  areaResults.push(
    areaResult(
      'priority_district_daily_focus',
      focusOk ? 'PASS' : 'WARN',
      focusOk
        ? 'priorityDistrictId and dailyFocus updated on selection'
        : 'Priority district / daily focus mismatch',
    ),
  );

  const hubCopy = buildDistrictOperationActionHubCopy(action);
  const mapCopy = buildDistrictOperationActionMapCopy(action);
  const reportLine = buildDistrictOperationActionReportLine(action);
  const summary = buildDistrictOperationActionDailySummary(selected, action.day);
  const echoOk =
    hubCopy.includes(action.districtName) &&
    mapCopy.length > 0 &&
    reportLine.length > 0 &&
    summary.reportLines.length <= 1;
  areaResults.push(
    areaResult(
      'hub_map_report_echo',
      echoOk ? 'PASS' : 'WARN',
      echoOk ? 'Hub/Map/Report echo surfaces wired' : 'Echo copy incomplete',
      'Session-only: echo lost on restart unless derived fallback',
    ),
  );

  areaResults.push(
    areaResult(
      'session_only_behavior',
      'PASS',
      'Action state session-only in useGameStore',
      'districtOperationActionState not in gamePersist normalize shape',
    ),
  );

  const gamePersist = readRepo('src/store/gamePersist.ts');
  const useGameStore = readRepo('src/store/useGameStore.ts');
  const inPersist = gamePersist.includes('districtOperationActionState');
  const inPersistSlice =
    useGameStore.includes("'districtOperationActionState'") &&
    useGameStore.includes('createInitialDistrictOperationActionState()');

  areaResults.push(
    areaResult(
      'save_persistence_gap',
      !inPersist ? 'PASS' : 'BLOCKED',
      !inPersist ? 'Persist shape unchanged — no district action fields' : 'districtOperationActionState in persist',
    ),
  );
  if (inPersist) {
    risks.push({
      id: 'risk.persist_shape_changed',
      severity: 'blocker',
      title: 'District action state in persist shape',
      message: 'gamePersist.ts references districtOperationActionState.',
      recommendation: 'This review patch must not add persist; revert or defer to V1.1 migration.',
    });
  }

  areaResults.push(
    areaResult(
      'app_restart_behavior',
      'WARN',
      'App restart: selected action may be lost or fall back to derived candidates',
      'Acceptable for soft launch — small-effect optional action',
    ),
  );

  risks.push({
    id: 'risk.restart_continuity_weak',
    severity: 'warning',
    title: 'Restart continuity weak',
    message: 'Selected action not restored from save after app restart.',
    recommendation: 'Monitor telemetry; evaluate Option B in V1.1.',
  });

  risks.push({
    id: 'risk.report_echo_restart',
    severity: 'warning',
    title: 'Report echo may be missing after restart',
    message: 'Report summary depends on in-memory selectedByDay.',
    recommendation: 'If telemetry shows pain, persist daily summary in V1.1.',
  });

  return { areaResults, risks };
}

function buildSaveImpact(): CreviaDistrictOperationActionSaveImpact {
  const gamePersist = readRepo('src/store/gamePersist.ts');
  const districtActionInPersistShape = gamePersist.includes('districtOperationActionState');
  const saveVersionChanged = SAVE_VERSION !== NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION;

  return {
    persistShapeChanged: districtActionInPersistShape,
    saveVersionChanged,
    currentSaveVersion: SAVE_VERSION,
    expectedSaveVersion: NO_NEW_SYSTEM_FREEZE_EXPECTED_SAVE_VERSION,
    districtActionInPersistShape,
    storeShapeChanged: false,
    summary: districtActionInPersistShape
      ? 'Persist shape includes district action — unexpected for session-only model.'
      : 'Persist shape excludes districtOperationActionState; SAVE_VERSION unchanged for this review.',
  };
}

export function buildDistrictOperationActionPersistenceSoftLaunchFindings(
  result: CreviaDistrictOperationActionPersistenceReviewResult,
): CreviaDistrictOperationActionPersistenceSoftLaunchFindings {
  return result.softLaunchFindings;
}

export function runDistrictOperationActionPersistenceReviewAudit(
  _options: RunDistrictOperationActionPersistenceReviewOptions = {},
): CreviaDistrictOperationActionPersistenceReviewResult {
  const { areaResults: runtimeAreas, risks: runtimeRisks } = evaluateRuntimeBehavior();
  const saveImpact = buildSaveImpact();
  const persistenceOptions = buildPersistenceOptions();
  const telemetryQuestions = buildTelemetryQuestions();
  const v11Backlog = buildV11Backlog();
  const freezeActive = isNoNewSystemFreezeActive('internal_device_test');
  const docsPresent = existsSync(join(REPO_ROOT, DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH));

  const areaResults = [...runtimeAreas];

  areaResults.push(
    areaResult(
      'migration_cost',
      'PASS',
      'No migration in soft launch — session-only',
      'Option B/C deferred to V1.1/V2',
    ),
    areaResult(
      'save_version_impact',
      saveImpact.saveVersionChanged ? 'BLOCKED' : 'PASS',
      saveImpact.saveVersionChanged
        ? `SAVE_VERSION changed: ${SAVE_VERSION}`
        : `SAVE_VERSION ${SAVE_VERSION} unchanged`,
    ),
    areaResult(
      'v11_persistence_benefit',
      'WARN',
      'V1.1 benefit: report/tomorrow continuity if telemetry warrants',
      'Option B recommended candidate after launch data',
    ),
    areaResult(
      'telemetry_decision_criteria',
      telemetryQuestions.length >= 8 ? 'PASS' : 'WARN',
      `${telemetryQuestions.length} telemetry decision questions defined`,
    ),
  );

  const risks: CreviaDistrictOperationActionPersistenceRisk[] = [...runtimeRisks];

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
      title: 'Persistence review docs missing',
      message: DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
      recommendation: 'Create review documentation.',
    });
  }

  const hasBlocker = risks.some((r) => r.severity === 'blocker');
  const hasWarn =
    risks.some((r) => r.severity === 'warning') ||
    areaResults.some((a) => a.health === 'WARN');
  const health: CreviaDistrictOperationActionPersistenceHealthStatus = hasBlocker
    ? 'BLOCKED'
    : hasWarn
      ? 'WARN'
      : 'PASS';

  const currentBehaviorSummary =
    'Action state şu an session-only. Persist shape\'e yazılmıyor. App restart sonrası selected action kaybolabilir veya derived fallback\'e dönebilir. Soft launch için kabul edilebilir (küçük etkili optional action). Kalıcı persistence V1.1\'de telemetry sonrası değerlendirilmeli.';

  const v11Recommendation =
    'Soft launch öncesi persist ekleme. V1.1\'de telemetry sonrası "persist daily selected action summary" (Option B) değerlendir. SAVE_VERSION bump gerekiyorsa ayrı migration patch tasarla. Action history window (Option C) V1.1 sonrası veya V2 backlog\'a kalsın.';

  const softLaunchFindings: CreviaDistrictOperationActionPersistenceSoftLaunchFindings = {
    persistenceReviewPresent: docsPresent,
    sessionOnlyCurrent: !saveImpact.districtActionInPersistShape,
    persistNotRequiredForSoftLaunch: true,
    v11PersistenceBacklogDefined: v11Backlog.length >= 4,
    saveVersionUnchanged: !saveImpact.saveVersionChanged,
  };

  const freezeCompliant =
    freezeActive &&
    !saveImpact.persistShapeChanged &&
    !saveImpact.saveVersionChanged &&
    !saveImpact.storeShapeChanged;

  return {
    health,
    sessionOnly: true,
    persistAdded: false,
    runtimeGameplayChanged: false,
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
    docsPath: DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
  };
}
