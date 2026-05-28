export type RegionMoodLabel = 'Sakin' | 'Dengede' | 'Dikkat' | 'Yoğun';

/** Hub nabız kartlarında seed id → Crevia mahalle adı. */
const HUB_NEIGHBORHOOD_SHORT_NAMES: Record<string, string> = {
  merkez: 'Merkez',
  pazar: 'Cumhuriyet',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  'yeni-konut': 'İstasyon',
  istasyon: 'İstasyon',
  yesilpark: 'Yeşilvadi',
  yesilvadi: 'Yeşilvadi',
};

export function getHubNeighborhoodShortName(
  neighborhoodId: string,
  fallbackName: string,
): string {
  return (
    HUB_NEIGHBORHOOD_SHORT_NAMES[neighborhoodId] ??
    fallbackName.split(' ')[0] ??
    fallbackName
  );
}

export function getRegionMoodLabel(
  mood: '😟' | '😠' | '🙂' | '😊',
  activeCount: number,
): RegionMoodLabel {
  if (activeCount >= 4) return 'Yoğun';
  if (mood === '😠') return 'Dikkat';
  if (mood === '😟') return activeCount > 0 ? 'Dikkat' : 'Dengede';
  if (activeCount >= 2) return 'Dikkat';
  if (activeCount === 0 && mood === '😊') return 'Sakin';
  if (activeCount > 0) return 'Dengede';
  return 'Sakin';
}

export function getRegionAvatarColor(shortName: string): string {
  const palette = ['#E6F5F4', '#F0EBFA', '#E8F7F0', '#FDF4E6', '#FDEEED'];
  const code = shortName.charCodeAt(0) || 0;
  return palette[code % palette.length] ?? palette[0];
}
