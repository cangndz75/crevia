import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';

import { buildMapReactionMotionModelFromLite } from './mapReactionMotionModel';
import type { MapDistrictMotionCue, MapReactionMotionModel } from './mapReactionMotionTypes';

/** Node verify / SSR güvenli — React Native import etmez. */
export function resolveReduceMotionPreferenceSync(): boolean {
  try {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      const w = globalThis as Window & typeof globalThis;
      const mq = w.matchMedia?.('(prefers-reduced-motion: reduce)');
      return Boolean(mq?.matches);
    }
    return false;
  } catch {
    return false;
  }
}

export function buildMapReactionMotionIntegrationModel(params: {
  reactionModel: MapReactionLiteModel | null | undefined;
  selectedDistrictId?: MapDistrictId | string | null;
  accessMode?: 'none' | 'limited' | 'full';
  reducedMotionMode?: boolean;
  existingTextLines?: string[];
}): MapReactionMotionModel {
  const guard = (params.existingTextLines ?? []).map((l) => l.toLocaleLowerCase('tr-TR'));
  const hasJournalDup = guard.some(
    (l) => l.includes('günlük') || l.includes('gunluk') || l.includes('şehir izi'),
  );
  const hasSocialDup = guard.some(
    (l) => l.includes('sosyal') || l.includes('mahallede görünür'),
  );
  const hasResourceDup = guard.some(
    (l) => l.includes('saha kapasitesi') || l.includes('ekip temposu') || l.includes('araç'),
  );

  return buildMapReactionMotionModelFromLite(params.reactionModel, {
    selectedDistrictId: params.selectedDistrictId,
    accessMode: params.accessMode,
    reducedMotionMode: params.reducedMotionMode,
    suppressJournalText: hasJournalDup,
    suppressSocialText: hasSocialDup,
    suppressResourceText: hasResourceDup,
  });
}

export function motionCueStrokeColor(cue: MapDistrictMotionCue): string {
  switch (cue.tone) {
    case 'positive':
      return '#5BB5AA';
    case 'warning':
      return '#E59A22';
    case 'recovery':
      return '#4CAF88';
    case 'social':
      return '#7B9FD4';
    case 'resource':
      return '#7BC4B8';
    default:
      return '#8A9AA6';
  }
}

export function motionCueRingRadius(cue: MapDistrictMotionCue): number {
  if (cue.motionKind === 'operation_scope_ring') return 0.065;
  if (cue.motionKind === 'risk_ring') return 0.042;
  if (cue.intensity === 'high') return 0.04;
  if (cue.intensity === 'medium') return 0.035;
  return 0.03;
}

export function collectMapReactionMotionAccessibilityLabels(
  model: MapReactionMotionModel | null | undefined,
): string[] {
  if (!model) return [];
  const labels = model.globalMotionCues.map((c) =>
    model.reducedMotionMode ? c.reducedMotionFallbackLabel : c.accessibilityLabel,
  );
  if (model.bubbleCue) labels.push(model.bubbleCue.accessibilityLabel);
  if (model.journalCue) labels.push(model.journalCue.accessibilityLabel);
  if (model.operationScopeCue) labels.push(model.operationScopeCue.accessibilityLabel);
  return labels.filter(Boolean);
}
