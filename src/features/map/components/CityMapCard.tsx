import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { getPilotPreset } from '../data/mapSelectors';
import { districtFromPilotArea } from '../data/pilotAreaMapping';
import type { ActiveLayers, MapFilterId, PilotAreaId } from '../types/map';
import { LOCKED_REGION_MESSAGE } from '../types/map';
import { MapLegend } from './MapLegend';
import { StyledPilotMap } from './StyledPilotMap';

type Props = {
  pilotAreaId: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  gameDay: number;
  activeLayers: ActiveLayers;
  activeEvents: EventCard[];
  onLayersPress: () => void;
  onPinPress?: (pinId: string) => void;
};

export function CityMapCard({
  pilotAreaId,
  selectedDistrictId,
  selectedFilter,
  gameDay,
  activeLayers,
  activeEvents,
  onLayersPress,
  onPinPress,
}: Props) {
  const preset = getPilotPreset(pilotAreaId);
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const handleRegionPress = (areaId: PilotAreaId) => {
    const districtId = districtFromPilotArea(areaId);
    if (districtId !== selectedDistrictId) {
      setLockedModalVisible(true);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.card, shadows.card]}>
      <View style={styles.focusBadge}>
        <Ionicons name="locate" size={12} color={preset.themeColor} />
        <Text style={[styles.focusBadgeText, { color: preset.themeColor }]}>
          {preset.mapFocusLabel}
        </Text>
        {activeEvents.length > 0 && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>
              {activeEvents.length} aktif olay
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mapArea}>
        <StyledPilotMap
          selectedPilotArea={pilotAreaId}
          selectedDistrictId={selectedDistrictId}
          selectedFilter={selectedFilter}
          activeLayers={activeLayers}
          gameDay={gameDay}
          events={activeEvents}
          onRegionPress={handleRegionPress}
          onPinPress={onPinPress}
        />

        <MapLegend filter={selectedFilter} />

        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.zoomBtn}>
            <Ionicons name="locate" size={16} color={preset.themeColor} />
          </Pressable>
        </View>

        <Pressable style={styles.layersBtn} onPress={onLayersPress}>
          <Ionicons name="layers" size={16} color={colors.textPrimary} />
          <Text style={styles.layersBtnText}>Katmanlar</Text>
        </Pressable>
      </View>

      <Modal
        visible={lockedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLockedModalVisible(false)}
        >
          <View style={[styles.modalCard, shadows.card]}>
            <Ionicons name="lock-closed" size={28} color={colors.textSecondary} />
            <Text style={styles.modalTitle}>{LOCKED_REGION_MESSAGE.title}</Text>
            <Text style={styles.modalBody}>{LOCKED_REGION_MESSAGE.body}</Text>
            <Pressable
              style={styles.modalBtn}
              onPress={() => setLockedModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>Tamam</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  focusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  mapArea: {
    height: 300,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F4F0E6',
  },
  zoomControls: {
    position: 'absolute',
    left: 12,
    top: 12,
    gap: 6,
    zIndex: 10,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  layersBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    zIndex: 10,
    ...shadows.soft,
  },
  layersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 320,
    width: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
