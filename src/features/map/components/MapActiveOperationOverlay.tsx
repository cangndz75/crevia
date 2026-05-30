import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: MapActiveOperationOverlayModel;
};

export function MapActiveOperationOverlay({ model }: Props) {
  return (
    <View style={[styles.card, shadows.soft]} pointerEvents="none">
      <View style={styles.iconCircle}>
        <Ionicons name="radio-outline" size={20} color={mapUi.teal} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.event} numberOfLines={2}>
          {model.eventName}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {model.timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 248,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    zIndex: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: mapUi.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: mapUi.teal,
  },
  event: {
    fontSize: 14,
    fontWeight: '800',
    color: mapUi.textDark,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: mapUi.textSecondary,
  },
});
