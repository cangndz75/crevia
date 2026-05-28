import type {
  ButterflyHook,
  ButterflyHookDecisionHint,
} from './butterflyHookTypes';
import {
  BUTTERFLY_HOOK_REPORT_LINE_CAP,
} from './butterflyHookConstants';

function collectReportEchoLinesForDay(
  hooks: ButterflyHook[],
  day: number,
): string[] {
  return hooks
    .filter(
      (h) =>
        h.dueDay === day &&
        (h.kind === 'report_echo' ||
          h.kind === 'risk_signal' ||
          h.kind === 'permanent_solution_prompt') &&
        h.reportLine,
    )
    .map((h) => h.reportLine!)
    .slice(0, BUTTERFLY_HOOK_REPORT_LINE_CAP);
}

export function getButterflyHookTone(
  hook: ButterflyHook,
): ButterflyHookDecisionHint['tone'] {
  if (hook.severity === 'high') return 'warning';
  if (hook.kind === 'opportunity_return') return 'opportunity';
  if (hook.kind === 'risk_signal' || hook.severity === 'medium') return 'warning';
  return 'info';
}

export function formatButterflyDueText(hook: ButterflyHook, currentDay: number): string {
  const offset = hook.dueDay - currentDay;
  if (offset <= 0) return 'Bugün gündemde';
  if (offset === 1) return 'Yarın gündeme gelebilir';
  return `${offset} gün içinde gündeme gelebilir`;
}

export function buildButterflyEventLabel(hook: ButterflyHook): string {
  switch (hook.kind) {
    case 'follow_up_event':
      return 'Karar Yankısı';
    case 'report_echo':
      return 'Takip Sinyali';
    case 'risk_signal':
      return 'Geri Dönen Talep';
    case 'permanent_solution_prompt':
      return 'Kalıcı Çözüm Baskısı';
    case 'opportunity_return':
      return 'Fırsat Geri Döndü';
    default:
      return 'Karar Yankısı';
  }
}

export function buildButterflyHintForDecisionResult(
  hook: ButterflyHook,
  currentDay: number,
): ButterflyHookDecisionHint {
  const dueOffset = Math.max(0, hook.dueDay - currentDay);
  const dueText =
    dueOffset === 0
      ? 'Bu gün veya yarın'
      : dueOffset === 1
        ? 'Yarın veya ertesi gün'
        : `${dueOffset} gün içinde`;

  return {
    title: buildButterflyEventLabel(hook),
    text: hook.resultHint ?? hook.description,
    tone: getButterflyHookTone(hook),
    dueText,
  };
}

export function buildButterflyReportLines(
  hooks: ButterflyHook[],
  day: number,
): string[] {
  const dueToday = hooks.filter(
    (h) =>
      h.dueDay === day &&
      h.status === 'active' &&
      h.reportLine,
  );
  const echoes = collectReportEchoLinesForDay(hooks, day);
  const fromDue = dueToday.map((h) => h.reportLine!);
  const merged = [...new Set([...fromDue, ...echoes])];
  return merged.slice(0, BUTTERFLY_HOOK_REPORT_LINE_CAP);
}
