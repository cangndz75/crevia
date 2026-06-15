import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';

import { criticalEventImageModules } from '@/core/assets/eventScreenAssets';
import { eventAssets as allEventAssets } from '@/features/events/utils/eventAssets';

function collectImageModules(value: unknown, out: Set<number>): void {
  if (typeof value === 'number') {
    out.add(value);
    return;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectImageModules(nested, out);
    }
  }
}

const ALL_EVENT_IMAGE_MODULES: number[] = (() => {
  const modules = new Set<number>();
  for (const moduleId of criticalEventImageModules) {
    modules.add(moduleId);
  }
  collectImageModules(allEventAssets, modules);
  return [...modules];
})();

export function usePreloadCriticalAssets() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        await Promise.all(
          ALL_EVENT_IMAGE_MODULES.map((assetModule) =>
            Asset.fromModule(assetModule).downloadAsync(),
          ),
        );
      } catch (err) {
        console.warn('[assets] Critical PNG preload failed:', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    void loadAssets();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
