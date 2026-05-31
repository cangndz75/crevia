import {
  ACTION_REQUIRES_TARGET,
  CTA_AFFORDANCES,
  INTERACTION_FORBIDDEN_WORDS,
  KNOWN_INTERACTION_ACTIONS,
  KNOWN_INTERACTION_ROUTES,
} from './interactionContractConstants';
import { INTERACTION_CONTRACT_REGISTRY } from './interactionContractRegistry';
import type {
  InteractionAuditFinding,
  InteractionAuditResult,
  InteractionContract,
} from './interactionContractTypes';

function finding(
  severity: InteractionAuditFinding['severity'],
  contract: InteractionContract,
  message: string,
  recommendation: string,
): InteractionAuditFinding {
  return {
    id: `${contract.id}_${severity}_${message.slice(0, 24).replace(/\s+/g, '_')}`,
    severity,
    contractId: contract.id,
    componentName: contract.componentName,
    message,
    recommendation,
  };
}

function labelContainsForbiddenWord(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const word of INTERACTION_FORBIDDEN_WORDS) {
    if (word === 'satın al') {
      if (lower.includes('satın al')) return word;
      continue;
    }
    const re = new RegExp(`(?:^|[\\s,.;:!?()\\[\\]"'«»])${word}(?:$|[\\s,.;:!?()\\[\\]"'«»])`);
    if (re.test(` ${lower} `)) return word;
  }
  return undefined;
}

export function assertForbiddenWordsInLabels(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  const haystack = `${contract.label} ${contract.disabledBehavior?.explanation ?? ''}`;
  const hit = labelContainsForbiddenWord(haystack);
  if (!hit) return [];
  const hits = [hit];
  return [
    finding(
      'fail',
      contract,
      `Yasaklı kelime: ${hits.join(', ')}`,
      'Oyuncu metninden XP, premium, satın al, kilitli kaldırın.',
    ),
  ];
}

export function assertNoFakeCta(contract: InteractionContract): InteractionAuditFinding[] {
  if (
    CTA_AFFORDANCES.has(contract.visualAffordance) &&
    contract.expectedAction === 'none'
  ) {
    return [
      finding(
        'fail',
        contract,
        'CTA görünümü var ama expectedAction none',
        'CTA kaldırın veya hedef action tanımlayın.',
      ),
    ];
  }
  if (
    contract.visualAffordance === 'static_card' &&
    (contract.expectedAction === 'navigation' ||
      contract.expectedAction === 'modal' ||
      contract.expectedAction === 'state_update')
  ) {
    return [
      finding(
        'fail',
        contract,
        'static_card navigation/modal/state_update ile tanımlı',
        'static_card + none kullanın veya pressable_card yapın.',
      ),
    ];
  }
  return [];
}

export function assertDisabledExplanation(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  const db = contract.disabledBehavior;
  if (!db?.hasDisabledState || !db.explanationRequired) return [];
  if (db.explanation && db.explanation.trim().length > 0) return [];
  return [
    finding(
      'fail',
      contract,
      'disabled_cta açıklama zorunlu ama explanation yok',
      'disabledBehavior.explanation ekleyin.',
    ),
  ];
}

export function assertDebugGuard(contract: InteractionContract): InteractionAuditFinding[] {
  if (contract.visualAffordance !== 'debug_button') return [];
  if (contract.expectedAction !== 'debug_only') {
    return [
      finding(
        'fail',
        contract,
        'debug_button debug_only değil',
        'expectedAction debug_only yapın.',
      ),
    ];
  }
  if (!contract.target?.debugGuard) {
    return [
      finding(
        'fail',
        contract,
        'debug_button guard eksik',
        'target.debugGuard **DEV** veya custom_guard ekleyin.',
      ),
    ];
  }
  return [];
}

export function assertStaticCardsAreNotPressable(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  if (contract.visualAffordance !== 'static_card') return [];
  if (contract.expectedAction !== 'none' && contract.expectedAction !== 'expand_collapse') {
    return assertNoFakeCta(contract);
  }
  if (!contract.notes && !contract.isOptional) {
    return [
      finding(
        'warn',
        contract,
        'static_card notes eksik',
        'Bilgi kartı olduğunu notes ile belirtin.',
      ),
    ];
  }
  return [];
}

export function assertTargetForPressable(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  const needsTarget = ACTION_REQUIRES_TARGET[contract.expectedAction];
  if (!needsTarget) return [];

  const target = contract.target;
  if (!target) {
    if (contract.isOptional) {
      return [
        finding(
          'warn',
          contract,
          `${contract.expectedAction} hedefi eksik (optional)`,
          'CTA render edilmiyorsa registry isOptional doğru.',
        ),
      ];
    }
    return [
      finding(
        'fail',
        contract,
        `${contract.expectedAction} için target eksik`,
        `target.${needsTarget} tanımlayın.`,
      ),
    ];
  }

  const value = target[needsTarget as keyof typeof target];
  if (typeof value !== 'string' || value.length === 0) {
    return [
      finding(
        'fail',
        contract,
        `${needsTarget} boş`,
        `target.${needsTarget} doldurun.`,
      ),
    ];
  }
  return [];
}

export function assertRouteTargetsKnown(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  if (contract.expectedAction !== 'navigation' || !contract.target?.route) return [];
  const route = contract.target.route;
  const known = KNOWN_INTERACTION_ROUTES.some(
    (r) => r === route || (r.includes('[id]') && route.startsWith('/events/')),
  );
  if (known) return [];
  return [
    finding(
      'warn',
      contract,
      `Bilinmeyen route: ${route}`,
      'KNOWN_INTERACTION_ROUTES listesine ekleyin veya route doğrulayın.',
    ),
  ];
}

export function assertActionNamesKnown(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  const action =
    contract.target?.actionName ??
    (contract.expectedAction === 'external_placeholder'
      ? contract.target?.actionName
      : undefined);
  if (!action) return [];
  if ((KNOWN_INTERACTION_ACTIONS as readonly string[]).includes(action)) return [];
  if (action.startsWith('map')) {
    return [];
  }
  return [
    finding(
      'warn',
      contract,
      `Bilinmeyen actionName: ${action}`,
      'KNOWN_INTERACTION_ACTIONS listesine ekleyin.',
    ),
  ];
}

export function validateInteractionContract(
  contract: InteractionContract,
): InteractionAuditFinding[] {
  const findings: InteractionAuditFinding[] = [];

  if (!contract.id?.trim()) {
    findings.push(
      finding(
        'fail',
        contract,
        'contract id boş',
        'Benzersiz id verin.',
      ),
    );
  }
  if (!contract.componentName?.trim()) {
    findings.push(
      finding(
        'fail',
        contract,
        'componentName boş',
        'Bileşen adı zorunlu.',
      ),
    );
  }
  if (!contract.label?.trim()) {
    findings.push(
      finding(
        'fail',
        contract,
        'label boş',
        'Kullanıcıya dönük etiket ekleyin.',
      ),
    );
  }

  if (
    CTA_AFFORDANCES.has(contract.visualAffordance) &&
    contract.expectedAction === 'none' &&
    !contract.isOptional
  ) {
    findings.push(
      finding(
        'fail',
        contract,
        'CTA affordance expectedAction none',
        'Hedef action tanımlayın veya affordance static yapın.',
      ),
    );
  }

  findings.push(
    ...assertNoFakeCta(contract),
    ...assertDisabledExplanation(contract),
    ...assertDebugGuard(contract),
    ...assertStaticCardsAreNotPressable(contract),
    ...assertTargetForPressable(contract),
    ...assertRouteTargetsKnown(contract),
    ...assertActionNamesKnown(contract),
    ...assertForbiddenWordsInLabels(contract),
  );

  return findings;
}

export function runInteractionContractAudit(): InteractionAuditResult {
  const findings: InteractionAuditFinding[] = [];
  for (const contract of INTERACTION_CONTRACT_REGISTRY) {
    findings.push(...validateInteractionContract(contract));
  }

  const failCount = findings.filter((f) => f.severity === 'fail').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const contractsWithIssues = new Set(findings.map((f) => f.contractId));
  const passCount = INTERACTION_CONTRACT_REGISTRY.length - contractsWithIssues.size;

  let health: InteractionAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: INTERACTION_CONTRACT_REGISTRY.length,
    passCount: Math.max(0, passCount),
    warnCount,
    failCount,
    findings,
  };
}
