import AsyncStorage from '@react-native-async-storage/async-storage';

/** Yalnızca kullanıcı tutorial’ı “Kapat” ile bitirince yazılır. */
const ONBOARDING_COMPLETE_KEY = '@crevia/onboarding_complete_v2';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

/** Geliştirme / test için onboarding bayrağını sıfırlar. */
export async function resetOnboardingForDev(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}
