export type {
  PerformanceAuditFinding,
  PerformanceAuditSurface,
  PerformanceRiskLevel,
  SelectorAuditResult,
} from './selectorAuditTypes';

export {
  SELECTOR_AUDIT_FORBIDDEN_WORDS,
  SELECTOR_AUDIT_TARGETS,
} from './selectorAuditConstants';

export {
  collectSelectorAuditCopy,
  countSelectorAuditForbiddenWords,
  runSelectorAudit,
} from './selectorAuditEngine';

export { buildSelectorAuditConsoleReport } from './selectorAuditPresentation';

export {
  verifySelectorAuditScenario,
  type VerifySelectorAuditOutcome,
} from './verifySelectorAuditScenario';
