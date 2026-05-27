import { StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getEventSceneImage } from '@/features/events/utils/eventAssets';
import { deriveContextTags } from '@/features/events/utils/eventUiHelpers';
import type { EventCard } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type FeaturedEventSceneProps = {
  event: EventCard;
};

export function FeaturedEventScene({ event }: FeaturedEventSceneProps) {
  const sceneImage = getEventSceneImage(event);
  const tags = deriveContextTags(event);

  return (
    <View style={styles.wrap}>
      <HubAssetImage
        source={sceneImage}
        containerStyle={StyleSheet.absoluteFill}
        style={styles.sceneImage}
        contentFit="cover"
      />
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />

      <View style={styles.tagRow}>
        {tags.slice(0, 2).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 148,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primaryMuted,
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(252, 249, 242, 0.55)',
  },
  tagRow: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '92%',
    zIndex: 2,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(228, 226, 221, 0.9)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    maxWidth: 120,
  },
});
