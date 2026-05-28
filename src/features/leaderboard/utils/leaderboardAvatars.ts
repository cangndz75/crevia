import type { ImageSource } from 'expo-image';

const LEADERBOARD_CHARACTER_AVATARS: ImageSource[] = [
  require('@/assets/characters/char_coordinator_female_01.png'),
  require('@/assets/characters/char_chief_operations_01.png'),
  require('@/assets/characters/char_manager_municipal_01.png'),
  require('@/assets/characters/char_communications_officer_01.png'),
  require('@/assets/characters/char_manager_public_relations_01.png'),
  require('@/assets/characters/char_field_worker_maintenance_01.png'),
  require('@/assets/characters/char_operations_advisor_01.png'),
  require('@/assets/characters/char_shopkeeper_market_01.png'),
];

function hashEntryKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getLeaderboardAvatarSource(entryKey: string): ImageSource {
  const index = hashEntryKey(entryKey) % LEADERBOARD_CHARACTER_AVATARS.length;
  return LEADERBOARD_CHARACTER_AVATARS[index]!;
}
