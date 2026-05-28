import type { PodiumAvatarPosition } from './leaderboardPodiumTypes';

export type PodiumAvatarLayout = {
  left: number;
  top: number;
  size: number;
  borderRadius: number;
};

export function computePodiumAvatarLayout(
  containerWidth: number,
  containerHeight: number,
  position: PodiumAvatarPosition,
): PodiumAvatarLayout {
  const size = containerWidth * position.size;
  const left = containerWidth * position.centerX - size / 2;
  const top = containerHeight * position.centerY - size / 2;

  return {
    left,
    top,
    size,
    borderRadius: size / 2,
  };
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const first = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]![0] ?? '';
  return `${first}${last}`.toUpperCase();
}

const FALLBACK_PALETTES: ReadonlyArray<{ bg: string; text: string }> = [
  { bg: '#E6F5F4', text: '#157A76' },
  { bg: '#FFF6E0', text: '#9A7209' },
  { bg: '#EBF2FA', text: '#3D6A9E' },
  { bg: '#F0EBFA', text: '#5E4490' },
  { bg: '#E8F7F0', text: '#2A8A5C' },
];

export function getInitialsPalette(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_PALETTES[Math.abs(hash) % FALLBACK_PALETTES.length]!;
}
