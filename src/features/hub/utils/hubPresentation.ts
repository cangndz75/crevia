import type { HubDerivedInput } from '@/features/hub/utils/hubDerived';
import { deriveHubRiskScore } from '@/features/hub/utils/hubDerived';

export type { TimeGreeting } from '@/core/utils/timeGreeting';
export { getTimeGreeting } from '@/core/utils/timeGreeting';

export function getHubStatusSubtitle(input: HubDerivedInput): string {
  const { metrics, activeEvents, decisionCount } = input;
  const activeNeighborhoods = new Set(
    activeEvents.map((e) => e.neighborhoodId).filter(Boolean),
  ).size;

  if (activeEvents.length === 0) {
    return 'Bölge şu an sakin görünüyor.';
  }
  if (metrics.staffMorale < 40) {
    return 'Ekibin tempo yönetimine ihtiyacı var.';
  }
  if (activeNeighborhoods >= 2) {
    return `${activeNeighborhoods} mahallede hareketlilik bekleniyor.`;
  }
  if (decisionCount === 0) {
    return 'İlk kararın bölgenin gidişatını belirleyecek.';
  }
  return 'Görünür sorunları büyümeden yönet.';
}

export function getHeroStatusTitle(input: HubDerivedInput): string {
  const { score } = deriveHubRiskScore(input);
  if (score >= 65) return 'Bugün Bölge Yoğun';
  if (score >= 42) return 'Bugün Bölge Hareketli';
  return 'Bugün Bölge Dengede';
}

export function getHeroStatusSummary(input: HubDerivedInput): string {
  const { metrics, activeEvents } = input;
  const activeNeighborhoods = new Set(
    activeEvents.map((e) => e.neighborhoodId).filter(Boolean),
  ).size;
  const tiredTeam = metrics.staffMorale < 45 ? 1 : 0;

  if (activeEvents.length === 0) {
    return 'Mahalleler sakin; ekip hazır bekliyor.';
  }
  if (activeNeighborhoods >= 2 && tiredTeam > 0) {
    return `${activeNeighborhoods} mahallede tepki yükseliyor, ${tiredTeam} ekip yorgun.`;
  }
  if (activeNeighborhoods >= 2) {
    return `${activeNeighborhoods} mahallede tepki yükseliyor.`;
  }
  if (activeEvents.length >= 1) {
    return `${activeEvents.length} aktif olay takip ediliyor.`;
  }
  return 'Operasyon hattı kontrol altında.';
}

export type RegionMoodLabel = 'Sakin' | 'Dengede' | 'Tepkili' | 'Yoğun';

export function getRegionMoodLabel(
  mood: '😟' | '😠' | '🙂' | '😊',
  activeCount: number,
): RegionMoodLabel {
  if (activeCount === 0) {
    if (mood === '😠' || mood === '😟') return 'Tepkili';
    if (mood === '😊') return 'Dengede';
    return 'Sakin';
  }
  if (activeCount >= 4) return 'Yoğun';
  if (mood === '😠' || mood === '😟') return 'Tepkili';
  if (mood === '😊') return 'Dengede';
  return activeCount >= 2 ? 'Yoğun' : 'Dengede';
}

export function getRegionAvatarColor(shortName: string): string {
  const palette = ['#E6F5F4', '#F0EBFA', '#E8F7F0', '#FDF4E6', '#FDEEED'];
  const code = shortName.charCodeAt(0) || 0;
  return palette[code % palette.length] ?? palette[0];
}

export function getHeroSupportMessage(input: HubDerivedInput): {
  line1: string;
  line2: string;
} {
  const { score } = deriveHubRiskScore(input);
  if (score >= 65) {
    return { line1: 'Bölge baskı altında.', line2: 'Kritik olaylara odaklan.' };
  }
  if (score >= 42) {
    return { line1: 'Denge hassas noktada.', line2: 'Erken müdahale avantaj sağlar.' };
  }
  return { line1: 'Bölgen iyi durumda.', line2: 'Devam et ve istikrarı koru.' };
}

export function getCriticalEventQuote(advisorBody: string): string {
  const first = advisorBody.split('.').find((s) => s.trim().length > 8);
  if (first) {
    const trimmed = first.trim();
    return trimmed.length > 72 ? `${trimmed.slice(0, 69)}…` : trimmed;
  }
  return 'Bu konu acil çözülmeli.';
}
