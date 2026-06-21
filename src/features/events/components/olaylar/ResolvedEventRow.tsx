import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventImages } from '@/core/assets/eventScreenAssets';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type { OlaylarResolvedEventView } from '@/features/events/types/olaylarScreenTypes';

type ResolvedEventRowProps = {
  item: OlaylarResolvedEventView;
  isLast?: boolean;
  onPress?: () => void;
};

export function ResolvedEventRow({ item, isLast = false, onPress }: ResolvedEventRowProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = item.image ?? eventImages.resolvedParkSecurity;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button">
      <View style={styles.thumbWrap}>
        {imageFailed ? (
          <LinearGradient colors={['#EEF5F1', '#DCEFE8']} style={styles.thumb} />
        ) : (
          <Image
            source={imageSource}
            style={styles.thumb}
            contentFit="cover"
            placeholder={eventImages.resolvedParkSecurity}
            transition={0}
            onError={() => setImageFailed(true)}
          />
        )}
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {item.location}
        </Text>
        <Text style={styles.resolvedAgo} numberOfLines={1}>
          {item.resolvedAgo}
        </Text>
      </View>

      <View style={styles.riskPill}>
        <Text style={styles.riskText}>{item.riskLabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={olaylar.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: olaylar.border,
  },
  pressed: {
    opacity: 0.92,
  },
  thumbWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EEF5F1',
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: olaylar.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: olaylar.text,
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.textMuted,
  },
  resolvedAgo: {
    fontSize: 12,
    fontWeight: '600',
    color: olaylar.success,
    marginTop: 2,
  },
  riskPill: {
    backgroundColor: olaylar.successBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexShrink: 0,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
});
