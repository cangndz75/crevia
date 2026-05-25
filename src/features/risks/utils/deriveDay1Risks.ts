import type { EventCard } from '@/core/models/EventCard';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { RiskItem } from '@/core/models/RiskItem';
import {
  eventSeverity,
  eventVisibility,
} from '@/core/utils/eventPriority';

/** Gün 2: tam risk engine buraya taşınacak. */
// TODO(Gün2): Dinamik risk skoru, olay zinciri ve mahalle korelasyonu.

const LOW_SATISFACTION = 40;
const LOW_MORALE = 40;
/** Bütçe baskısı eşiği (₺) — Gün 1 basit kural */
const LOW_BUDGET = 35_000;

export type DerivedRiskSummary = {
  total: number;
  activeThreats: number;
  critical: number;
};

export type DeriveDay1RisksInput = {
  day: number;
  activeEvents: EventCard[];
  metrics: GameMetrics;
  neighborhoods?: Neighborhood[];
};

export type DeriveDay1RisksResult = {
  risks: RiskItem[];
  summary: DerivedRiskSummary;
  emptyMessage: string | null;
};

function makeRisk(
  partial: Pick<RiskItem, 'id' | 'title' | 'subtitle' | 'severity' | 'description'> &
    Partial<Pick<RiskItem, 'probability' | 'cost' | 'actionLabel' | 'icon'>>,
): RiskItem {
  return {
    probability: 50,
    cost: 0,
    actionLabel: 'İzle',
    icon: 'alert',
    ...partial,
  };
}

export function deriveDay1Risks(input: DeriveDay1RisksInput): DeriveDay1RisksResult {
  const { day, activeEvents, metrics } = input;
  const risks: RiskItem[] = [];

  const criticalEvents = activeEvents.filter((e) => eventSeverity(e) >= 4);
  if (criticalEvents.length > 0) {
    risks.push(
      makeRisk({
        id: 'high-ops-risk',
        title: 'Yüksek Operasyon Riski',
        subtitle: `${criticalEvents.length} kritik olay`,
        severity: 'critical',
        description: `Gün ${day}: Aktif olaylarda kritik seviye tespit edildi. Öncelik sırasını gözden geçir.`,
        probability: 72,
        cost: 5000,
        actionLabel: 'Önceliklendir',
        icon: 'alert',
      }),
    );
  }

  const elevatedOps = activeEvents.filter(
    (e) => eventSeverity(e) >= 3 && eventVisibility(e) >= 3,
  );
  if (elevatedOps.length > 0 && criticalEvents.length === 0) {
    risks.push(
      makeRisk({
        id: 'elevated-ops-risk',
        title: 'Operasyon Baskısı',
        subtitle: `${elevatedOps.length} yüksek görünürlüklü olay`,
        severity: 'high',
        description:
          'Şiddet ve görünürlük yüksek olaylar birikiyor. Öncelik kuyruğunu sıkı takip et.',
        probability: 58,
        actionLabel: 'Kuyruğu Aç',
        icon: 'alert',
      }),
    );
  }

  if (metrics.publicSatisfaction < LOW_SATISFACTION) {
    risks.push(
      makeRisk({
        id: 'satisfaction-risk',
        title: 'Halk Memnuniyeti Riski',
        subtitle: `%${metrics.publicSatisfaction} seviye`,
        severity: 'high',
        description:
          'Vatandaş memnuniyeti düşük bandda. Görünür olaylara hızlı müdahale gerekir.',
        probability: 65,
        icon: 'megaphone',
        actionLabel: 'İletişim Planı',
      }),
    );
  }

  if (metrics.budget < LOW_BUDGET) {
    risks.push(
      makeRisk({
        id: 'budget-pressure',
        title: 'Bütçe Baskısı',
        subtitle: 'Kaynak kısıtı',
        severity: 'medium',
        description: `Operasyon bütçesi ₺${metrics.budget.toLocaleString('tr-TR')} seviyesinde. Harcama kalemlerini sıkı izle.`,
        probability: 55,
        icon: 'document',
        actionLabel: 'Harcama Dondur',
        cost: 2000,
      }),
    );
  }

  if (metrics.staffMorale < LOW_MORALE) {
    risks.push(
      makeRisk({
        id: 'staff-fatigue',
        title: 'Personel Yorgunluğu Riski',
        subtitle: 'Moral baskısı',
        severity: 'high',
        description: `Personel morali %${metrics.staffMorale}. Vardiya ve ekip yükü dengelenmeli.`,
        probability: 60,
        icon: 'people',
        actionLabel: 'Vardiya Gözden Geçir',
      }),
    );
  }

  const highNeglect = input.neighborhoods?.filter((n) => n.longTermNeglect >= 55);
  if (highNeglect && highNeglect.length > 0) {
    risks.push(
      makeRisk({
        id: 'neighborhood-neglect',
        title: 'Mahalle İhmal Baskısı',
        subtitle: `${highNeglect.length} mahalle`,
        severity: 'medium',
        description: `${highNeglect.map((n) => n.name).join(', ')} hatlarında uzun vadeli ihmal yükseliyor.`,
        probability: 48,
        icon: 'alert',
        actionLabel: 'Haritayı Aç',
      }),
    );
  }

  const summary: DerivedRiskSummary = {
    total: risks.length,
    activeThreats: risks.filter((r) => r.severity !== 'low').length,
    critical: risks.filter((r) => r.severity === 'critical').length,
  };

  const emptyMessage =
    risks.length === 0
      ? activeEvents.length === 0
        ? 'Bugün kritik aktif risk görünmüyor'
        : 'Şu an ölçülen metriklerde kayıtlı risk yok'
      : null;

  return { risks, summary, emptyMessage };
}
