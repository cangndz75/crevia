/**
 * Onboarding persistence mantığı smoke test (bellek içi mock).
 * Çalıştır: npx tsx scripts/smoke-onboarding-storage.ts
 */
const store = new Map<string, string>();

const mockAsyncStorage = {
  async getItem(key: string) {
    return store.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    store.set(key, value);
  },
  async removeItem(key: string) {
    store.delete(key);
  },
};

const ONBOARDING_COMPLETE_KEY = '@crevia/onboarding_complete_v1';

async function isOnboardingComplete(): Promise<boolean> {
  const value = await mockAsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

async function setOnboardingComplete(): Promise<void> {
  await mockAsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

async function run(): Promise<void> {
  if (await isOnboardingComplete()) {
    throw new Error('FAIL: başlangıçta tamamlanmış olmamalı');
  }
  await setOnboardingComplete();
  if (!(await isOnboardingComplete())) {
    throw new Error('FAIL: tamamlandıktan sonra true olmalı');
  }
  console.log('OK: smoke-onboarding-storage passed');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
