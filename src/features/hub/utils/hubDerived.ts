import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyMission } from '@/core/models/DailyMission';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { OpsPulseStatus } from '@/core/models/OperationsBrief';
import type { GameResources } from '@/core/models/GameResources';
import {
  getHubNeighborhoodShortName,
  getRegionAvatarColor,
  getRegionMoodLabel,
} from '@/features/hub/utils/hubRegionHelpers';
import { colors } from '@/ui/theme/colors';
import {
  eventRecurrenceRisk,
  eventSeverity,
  eventVisibility,
} from '@/core/utils/eventPriority';

const LOW_SATISFACTION = 40;
const LOW_MORALE = 40;
const LOW_BUDGET = 35_000;

export type HubDerivedInput = {
  day: number;
  metrics: GameMetrics;
  activeEvents: EventCard[];
  decisionCount: number;
};

export function deriveHubRiskScore(input: HubDerivedInput): {
  score: number;
  maxScore: number;
  label: string;
} {
  const { metrics, activeEvents } = input;
  let score = 20;

  if (activeEvents.some((e) => eventSeverity(e) >= 4)) score += 28;
  else if (
    activeEvents.some(
      (e) => eventSeverity(e) >= 3 && eventVisibility(e) >= 3,
    )
  ) {
    score += 18;
  }

  if (activeEvents.length >= 3) score += 12;
  if (metrics.publicSatisfaction < LOW_SATISFACTION) score += 14;
  if (metrics.staffMorale < LOW_MORALE) score += 12;
  if (metrics.budget < LOW_BUDGET) score += 10;

  const clamped = Math.min(100, Math.max(0, score));
  const label =
    clamped >= 65
      ? 'yüksek sıcaklık'
      : clamped >= 42
        ? 'denge hassas'
        : 'yük dengede';

  return { score: clamped, maxScore: 100, label };
}

export function deriveAdvisorBriefing(input: HubDerivedInput): {
  body: string;
  attribution: string;
} {
  const { metrics, activeEvents, decisionCount } = input;
  const lines: string[] = [];

  if (activeEvents.length > 0) {
    lines.push(
      `Bugün ${activeEvents.length} aktif olay var. Öncelik görünürlüğü yüksek sorunları büyümeden yönet.`,
    );
  }

  if (metrics.staffMorale < LOW_MORALE) {
    lines.push(
      'Personel morali düşüyor. Fazla mesai kararlarını dikkatli kullan.',
    );
  }

  if (metrics.budget < LOW_BUDGET) {
    lines.push(
      'Bütçe baskısı artıyor. Kalıcı çözümler için öncelik seçmen gerekebilir.',
    );
  }

  if (activeEvents.length === 0) {
    lines.push(
      'Aktif olay kalmadı. Günü kapatıp operasyon raporunu inceleyebilirsin.',
    );
  }

  if (lines.length === 0) {
    lines.push(
      'Operasyon hattı kontrol altında. Görünür olaylarda hızlı ama dengeli karar ver.',
    );
  }

  if (decisionCount > 0 && activeEvents.length > 0) {
    lines.push(`${decisionCount} karar kayıtlı; kalan olayları önceliklendir.`);
  }

  return {
    body: lines.slice(0, 2).join(' '),
    attribution: '— Deniz Erdem, Kentsel Operasyon Danışmanı',
  };
}

export function deriveHubMotto(input: HubDerivedInput): string {
  const { day, metrics, activeEvents } = input;

  if (day === 1) {
    return 'İlk operasyon gününde öncelik, görünür sorunları büyümeden yönetmek.';
  }
  if (activeEvents.length === 0) {
    return 'Bugünün operasyon yükü kontrol altına alındı.';
  }
  if (metrics.staffMorale < LOW_MORALE) {
    return 'Saha ekibinin temposu kritik seviyeye yaklaşıyor.';
  }
  if (metrics.budget < LOW_BUDGET) {
    return 'Bütçe baskısı artıyor. Her müdahale için öncelik seçmen gerekiyor.';
  }
  return 'Şehir operasyon hattını görünür sorunlardan yönet.';
}

export function deriveDay1Missions(input: HubDerivedInput): DailyMission[] {
  const { metrics, decisionCount } = input;
  const solved = decisionCount >= 1;

  return [
    {
      id: 'solve-one',
      title: 'En az 1 olayı çöz',
      description: 'Bugün en az bir operasyon kararı ver.',
      icon: 'check',
      current: solved ? 1 : 0,
      target: 1,
      xpReward: 25,
      status: solved ? 'completed' : 'active',
    },
    {
      id: 'morale-floor',
      title: 'Personel moralini 40 altına düşürme',
      description: 'Ekip yükünü dengeleyerek morali koru.',
      icon: 'shield',
      current: metrics.staffMorale >= 40 ? 1 : 0,
      target: 1,
      xpReward: 20,
      status: metrics.staffMorale >= 40 ? 'completed' : 'active',
    },
    {
      id: 'budget-floor',
      title: 'Bütçeyi 30 altına düşürme',
      description: 'Kaynakları kontrollü kullan (₺30.000 üzeri).',
      icon: 'happy',
      current: metrics.budget >= 30_000 ? 1 : 0,
      target: 1,
      xpReward: 20,
      status: metrics.budget >= 30_000 ? 'completed' : 'active',
    },
  ];
}

export type CrisisQueueItem = {
  event: EventCard;
  priority: number;
};

export function deriveCrisisQueue(activeEvents: EventCard[]): CrisisQueueItem[] {
  return [...activeEvents]
    .map((event) => ({
      event,
      priority:
        eventSeverity(event) * 10 +
        eventVisibility(event) * 6 +
        eventRecurrenceRisk(event) * 4 -
        event.urgencyHours * 0.1,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

export type LiveOpsLine = {
  id: string;
  headline: string;
  detail: string;
  status: OpsPulseStatus;
};

export type HubMetricCard = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  showTrend: boolean;
  icon: 'operasyon' | 'halk' | 'butce' | 'ekip';
  accent: string;
  muted: string;
};

export type HubStatusStripItem = {
  id: 'satisfaction' | 'risk' | 'team' | 'activeEvents';
  label: string;
  value: string;
  accent: string;
};

export function deriveHubStatusStrip(
  input: HubDerivedInput,
  resources: GameResources,
): HubStatusStripItem[] {
  const { metrics, activeEvents } = input;
  const risk = deriveHubRiskScore(input);
  const satisfaction = (metrics.publicSatisfaction / 10).toFixed(1);

  return [
    {
      id: 'satisfaction',
      label: 'Memnuniyet',
      value: satisfaction,
      accent: colors.success,
    },
    {
      id: 'risk',
      label: 'Risk',
      value: risk.score.toFixed(1),
      accent: colors.warning,
    },
    {
      id: 'team',
      label: 'Ekip',
      value: `${resources.availableStaff}/30`,
      accent: colors.purple,
    },
    {
      id: 'activeEvents',
      label: 'Aktif Olay',
      value: String(activeEvents.length),
      accent: colors.danger,
    },
  ];
}

export function deriveHubMetricCards(
  input: HubDerivedInput,
  resources: GameResources,
): HubMetricCard[] {
  const { metrics, activeEvents, decisionCount } = input;
  const risk = deriveHubRiskScore(input);
  const operasyon = Math.max(0, Math.min(100, 100 - risk.score * 0.65));
  const halk = metrics.publicSatisfaction / 10;
  const budgetK = metrics.budget / 1000;
  const ekip = resources.availableStaff;

  const showTrend = decisionCount > 0;

  const satDelta = metrics.publicSatisfaction - 55;
  const budgetDelta = ((metrics.budget - 75_000) / 75_000) * 100;
  const moraleDelta = metrics.staffMorale - 65;
  const opsDelta =
    activeEvents.length > 2 ? activeEvents.length * 4 : decisionCount > 0 ? 8 : 0;

  return [
    {
      id: 'operasyon',
      label: 'Operasyon',
      value: String(Math.round(operasyon)),
      trend: showTrend ? `↑ ${opsDelta}%` : 'Stabil',
      trendUp: operasyon >= 60,
      showTrend,
      icon: 'operasyon',
      accent: '#3BAF7A',
      muted: '#E8F7F0',
    },
    {
      id: 'halk',
      label: 'Halk',
      value: halk.toFixed(1),
      trend: showTrend
        ? `${satDelta >= 0 ? '↑' : '↓'} ${Math.abs(satDelta / 10).toFixed(1)}`
        : 'Nötr',
      trendUp: satDelta >= 0,
      showTrend,
      icon: 'halk',
      accent: '#7B5BB8',
      muted: '#F0EBFA',
    },
    {
      id: 'risk',
      label: 'Risk',
      value: risk.score.toFixed(1),
      trend: showTrend
        ? `${risk.score <= 50 ? '↓' : '↑'} ${Math.abs(risk.score - 50).toFixed(1)}`
        : 'Nötr',
      trendUp: risk.score <= 50,
      showTrend,
      icon: 'butce',
      accent: '#E89B2E',
      muted: '#FDF4E6',
    },
    {
      id: 'ekip',
      label: 'Ekip Gücü',
      value: `${ekip}/30`,
      trend: showTrend
        ? `${moraleDelta >= 0 ? '↑' : '↓'} ${Math.abs(moraleDelta)}`
        : 'Hazır',
      trendUp: moraleDelta >= 0,
      showTrend,
      icon: 'ekip',
      accent: '#E89B2E',
      muted: '#FDF4E6',
    },
  ];
}

export type RegionPulseItem = {
  id: string;
  name: string;
  shortName: string;
  activeCount: number;
  mood: '😟' | '😠' | '🙂' | '😊';
  pulseColor: string;
  statusLabel: string;
  detailLine: string;
  avatarColor: string;
};

/** Merkez nabzı kartlarında gösterilecek mahalle sırası (Crevia isimleri). */
const HUB_PULSE_NEIGHBORHOOD_ORDER = [
  'merkez',
  'pazar',
  'sanayi',
  'yeni-konut',
  'yesilpark',
] as const;

export function deriveRegionPulse(
  neighborhoods: Neighborhood[],
  activeEvents: EventCard[],
): RegionPulseItem[] {
  const byId = new Map(neighborhoods.map((n) => [n.id, n]));
  const ordered = HUB_PULSE_NEIGHBORHOOD_ORDER.map((id) => byId.get(id)).filter(
    (n): n is Neighborhood => n != null,
  );
  const list =
    ordered.length > 0 ? ordered : neighborhoods.slice(0, 5);

  return list.slice(0, 5).map((n) => {
    const activeCount = activeEvents.filter(
      (e) => e.neighborhoodId === n.id,
    ).length;
    const mood =
      n.trust < 48
        ? '😠'
        : n.cleanliness < 52
          ? '😟'
          : n.trust >= 55
            ? '😊'
            : '🙂';
    const pulseColor =
      n.longTermNeglect >= 45
        ? '#E89B2E'
        : n.trust < 48
          ? '#E05A52'
          : '#3BAF7A';
    const shortName = getHubNeighborhoodShortName(n.id, n.name);
    let detailLine: string;
    if (activeCount === 0) {
      if (n.trust < 48) detailLine = 'Güven zayıf';
      else if (n.cleanliness < 52) detailLine = 'Temizlik riski';
      else if (n.longTermNeglect >= 45) detailLine = 'İhmal izleniyor';
      else if (n.trust >= 55) detailLine = 'Güven yüksek';
      else detailLine = 'Olay beklenmiyor';
    } else if (n.trust < 48) detailLine = 'Halk tedirgin';
    else if (n.cleanliness < 52) detailLine = 'Bakım bekliyor';
    else if (n.longTermNeglect >= 45) detailLine = 'Esnaf baskısı';
    else if (activeCount >= 2) detailLine = `${activeCount} olay aktif`;
    else detailLine = 'Takipte';

    return {
      id: n.id,
      name: n.name,
      shortName,
      activeCount,
      mood,
      pulseColor,
      statusLabel: getRegionMoodLabel(mood, activeCount),
      detailLine,
      avatarColor: getRegionAvatarColor(shortName),
    };
  });
}

export function deriveLiveOpsPulse(input: HubDerivedInput): LiveOpsLine[] {
  const { day, metrics, activeEvents, decisionCount } = input;

  return [
    {
      id: 'day',
      headline: `Gün ${day}`,
      detail: 'Operasyon takvimi',
      status: 'steady',
    },
    {
      id: 'active',
      headline: `Aktif olay: ${activeEvents.length}`,
      detail: 'Bekleyen müdahaleler',
      status: activeEvents.length >= 3 ? 'hot' : 'watch',
    },
    {
      id: 'solved',
      headline: `Çözülen: ${decisionCount}`,
      detail: 'Bugünkü karar kayıtları',
      status: decisionCount > 0 ? 'steady' : 'watch',
    },
    {
      id: 'morale',
      headline: `Personel morali: %${metrics.staffMorale}`,
      detail: 'Saha ekibi durumu',
      status: metrics.staffMorale < LOW_MORALE ? 'hot' : 'steady',
    },
    {
      id: 'budget',
      headline: `Bütçe: ₺${metrics.budget.toLocaleString('tr-TR')}`,
      detail: 'Güncel kaynak durumu',
      status: metrics.budget < LOW_BUDGET ? 'watch' : 'steady',
    },
  ];
}
