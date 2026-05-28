import { buildSocialPulseUiBundle } from './socialUiMappers';
import type { HotSocialTopic } from './socialUiModel';
import type { SocialPulseState } from '@/core/social/socialTypes';

export type HubSocialPulseStatusTone = 'good' | 'balanced' | 'caution' | 'crisis';

export type HubSocialPulseModel = {
  score: number;
  statusLabel: string;
  statusTone: HubSocialPulseStatusTone;
  signalLine: string;
};

function statusToneFromLabel(statusLabel: string): HubSocialPulseStatusTone {
  if (statusLabel === 'Kriz Baskısı') {
    return 'crisis';
  }
  if (statusLabel === 'Hassas') {
    return 'caution';
  }
  if (statusLabel === 'Güven Yüksek') {
    return 'good';
  }
  return 'balanced';
}

function locativePhrase(neighborhood: string): string {
  const trimmed = neighborhood.trim();
  if (!trimmed) {
    return 'Bölgede';
  }
  if (trimmed.endsWith('yon')) {
    return `${trimmed}'da`;
  }
  if (trimmed.endsWith('t')) {
    return `${trimmed}'te`;
  }
  return `${trimmed}'de`;
}

function signalFromHotTopic(hotTopic: HotSocialTopic): string {
  if (hotTopic.isMockFallback || !hotTopic.topicType) {
    return 'Topluluk nabzı dengede.';
  }

  const where = locativePhrase(hotTopic.neighborhood);

  switch (hotTopic.topicType) {
    case 'crisis_pressure':
      return `${where} kriz baskısı artıyor.`;
    case 'misinformation':
      return `${where} söylenti riski yükseliyor.`;
    case 'complaint_wave':
      return `${where} şikayet dalgası var.`;
    case 'gratitude_wave':
      return `${where} olumlu geri bildirim artıyor.`;
    case 'service_delay':
      return `${where} hizmet gecikmesi baskısı var.`;
    case 'environmental_concern':
      return `${where} çevre hassasiyeti artıyor.`;
    case 'public_question':
      return `${where} bilgi talebi yoğunlaşıyor.`;
    default:
      return `${where} sosyal gündem hareketli.`;
  }
}

/** Hub kısa yol kartı — buildSocialPulseUiBundle üzerinden güvenli özet. */
export function buildHubSocialPulseModel(
  socialPulseState: SocialPulseState | null | undefined,
  currentDay: number,
): HubSocialPulseModel {
  const bundle = buildSocialPulseUiBundle(socialPulseState, currentDay);
  const score = Math.round(bundle.summary.score);

  return {
    score,
    statusLabel: bundle.summary.statusLabel,
    statusTone: statusToneFromLabel(bundle.summary.statusLabel),
    signalLine: signalFromHotTopic(bundle.hotTopic),
  };
}
