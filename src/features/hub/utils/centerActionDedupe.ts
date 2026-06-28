export type CenterActionSource =
  | 'activeTarget'
  | 'operationFocus'
  | 'operationCommandPanel'
  | 'quickActions'
  | 'recommendedPlan'
  | 'continuationCards'
  | 'cityPulse'
  | 'fallback';

export type CenterActionPlacement =
  | 'nextAction'
  | 'quickCommand'
  | 'pulseCta'
  | 'eventCard';

export type CenterActionCandidate = {
  id: string;
  source: CenterActionSource;
  placement: CenterActionPlacement;
  label: string;
  subtitle?: string;
  iconKey: string;
  canonicalKey: string;
  actionFamily: string;
  actionKey: string;
  routeKey?: string;
  domain?: string;
  targetId?: string;
  priority: number;
  urgency?: 'low' | 'medium' | 'high';
  disabled?: boolean;
  unlockLabel?: string;
  accent?: 'green' | 'gold' | 'amber' | 'sage';
  statusLabel?: string;
};

export const ACTION_TAXONOMY: Record<string, { canonical: string; family: string }> = {
  dispatch_team_action: { canonical: 'team.dispatch', family: 'team' },
  send_support_unit: { canonical: 'team.dispatch', family: 'team' },
  check_team_status: { canonical: 'team.status', family: 'team' },
  open_assignments: { canonical: 'team.dispatch', family: 'team' },

  scan_district_signal: { canonical: 'signal.scan', family: 'signal' },
  open_signal_detail: { canonical: 'signal.open', family: 'signal' },
  view_signals: { canonical: 'signal.open', family: 'signal' },
  view_signal: { canonical: 'signal.open', family: 'signal' },

  complete_report: { canonical: 'report.complete', family: 'report' },
  open_report: { canonical: 'report.open', family: 'report' },
  open_report_action: { canonical: 'report.open', family: 'report' },
  view_report: { canonical: 'report.open', family: 'report' },
  view_result: { canonical: 'report.complete', family: 'report' },

  allocate_resource: { canonical: 'resource.allocate', family: 'resource' },
  open_resources: { canonical: 'resource.allocate', family: 'resource' },
  resource: { canonical: 'resource.allocate', family: 'resource' },

  inspect_area: { canonical: 'inspection.open', family: 'inspection' },
  open_operations: { canonical: 'inspection.open', family: 'inspection' },

  open_operation: { canonical: 'operation.open', family: 'operation' },
  start_operation: { canonical: 'operation.open', family: 'operation' },
  continue_operation: { canonical: 'operation.open', family: 'operation' },

  manage_district: { canonical: 'district.manage', family: 'district' },
  open_domain: { canonical: 'district.manage', family: 'district' },
  open_map: { canonical: 'district.manage', family: 'district' },
  view_plan: { canonical: 'district.manage', family: 'district' },

  open_authority: { canonical: 'authority.open', family: 'authority' },

  team: { canonical: 'team.dispatch', family: 'team' },
  signal: { canonical: 'signal.scan', family: 'signal' },
  flow: { canonical: 'report.complete', family: 'report' },
};

const CANONICAL_LABELS: Record<string, string> = {
  'report.complete': 'Raporu Tamamla',
  'report.open': 'Raporlarda Aç',
  'team.dispatch': 'Ekip Yönlendir',
  'team.status': 'Ekip Durumu',
  'signal.scan': 'Sinyal Tara',
  'signal.open': 'Sinyal İncele',
  'resource.allocate': 'Kaynak Ayır',
  'inspection.open': 'Denetim Aç',
  'operation.open': 'Operasyona Git',
  'district.manage': 'Bölgeyi Yönet',
  'authority.open': 'Yetki Paneli',
};

const SOURCE_PRIORITY: Record<CenterActionSource, number> = {
  activeTarget: 100,
  operationFocus: 90,
  operationCommandPanel: 80,
  recommendedPlan: 70,
  quickActions: 60,
  continuationCards: 50,
  cityPulse: 40,
  fallback: 10,
};

function normalizeKeyPart(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, '_') ?? '';
}

export function normalizeCenterActionKey(action: {
  actionKey?: string;
  canonicalKey?: string;
  id?: string;
  label?: string;
}): string {
  const raw = normalizeKeyPart(action.canonicalKey ?? action.actionKey ?? action.id);
  if (ACTION_TAXONOMY[raw]) return ACTION_TAXONOMY[raw]!.canonical;

  const haystack = [action.actionKey, action.id, action.label]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/team|personnel|assign|ekip/.test(haystack)) return 'team.dispatch';
  if (/signal|sinyal|scan/.test(haystack)) return 'signal.scan';
  if (/report|rapor|flow|journal/.test(haystack)) return 'report.complete';
  if (/resource|kaynak|wallet|energy/.test(haystack)) return 'resource.allocate';
  if (/inspect|denetim|operation/.test(haystack)) return 'inspection.open';
  if (/district|map|domain|bölge|harita/.test(haystack)) return 'district.manage';
  if (/continue|start_operation|operasyon/.test(haystack)) return 'operation.open';

  return raw || 'unknown';
}

export function getCenterActionFamily(canonicalKey: string): string {
  const entry = Object.values(ACTION_TAXONOMY).find((item) => item.canonical === canonicalKey);
  if (entry) return entry.family;
  const slash = canonicalKey.indexOf('.');
  return slash > 0 ? canonicalKey.slice(0, slash) : canonicalKey;
}

export function labelForCanonicalKey(canonicalKey: string, fallback: string): string {
  return CANONICAL_LABELS[canonicalKey] ?? fallback;
}

export function enrichCenterActionCandidate(
  candidate: Omit<CenterActionCandidate, 'canonicalKey' | 'actionFamily'> & {
    canonicalKey?: string;
    actionFamily?: string;
  },
): CenterActionCandidate {
  const canonicalKey =
    candidate.canonicalKey ?? normalizeCenterActionKey({ actionKey: candidate.actionKey, id: candidate.id });
  const actionFamily = candidate.actionFamily ?? getCenterActionFamily(canonicalKey);
  return {
    ...candidate,
    canonicalKey,
    actionFamily,
    label: labelForCanonicalKey(canonicalKey, candidate.label),
  };
}

export function dedupeCenterActionsByCanonicalKey(
  actions: CenterActionCandidate[],
): CenterActionCandidate[] {
  const seen = new Set<string>();
  const result: CenterActionCandidate[] = [];

  const sorted = [...actions].sort((left, right) => {
    const priorityDelta = right.priority - left.priority;
    if (priorityDelta !== 0) return priorityDelta;
    return SOURCE_PRIORITY[right.source] - SOURCE_PRIORITY[left.source];
  });

  for (const action of sorted) {
    if (seen.has(action.canonicalKey)) continue;
    seen.add(action.canonicalKey);
    result.push(action);
  }

  return result;
}

export function selectCenterNextActions(candidates: CenterActionCandidate[]): CenterActionCandidate[] {
  const nextCandidates = candidates
    .filter((item) => item.placement === 'nextAction' && !item.disabled)
    .map((item) => ({
      ...item,
      priority: item.priority + SOURCE_PRIORITY[item.source],
    }));

  return dedupeCenterActionsByCanonicalKey(nextCandidates).slice(0, 3);
}

export function selectCenterQuickCommands(
  candidates: CenterActionCandidate[],
  usedKeys: ReadonlySet<string>,
  usedFamilies: ReadonlySet<string>,
): CenterActionCandidate[] {
  const quickCandidates = candidates
    .filter((item) => item.placement === 'quickCommand')
    .map((item) => ({
      ...item,
      priority: item.priority + SOURCE_PRIORITY[item.source],
    }));

  const deduped = dedupeCenterActionsByCanonicalKey(quickCandidates);
  const filtered: CenterActionCandidate[] = [];

  for (const action of deduped) {
    if (usedKeys.has(action.canonicalKey)) continue;
    if (usedFamilies.has(action.actionFamily)) continue;
    filtered.push(action);
    if (filtered.length >= 3) break;
  }

  return filtered;
}

export function centerHomeHasDuplicateVisibleActions(input: {
  nextActions: ReadonlyArray<{ canonicalKey: string }>;
  quickCommands: ReadonlyArray<{ canonicalKey: string; actionFamily?: string }>;
}): boolean {
  const nextKeys = new Set(input.nextActions.map((item) => item.canonicalKey));
  const nextFamilies = new Set(
    input.nextActions.map((item) => getCenterActionFamily(item.canonicalKey)),
  );

  for (const command of input.quickCommands) {
    if (nextKeys.has(command.canonicalKey)) return true;
    const family = command.actionFamily ?? getCenterActionFamily(command.canonicalKey);
    if (nextFamilies.has(family)) return true;
  }

  return false;
}
