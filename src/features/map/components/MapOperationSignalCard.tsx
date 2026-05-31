import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { MapOperationSignalModel } from '@/features/map/presentation/mapScreenPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: MapOperationSignalModel;
  onTrack?: () => void;
  onActionPress?: () => void;
};

const AVATAR_COLORS = ['#0F8F86', '#2477A8', '#D59A14', '#7C6CB0'];

export function MapOperationSignalCard({ model, onTrack, onActionPress }: Props) {
  const { width } = useWindowDimensions();
  const showThumbnail = width >= 360;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.headerRow}>
        <View style={styles.signalIcon}>
          <CreviaAssetImage
            source={creviaAssets.icons.signals.beaconTeal}
            containerStyle={styles.signalAsset}
            contentFit="contain"
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {model.eyebrow}
          </Text>
        </View>
        <View style={styles.districtChip}>
          <Ionicons name="location-outline" size={12} color={mapUi.teal} />
          <Text style={styles.districtChipText} numberOfLines={1}>
            {model.districtLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {model.title}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem} numberOfLines={1}>
          {model.startsAtLabel}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaItem} numberOfLines={1}>
          {model.teamLabel}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaItem} numberOfLines={1}>
          {model.vehicleLabel}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {model.description}
      </Text>

      <Pressable style={styles.actionRow} onPress={onActionPress}>
        <Ionicons name="navigate-outline" size={14} color={mapUi.teal} />
        <Text style={styles.actionText} numberOfLines={1}>
          {model.actionLabel}
        </Text>
      </Pressable>

      <View style={styles.footerRow}>
        <View style={styles.avatarRow}>
          {model.crewInitials.map((initial, index) => (
            <View
              key={`${initial}-${index}`}
              style={[
                styles.avatar,
                { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length], marginLeft: index > 0 ? -8 : 0 },
              ]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          ))}
          {model.extraCrewCount > 0 ? (
            <View style={[styles.avatar, styles.avatarMore]}>
              <Text style={styles.avatarMoreText}>+{model.extraCrewCount}</Text>
            </View>
          ) : null}
        </View>

        {showThumbnail ? (
          <View style={styles.thumbnail}>
            <CreviaAssetImage
              source={creviaAssets.map.markers.truck}
              containerStyle={styles.thumbnailAsset}
              contentFit="contain"
            />
          </View>
        ) : null}

        <Pressable style={styles.cta} onPress={onTrack}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {model.ctaLabel}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.1)',
    padding: 16,
    gap: 10,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  signalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: mapUi.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  signalAsset: {
    width: 24,
    height: 24,
  },
  thumbnailAsset: {
    width: 40,
    height: 40,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.teal,
  },
  districtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: mapUi.mintSoft,
    flexShrink: 0,
    maxWidth: 130,
  },
  districtChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: mapUi.teal,
    flexShrink: 1,
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: mapUi.teal,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    marginTop: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },
  avatarMore: {
    backgroundColor: colors.backgroundAlt,
    marginLeft: -8,
  },
  avatarMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: mapUi.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.headerTealDark,
    paddingHorizontal: 14,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
    flexShrink: 1,
  },
});
