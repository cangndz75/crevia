import { StyleSheet, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getEventHeroImage } from '@/features/events/utils/eventAssets';
import type { EventCard } from '@/core/models/EventCard';
type EventThumbnailProps = {
  event: EventCard;
  size?: number;
};

export function EventThumbnail({ event, size = 76 }: EventThumbnailProps) {
  const image = getEventHeroImage(event.id, event.category, event);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <HubAssetImage
        source={image}
        containerStyle={styles.frame}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    backgroundColor: '#EEF4F2',
  },
  frame: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
