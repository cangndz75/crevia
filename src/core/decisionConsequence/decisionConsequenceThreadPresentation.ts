import type {
  DecisionConsequenceThread,
  DecisionConsequenceTone,
} from './decisionConsequenceThreadTypes';

function cleanText(value: string | null | undefined, max = 130): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string | null | undefined): string {
  return cleanText(value, 240).toLocaleLowerCase('tr-TR');
}

export function pickPrimaryDecisionConsequenceThread(
  threads: readonly DecisionConsequenceThread[],
  surface?: DecisionConsequenceThread['visibleIn'][number],
): DecisionConsequenceThread | null {
  const scoped = surface
    ? threads.filter((thread) => thread.visibleIn.includes(surface))
    : [...threads];
  return scoped[0] ?? null;
}

export function buildDecisionConsequenceCausalLine(
  threads: readonly DecisionConsequenceThread[],
  surface?: DecisionConsequenceThread['visibleIn'][number],
): string | null {
  const thread = pickPrimaryDecisionConsequenceThread(threads, surface);
  return cleanText(thread?.causalLine) || null;
}

export function buildDecisionConsequenceEceLine(
  threads: readonly DecisionConsequenceThread[],
): string | null {
  const thread = pickPrimaryDecisionConsequenceThread(threads, 'ece');
  if (!thread) return null;

  if (thread.tone === 'warning') {
    return cleanText(`${thread.causalLine} ${thread.nextActionHint ?? 'Bugün planı buna göre dengede tut.'}`, 150);
  }
  if (thread.tone === 'positive') {
    return cleanText(`${thread.causalLine} Bugün bu avantajı koruyabiliriz.`, 150);
  }
  return cleanText(thread.causalLine, 150);
}

export function buildPrimaryTomorrowActionFromThreads(
  threads: readonly DecisionConsequenceThread[],
  fallback = 'Yarın aktif hedefle devam et.',
): string {
  const actionable = threads.find((thread) => cleanText(thread.nextActionHint));
  if (actionable?.nextActionHint) return cleanText(actionable.nextActionHint, 96);
  return fallback;
}

export function buildDecisionConsequenceReportLine(
  threads: readonly DecisionConsequenceThread[],
): string | null {
  const thread = pickPrimaryDecisionConsequenceThread(threads, 'report');
  if (!thread) return null;
  return cleanText(thread.causalLine, 130);
}

export function buildDecisionConsequenceHubLine(
  threads: readonly DecisionConsequenceThread[],
  avoidLines: Array<string | null | undefined> = [],
): string | null {
  const line = buildDecisionConsequenceCausalLine(threads, 'hub');
  if (!line) return null;
  const normalized = normalizeLine(line);
  if (avoidLines.some((avoid) => {
    const candidate = normalizeLine(avoid);
    return candidate && (candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate));
  })) {
    const action = buildPrimaryTomorrowActionFromThreads(threads, '');
    return cleanText(action || line, 120);
  }
  return line;
}

export function mapDecisionConsequenceToneToSurface(
  tone: DecisionConsequenceTone,
): 'positive' | 'neutral' | 'warning' {
  if (tone === 'positive') return 'positive';
  if (tone === 'warning') return 'warning';
  return 'neutral';
}

export function decisionConsequenceContainsFakeUrgency(
  threads: readonly DecisionConsequenceThread[],
): boolean {
  return threads.some((thread) => {
    if (thread.consequenceType === 'neutral_record' && thread.tone === 'warning') return true;
    if (thread.consequenceType === 'neutral_record' && thread.strength === 'high') return true;
    return false;
  });
}
