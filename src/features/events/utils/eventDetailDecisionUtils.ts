import type { GameEventStatus } from '@/core/models/DailyEventSet';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { PersonnelState, PersonnelTeam } from '@/core/personnel/personnelTypes';
import { STATUS_LABELS_TR } from '@/core/personnel/personnelConstants';
import { formatUrgencyLabel, getRiskLevelLabel } from '@/core/content/mockGameData';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';

export type EventTimelineStatus =
  | 'new'
  | 'review'
  | 'assigned'
  | 'field'
  | 'resolved';

export const TIMELINE_STEPS: Array<{
  status: EventTimelineStatus;
  label: string;
}> = [
  { status: 'new', label: 'Yeni' },
  { status: 'review', label: 'İnceleme' },
  { status: 'assigned', label: 'Yönlendir' },
  { status: 'field', label: 'Sahada' },
  { status: 'resolved', label: 'Çözüldü' },
];

export type QuickActionKind = 'follow' | 'assign' | 'communicate';

export type QuickActionMeta = {
  kind: QuickActionKind;
  title: string;
  subtext: string;
  icon: 'eye-outline' | 'navigate-outline' | 'chatbubble-outline';
};

export const QUICK_ACTION_UI: Record<QuickActionKind, QuickActionMeta> = {
  follow: {
    kind: 'follow',
    title: 'Takip Et',
    subtext: 'Durumu izle',
    icon: 'eye-outline',
  },
  assign: {
    kind: 'assign',
    title: 'Yönlendir',
    subtext: 'Ekibi sevk et',
    icon: 'navigate-outline',
  },
  communicate: {
    kind: 'communicate',
    title: 'İletişim Kur',
    subtext: 'Mahalle ile görüş',
    icon: 'chatbubble-outline',
  },
};

export type ResolvedQuickAction = QuickActionMeta & {
  decision: EventDecision;
};

export type FieldResourceRow = {
  id: string;
  name: string;
  subtitle: string;
  pill?: string;
  loadLabel: string;
  loadPercent: number;
  loadTone: 'low' | 'medium' | 'high';
  icon: 'people' | 'car' | 'construct';
};

function mapGameEventStatus(status: GameEventStatus): EventTimelineStatus {
  switch (status) {
    case 'pending':
      return 'new';
    case 'awaiting_decision':
      return 'review';
    case 'escalated':
      return 'field';
    case 'deferred':
      return 'assigned';
    case 'resolved':
    case 'dismissed':
      return 'resolved';
    default:
      return 'review';
  }
}

export function resolveEventTimelineStatus(
  eventId: string,
  gameEventStatus?: GameEventStatus | null,
): EventTimelineStatus {
  if (gameEventStatus) {
    return mapGameEventStatus(gameEventStatus);
  }

  void eventId;
  return 'review';
}

function decisionTagsText(decision: EventDecision): string {
  if (!decision.setFlags) return '';
  return Object.keys(decision.setFlags).join(' ').toLowerCase();
}

function decisionKeywordText(decision: EventDecision): string {
  return [
    decision.id,
    decision.title,
    decision.description,
    decision.resultText ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

function keywordIncludes(text: string, ...needles: string[]): boolean {
  return needles.some((n) => text.includes(n));
}

/** Pilot intent → decisionStyle, sonra style/tags, en son başlık-metin anahtar kelimeleri. */
function matchQuickActionKind(decision: EventDecision): QuickActionKind | null {
  const intent = decision.decisionStyle;
  if (intent === 'communication') return 'communicate';
  if (intent === 'fast' || intent === 'permanent' || intent === 'risk') return 'assign';
  if (
    intent === 'planned' ||
    intent === 'partial' ||
    intent === 'resource_saving'
  ) {
    return 'follow';
  }

  const category = decision.style;
  if (category === 'bold' || category === 'risky') return 'assign';
  if (category === 'cautious') return 'follow';
  if (category === 'balanced') return 'communicate';

  const tags = decisionTagsText(decision);
  if (keywordIncludes(tags, 'communicat', 'dialog', 'iletisim', 'iletişim')) {
    return 'communicate';
  }
  if (keywordIncludes(tags, 'assign', 'dispatch', 'fast', 'direct', 'field')) {
    return 'assign';
  }
  if (keywordIncludes(tags, 'follow', 'monitor', 'defer', 'wait', 'plan')) {
    return 'follow';
  }

  const text = decisionKeywordText(decision);
  if (
    keywordIncludes(
      text,
      'communicat',
      'iletişim',
      'iletisim',
      'görüş',
      'gorus',
      'mahalle',
    )
  ) {
    return 'communicate';
  }
  if (
    keywordIncludes(
      text,
      'yönlendir',
      'yonlendir',
      'müdahale',
      'mudahale',
      'doğrudan',
      'dogrudan',
      'sevk',
      'ekip',
      'acil',
    ) ||
    decision.recommended
  ) {
    return 'assign';
  }
  if (
    keywordIncludes(
      text,
      'takip',
      'bekle',
      'planlı',
      'planli',
      'izle',
      'ertele',
    )
  ) {
    return 'follow';
  }

  return null;
}

export function resolveQuickActions(event: EventCard): ResolvedQuickAction[] {
  const slotOrder: QuickActionKind[] = ['follow', 'assign', 'communicate'];
  const byKind = new Map<QuickActionKind, EventDecision>();

  for (const decision of event.decisions) {
    const kind = matchQuickActionKind(decision);
    if (kind && !byKind.has(kind)) {
      byKind.set(kind, decision);
    }
  }

  const usedIds = new Set([...byKind.values()].map((d) => d.id));
  const remaining = event.decisions.filter((d) => !usedIds.has(d.id));

  for (const kind of slotOrder) {
    if (!byKind.has(kind) && remaining.length > 0) {
      byKind.set(kind, remaining.shift()!);
    }
  }

  return slotOrder
    .filter((kind) => byKind.has(kind))
    .map((kind) => ({
      ...QUICK_ACTION_UI[kind],
      decision: byKind.get(kind)!,
    }));
}

export function getDefaultQuickActionId(
  actions: ResolvedQuickAction[],
): string | null {
  const assign = actions.find((a) => a.kind === 'assign');
  if (assign) return assign.decision.id;

  const recommended = actions.find((a) => a.decision.recommended);
  if (recommended) return recommended.decision.id;

  return actions[0]?.decision.id ?? null;
}

function advisorTextForKind(kind: QuickActionKind | null): string {
  switch (kind) {
    case 'assign':
      return 'Aydınlatma ekibi yönlendirilirse güven artışı bekleniyor.';
    case 'follow':
      return 'Takip kararı bütçeyi korur ama güven artışı sınırlı kalabilir.';
    case 'communicate':
      return 'İletişim sosyal baskıyı azaltır ancak saha sorunu devam edebilir.';
    default:
      return 'Karar öncesi saha notunu ve ekip yoğunluğunu kontrol et.';
  }
}

function buildAdvisorTextFromEffects(
  decision: EventDecision,
  kind: QuickActionKind | null,
): string {
  const { effects, costs } = decision;
  const parts: string[] = [];

  const budgetCost = Math.abs(
    costs?.budget ?? (effects.budget < 0 ? effects.budget : 0),
  );
  if (budgetCost >= 3000 || effects.budget <= -8) {
    parts.push('Bütçe maliyeti yüksek; kaynak rezervini kontrol et.');
  }

  const moraleHit = effects.morale < 0 || (effects.staffMorale ?? 0) < 0;
  if (moraleHit || effects.morale <= -6) {
    parts.push('Ekip yorgunluğu artabilir; saha kapasitesini göz önünde tut.');
  }

  const trustGain =
    effects.publicSatisfaction > 0 ||
    (effects.trust ?? 0) > 0 ||
    effects.publicSatisfaction >= 4;
  if (trustGain) {
    parts.push('Mahalle güveni ve memnuniyet artışı bekleniyor.');
  }

  if (effects.risk < 0) {
    parts.push('Sosyal baskı azalır; risk skoru düşer.');
  } else if (effects.risk > 6) {
    parts.push('Risk skoru yükselebilir; hızlı müdahale önerilir.');
  }

  if (parts.length > 0) {
    return parts.slice(0, 2).join(' ');
  }

  return advisorTextForKind(kind);
}

export function getAdvisorRecommendation(
  selectedDecision: EventDecision | null,
  selectedKind: QuickActionKind | null,
  eventAdvisorBody?: string,
): string {
  if (selectedDecision) {
    return buildAdvisorTextFromEffects(selectedDecision, selectedKind);
  }

  if (eventAdvisorBody?.trim()) {
    return eventAdvisorBody.trim();
  }

  return advisorTextForKind(selectedKind);
}

function fatigueToLoadTone(fatigue: number): FieldResourceRow['loadTone'] {
  if (fatigue >= 65) return 'high';
  if (fatigue >= 40) return 'medium';
  return 'low';
}

function teamSubtitle(team: PersonnelTeam): string {
  const statusLabel = STATUS_LABELS_TR[team.status] ?? 'Müsait';
  if (team.status === 'assigned') {
    return `Sahada • ${Math.max(8, Math.round(team.fatigue / 4))} dk`;
  }
  if (team.restMode === 'full_rest') {
    return `Dinleniyor • ${statusLabel}`;
  }
  return `${statusLabel} • ${Math.max(5, 18 - Math.round(team.morale / 8))} dk`;
}

function teamIcon(team: PersonnelTeam): FieldResourceRow['icon'] {
  if (team.role === 'driver') return 'car';
  if (team.role === 'maintenance') return 'construct';
  return 'people';
}

const MOCK_FIELD_RESOURCE_ROWS: FieldResourceRow[] = [
  {
    id: 'mock-transit-1',
    name: 'Ekip Transit-1',
    subtitle: 'Müsait • 12 dk',
    pill: 'Sorumlu: Burak Yılmaz',
    loadLabel: 'Yoğunluk %26',
    loadPercent: 26,
    loadTone: 'low',
    icon: 'people',
  },
  {
    id: 'mock-support-1',
    name: 'Destek Ekibi',
    subtitle: 'Sahada • 20 dk',
    loadLabel: 'Yoğunluk %51',
    loadPercent: 51,
    loadTone: 'medium',
    icon: 'people',
  },
  {
    id: 'mock-vehicle-2',
    name: 'Hizmet Aracı 2',
    subtitle: 'Müsait • Hız Yüksek',
    loadLabel: 'Hız Yüksek',
    loadPercent: 18,
    loadTone: 'low',
    icon: 'car',
  },
];

const MOCK_VEHICLE_ROW: FieldResourceRow = {
  id: 'mock-vehicle-extra',
  name: 'Hizmet Aracı 2',
  subtitle: 'Müsait • Hız Yüksek',
  loadLabel: 'Hız Yüksek',
  loadPercent: 22,
  loadTone: 'low',
  icon: 'car',
};

export function buildFieldResources(
  personnelState: PersonnelState | null,
): FieldResourceRow[] {
  if (!personnelState?.teams?.length) {
    return MOCK_FIELD_RESOURCE_ROWS;
  }

  const rows: FieldResourceRow[] = personnelState.teams.slice(0, 2).map((team) => ({
    id: team.id,
    name: team.name,
    subtitle: teamSubtitle(team),
    pill:
      team.status === 'assigned'
        ? `Sorumlu: ${team.name}`
        : team.morale >= 60
          ? `Moral: ${Math.round(team.morale)}`
          : undefined,
    loadLabel: `Yoğunluk %${Math.round(team.fatigue)}`,
    loadPercent: Math.min(100, Math.round(team.fatigue)),
    loadTone: fatigueToLoadTone(team.fatigue),
    icon: teamIcon(team),
  }));

  return [...rows, MOCK_VEHICLE_ROW];
}

export function splitEventTitle(title: string): { line1: string; line2: string } {
  const trimmed = title.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    return { line1: trimmed, line2: '' };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' '),
  };
}

export function getTrustInsight(event: EventCard): {
  label: string;
  value: string;
  delta: string;
  socialFeedback: string;
  socialLevel: number;
  crewLoad: string;
  crewLevel: number;
} {
  const trustDelta = event.previewEffects.publicSatisfaction;
  const isNegative = trustDelta < 0 || event.riskLevel === 'high' || event.riskLevel === 'critical';

  return {
    label: 'Mahalle Güveni',
    value: isNegative ? 'Düşük' : trustDelta > 0 ? 'İyi' : 'Orta',
    delta: `${trustDelta <= 0 ? '↓' : '↑'} %${Math.abs(Math.round(trustDelta || 18))} / 30 günde`,
    socialFeedback: event.riskLevel === 'critical' ? 'Yüksek' : 'Orta',
    socialLevel: event.riskLevel === 'critical' ? 0.85 : event.riskLevel === 'high' ? 0.7 : 0.45,
    crewLoad: event.riskLevel === 'low' ? 'Düşük' : 'Orta',
    crewLevel: event.riskLevel === 'low' ? 0.35 : 0.55,
  };
}

export function buildEventDetailsRows(event: EventCard): Array<{ label: string; value: string }> {
  return [
    { label: 'Benzer olay', value: '7' },
    { label: 'Konum güveni', value: '%90' },
    { label: 'Öncelik', value: getRiskLevelLabel(event.riskLevel) },
    { label: 'Sosyal yorum', value: '38' },
    {
      label: 'Tahmini süre',
      value: isDay1LearningEventId(event.id)
        ? '45 dk'
        : formatUrgencyLabel(event.urgencyHours),
    },
    {
      label: 'Olay tipi',
      value: `${event.category} / ${event.contextTag || event.districtEventType || 'saha'}`,
    },
  ];
}

export function getFieldNoteBody(event: EventCard): string {
  if (isDay1LearningEventId(event.id)) {
    return 'Parkın ışıkları akşam çalışmıyor, çocuklar tedirgin.';
  }
  if (event.description?.trim()) {
    return event.description.trim();
  }
  return 'Parkın ışıkları akşam çalışmıyor, çocuklar tedirgin.';
}

export function getOfficerRoleLabel(day: number): string {
  if (day <= 3) return 'Aday Operasyon Görevlisi';
  if (day <= 7) return 'Operasyon Görevlisi';
  return 'Kıdemli Operasyon Görevlisi';
}

export function kindFromDecisionId(
  actions: ResolvedQuickAction[],
  decisionId: string | null,
): QuickActionKind | null {
  if (!decisionId) return null;
  return actions.find((a) => a.decision.id === decisionId)?.kind ?? null;
}

export function resolveSelectedDecision(
  event: EventCard,
  actions: ResolvedQuickAction[],
  selectedDecisionId: string | null,
  defaultDecisionId: string | null,
): { decisionId: string | null; decision: EventDecision | null } {
  const validIds = new Set(event.decisions.map((d) => d.id));

  const pick = (id: string | null) => {
    if (!id || !validIds.has(id)) return null;
    const decision = event.decisions.find((d) => d.id === id) ?? null;
    return decision ? { decisionId: id, decision } : null;
  };

  const fromFirstAction = actions[0] ? pick(actions[0].decision.id) : null;

  return (
    pick(selectedDecisionId) ??
    pick(defaultDecisionId) ??
    fromFirstAction ?? { decisionId: null, decision: null }
  );
}
