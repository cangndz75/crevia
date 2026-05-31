/** RN/Expo geliştirme modu — verify script’leri bu dosyayı import edebilir. */
export function isPostPilotDevToolsEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}
