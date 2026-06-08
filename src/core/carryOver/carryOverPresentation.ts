import type {
  CarryOverHubLine,
  CarryOverSignal,
  CarryOverSignalTone,
} from './carryOverTypes';

const MAX_LINES = 2;

export type CarryOverPresentationOptions = {
  /** Karar yank�-s�- rapor sat�-r�- varsa overlap carry-over sat�-rlar�-n�- gizle. */
  hideOverlapWhenButterflyReport?: boolean;
};

export function shouldShowCarryOverSignal(signal: CarryOverSignal): boolean {
  return signal.strength !== 'none' && Boolean(signal.shortLabel?.trim());
}

export function formatCarryOverShortLabel(signal: CarryOverSignal): string {
  if (signal.kind === 'butterfly_overlap') {
    return 'Karar yank�-s�- takipte';
  }
  return signal.shortLabel?.trim() || signal.title;
}

export function getCarryOverToneStyle(tone: CarryOverSignalTone): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tone) {
    case 'positive':
      return { bg: '#E8F7EF', text: '#0B6B61', border: 'rgba(11, 107, 97, 0.18)' };
    case 'warning':
      return { bg: '#FFF6E8', text: '#9A6700', border: 'rgba(154, 103, 0, 0.2)' };
    case 'mixed':
      return { bg: '#EEF4FC', text: '#1D4E89', border: 'rgba(29, 78, 137, 0.18)' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563', border: 'rgba(75, 85, 99, 0.15)' };
  }
}

function carryOverHubText(signal: CarryOverSignal): string {
  if (signal.kind === 'butterfly_overlap') {
    return 'D+-nk+- konu karar yank�-s�- olarak takipte.';
  }
  return signal.text;
}

function carryOverHubTone(signal: CarryOverSignal): CarryOverSignalTone {
  if (signal.kind === 'butterfly_overlap') {
    return 'neutral';
  }
  return signal.tone;
}

export function buildCarryOverHubLines(signals: CarryOverSignal[]): CarryOverHubLine[] {
  const seenLabels = new Set<string>();
  const lines: CarryOverHubLine[] = [];

  for (const signal of signals.filter(shouldShowCarryOverSignal)) {
    const label = formatCarryOverShortLabel(signal);
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    lines.push({
      label,
      text: carryOverHubText(signal),
      tone: carryOverHubTone(signal),
    });
    if (lines.length >= MAX_LINES) break;
  }

  return lines;
}

export function buildCarryOverReportLines(
  signals: CarryOverSignal[],
  options?: CarryOverPresentationOptions,
): string[] {
  const hideOverlap = options?.hideOverlapWhenButterflyReport === true;
  const visible = signals.filter((s) => {
    if (hideOverlap && s.kind === 'butterfly_overlap') return false;
    return Boolean(s.text?.trim());
  });

  const priority = visible.find((s) => s.kind === 'priority_echo');
  const others = visible.filter(
    (s) => s.kind !== 'butterfly_overlap' && s !== priority,
  );

  const lines: string[] = [];
  if (priority?.text) lines.push(priority.text);
  for (const s of others) {
    if (lines.length >= MAX_LINES) break;
    if (s.text && !lines.includes(s.text)) lines.push(s.text);
  }

  if (lines.length === 0) {
    const overlap = visible.filter((s) => s.kind === 'butterfly_overlap');
    for (const s of overlap.slice(0, 1)) {
      lines.push('D+-nk+- konu karar yank�-s�- olarak takipte.');
    }
  }

  return lines.slice(0, MAX_LINES);
}

export function buildCarryOverEventMeta(signal: CarryOverSignal): {
  signalId: string;
  label: string;
  tone: CarryOverSignalTone;
} {
  return {
    signalId: signal.id,
    label: formatCarryOverShortLabel(signal),
    tone: signal.kind === 'butterfly_overlap' ? 'neutral' : signal.tone,
  };
}
