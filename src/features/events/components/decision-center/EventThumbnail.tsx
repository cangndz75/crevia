import { StyleSheet, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getEventHeroImage } from '@/features/events/utils/eventAssets';
import type { EventCard } from '@/core/models/EventCard';
import { radius } from '@/ui/theme/radius';

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
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#F5F8F7',
  },
  frame: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
