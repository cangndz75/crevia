import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapObservationPresentationModel } from '@/features/map/presentation/mapObservationPresentation';
import type { MapObservationModeState } from '@/features/map/presentation/mapObservationPresentation';

const SCAN_DURATION_MS = 1700;
const COOLDOWN_MS = 2800;
const SCAN_PHASE_MS = 520;

type UseMapObservationControllerInput = {
  model: MapObservationPresentationModel;
  reducedMotion: boolean;
  canObserve: boolean;
  autoStart?: boolean;
};

export function useMapObservationController({
  model,
  reducedMotion,
  canObserve,
  autoStart = false,
}: UseMapObservationControllerInput) {
  const [mode, setMode] = useState<MapObservationModeState>('idle');
  const [confidence, setConfidence] = useState(model.initialConfidence);
  const [scanningPhase, setScanningPhase] = useState(0);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [energyRemaining, setEnergyRemaining] = useState(model.energyRemaining);
  const [pinsRevealed, setPinsRevealed] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    scanTimerRef.current = null;
    cooldownTimerRef.current = null;
    phaseTimerRef.current = null;
  }, []);

  const finishScan = useCallback(() => {
    setMode('completed');
    setPinsRevealed(true);
    setConfidence(model.finalConfidence);
    setShowResultSheet(true);
    setEnergyRemaining((current) => Math.max(0, current - model.scanCost));
    clearTimers();
  }, [clearTimers, model.finalConfidence, model.scanCost]);

  const beginObservation = useCallback(() => {
    clearTimers();
    setShowResultSheet(false);
    setPinsRevealed(false);
    setScanningPhase(0);

    if (!canObserve) {
      setMode('blocked');
      setConfidence(model.initialConfidence);
      return;
    }

    if (energyRemaining < model.scanCost) {
      setMode('insufficient_energy');
      setConfidence(model.initialConfidence);
      return;
    }

    if (mode === 'cooldown') {
      return;
    }

    setMode('scanning');
    setConfidence(model.initialConfidence);

    if (reducedMotion) {
      finishScan();
      return;
    }

    phaseTimerRef.current = setInterval(() => {
      setScanningPhase((phase) => (phase + 1) % 3);
    }, SCAN_PHASE_MS);

    scanTimerRef.current = setTimeout(() => {
      finishScan();
    }, SCAN_DURATION_MS);
  }, [
    canObserve,
    clearTimers,
    energyRemaining,
    finishScan,
    mode,
    model.initialConfidence,
    model.scanCost,
    reducedMotion,
  ]);

  const dismissResultSheet = useCallback(() => {
    setShowResultSheet(false);
    setMode('idle');
    setPinsRevealed(false);
    setConfidence(model.initialConfidence);
    clearTimers();
    cooldownTimerRef.current = setTimeout(() => {
      setMode('idle');
    }, COOLDOWN_MS);
  }, [clearTimers, model.initialConfidence]);

  const closeOverlay = useCallback(() => {
    clearTimers();
    setShowResultSheet(false);
    setMode('idle');
    setPinsRevealed(false);
    setConfidence(model.initialConfidence);
  }, [clearTimers, model.initialConfidence]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (!canObserve) {
      setMode('blocked');
      autoStartedRef.current = true;
      return;
    }
    autoStartedRef.current = true;
    beginObservation();
  }, [autoStart, beginObservation, canObserve]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    mode,
    confidence,
    scanningPhase,
    showResultSheet,
    energyRemaining,
    pinsRevealed,
    beginObservation,
    dismissResultSheet,
    closeOverlay,
    isOverlayVisible:
      mode === 'scanning' ||
      mode === 'completed' ||
      mode === 'blocked' ||
      mode === 'cooldown' ||
      mode === 'insufficient_energy' ||
      showResultSheet,
  };
}
