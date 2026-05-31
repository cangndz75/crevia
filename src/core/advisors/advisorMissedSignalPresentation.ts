import { ADVISOR_COPY } from './advisorConstants';
import type {
  AdvisorMissedSignalPresentation,
  AdvisorState,
} from './advisorTypes';

export function buildMissedSignalPresentation(
  state: AdvisorState,
  options?: { showCta?: boolean },
): AdvisorMissedSignalPresentation | undefined {
  const missed = state.lastMissedSignal;
  if (!missed || missed.acknowledged) {
    return undefined;
  }
  return {
    title: ADVISOR_COPY.missedNoteTitle,
    body: missed.message,
    footer: ADVISOR_COPY.missedNoteFooter,
    showCta: options?.showCta ?? true,
    ctaLabel: ADVISOR_COPY.missedNoteCta,
  };
}
