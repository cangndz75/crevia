import type { MapDistrictId } from '../data/mapDistrictConstants';
import type { MapNeighborhoodStripItem } from './mapUiPresentation';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import { buildMapReactionStripOverlays } from '@/core/mapReactions/mapReactionPresentation';

export function applyMapReactionStripOverlay(
  items: MapNeighborhoodStripItem[],
  model: MapReactionLiteModel | null | undefined,
  selectedDistrictId?: MapDistrictId,
): MapNeighborhoodStripItem[] {
  const overlays = buildMapReactionStripOverlays(model);
  if (overlays.length === 0) return items;

  const overlayById = new Map(overlays.map((entry) => [entry.districtId, entry]));

  return items.map((item) => {
    const overlay = overlayById.get(item.id);
    if (!overlay) return item;

    const isSelected = item.id === selectedDistrictId;
    return {
      ...item,
      reactionTone: overlay.tone,
      reactionPulseStyle: overlay.pulseStyle,
      reactionShouldAnimate: overlay.shouldAnimate,
      reactionIndicatorLabel:
        isSelected && model?.selectedDistrictReaction?.districtId === item.id
          ? model.selectedDistrictReaction.shortLine
          : overlay.indicatorLabel,
    };
  });
}
