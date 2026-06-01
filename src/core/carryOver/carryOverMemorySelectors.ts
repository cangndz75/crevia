import { inferEventDomainUiFocus } from '@/core/events/eventDomainPresentation';
import type { EventDomainFocusModel } from '@/core/events/eventDomainPresentationTypes';

import type {
  CarryOverDirection,
  CarryOverDomain,
  CarryOverTone,
} from './carryOverMemoryTypes';

const KEYWORD_RULES: { domain: CarryOverDomain; keywords: string[] }[] = [
  { domain: 'district_balance', keywords: ['mahalle dengesi', 'bekleme algısı', 'bölgesel', 'öncelik'] },
  { domain: 'crisis_adjacent', keywords: ['kriz', 'risk', 'sinyal', 'eşik', 'önleyici'] },
  { domain: 'social', keywords: ['sosyal', 'vatandaş', 'şikayet', 'takdir', 'görünürlük', 'güven'] },
  { domain: 'personnel', keywords: ['ekip', 'personel', 'moral', 'tempo', 'rotasyon'] },
  { domain: 'vehicle_route', keywords: ['araç', 'rota', 'kamyon', 'bakım', 'gecikme', 'yorgunluk'] },
  { domain: 'container', keywords: ['konteyner', 'atık', 'temizlik', 'çöp', 'doluluk'] },
];

export function inferCarryOverDomainFromText(text: string): CarryOverDomain {
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.domain;
    }
  }
  return 'generic_operation';
}

export function inferCarryOverDomainFromEvent(
  eventLike: { id?: string; title?: string; description?: string; domain?: string } | null | undefined,
): CarryOverDomain {
  if (!eventLike) return 'generic_operation';
  const uiFocus = inferEventDomainUiFocus(eventLike);
  return mapUiFocusToCarryOverDomain(uiFocus);
}

export function inferCarryOverDomainFromEventDomainFocus(
  focus?: EventDomainFocusModel | null,
): CarryOverDomain {
  if (!focus) return 'generic_operation';
  return mapUiFocusToCarryOverDomain(focus.focus);
}

function mapUiFocusToCarryOverDomain(focus: string): CarryOverDomain {
  switch (focus) {
    case 'container':
      return 'container';
    case 'vehicle_route':
      return 'vehicle_route';
    case 'personnel':
      return 'personnel';
    case 'social':
      return 'social';
    case 'crisis_adjacent':
      return 'crisis_adjacent';
    case 'district_balance':
      return 'district_balance';
    default:
      return 'generic_operation';
  }
}

export function inferCarryOverTone(args: {
  text?: string;
  direction?: CarryOverDirection;
  signalStatus?: string;
}): CarryOverTone {
  const lower = (args.text ?? '').toLowerCase();
  if (args.direction === 'positive_memory') return 'positive';
  if (args.direction === 'warning_memory' || args.direction === 'unresolved_from_previous') {
    return 'warning';
  }
  if (/risk|yorgun|baskı|bekleme|dikkat|izlen/i.test(lower)) return 'warning';
  if (/azaldı|rahat|düştü|toparlandı|olumlu/i.test(lower)) return 'positive';
  if (args.signalStatus === 'critical' || args.signalStatus === 'strained') return 'warning';
  if (args.signalStatus === 'stable') return 'calm';
  return 'calm';
}

export function inferCarryOverDirectionForSurface(
  surfaceName: 'hub' | 'event_detail' | 'plan' | 'result' | 'report',
): CarryOverDirection {
  if (surfaceName === 'hub' || surfaceName === 'event_detail' || surfaceName === 'plan') {
    return 'yesterday_to_today';
  }
  if (surfaceName === 'result' || surfaceName === 'report') {
    return 'today_to_tomorrow';
  }
  return 'yesterday_to_today';
}

export function pickStrongestMemory<T extends { tone: CarryOverTone; source: string }>(
  memories: T[],
): T | undefined {
  if (memories.length === 0) return undefined;
  const score = (m: T) => {
    let s = 0;
    if (m.source === 'daily_report') s += 10;
    if (m.source === 'event_echo') s += 9;
    if (m.source === 'operation_signals') s += 7;
    if (m.tone === 'warning') s += 4;
    if (m.tone === 'strategic') s += 3;
    return s;
  };
  return [...memories].sort((a, b) => score(b) - score(a))[0];
}
