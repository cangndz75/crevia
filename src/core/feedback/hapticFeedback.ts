type HapticsRuntime = {
  selectionAsync: () => Promise<void>;
  notificationAsync: (type: number) => Promise<void>;
  impactAsync: (style: number) => Promise<void>;
  NotificationFeedbackType: { Success: number; Warning: number };
  ImpactFeedbackStyle: { Light: number };
};

let cachedHaptics: HapticsRuntime | null | undefined;

function isWebRuntime(): boolean {
  return typeof document !== 'undefined' && document.documentElement != null;
}

function resolveHaptics(): HapticsRuntime | null {
  if (cachedHaptics !== undefined) {
    return cachedHaptics;
  }
  if (isWebRuntime()) {
    cachedHaptics = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedHaptics = require('expo-haptics') as HapticsRuntime;
  } catch {
    cachedHaptics = null;
  }
  return cachedHaptics;
}

function runHaptic(action: (haptics: HapticsRuntime) => void): void {
  try {
    const haptics = resolveHaptics();
    if (!haptics) return;
    action(haptics);
  } catch {
    // Desteklenmeyen platform veya native modül yok — sessiz no-op.
  }
}

/** Kart / seçenek dokunuşu */
export function playSelectionHaptic(): void {
  runHaptic((h) => {
    void h.selectionAsync();
  });
}

/** Başarılı karar uygulama, olumlu tamamlama */
export function playSuccessHaptic(): void {
  runHaptic((h) => {
    void h.notificationAsync(h.NotificationFeedbackType.Success);
  });
}

/** Kaynak yetersiz, riskli uyarı */
export function playWarningHaptic(): void {
  runHaptic((h) => {
    void h.notificationAsync(h.NotificationFeedbackType.Warning);
  });
}

/** Hafif dokunuş — rapor CTA, ipucu kapatma */
export function playLightImpactHaptic(): void {
  runHaptic((h) => {
    void h.impactAsync(h.ImpactFeedbackStyle.Light);
  });
}

/** Verify / smoke — expo-haptics yokken güvenli no-op */
export function isHapticModuleAvailable(): boolean {
  return resolveHaptics() != null;
}
