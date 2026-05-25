export function createId(prefix?: string): string {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return prefix ? `${prefix}_${suffix}` : suffix;
}
