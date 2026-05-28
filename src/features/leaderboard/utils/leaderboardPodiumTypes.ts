export type PodiumUser = {
  id: string;
  name: string;
  title?: string;
  score: number;
  districtName?: string;
  avatarUrl?: string | null;
};

export type PodiumSlotKey = 'first' | 'second' | 'third';

export type PodiumAvatarPosition = {
  centerX: number;
  centerY: number;
  size: number;
};
