import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { MapBubbleMotionCue, MapDistrictMotionCue, MapJournalMotionCue } from '@/core/mapReactionsMotion/mapReactionMotionTypes';
import { getNeighborhoodMapCharacterLine } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import type { MapActiveOperationOverlayModel } from '@/features/map/utils/mapUiPresentation';
import type { MapMotionPresentationResult } from '@/features/map/utils/mapMotionPresentation';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

import { type MapDistrictId } from '../data/mapAssets';
import type { MapPresenceViewModel } from '@/core/mapPresence/mapPresenceTypes';
import type { ActiveLayers, MapFilterId, MapViewMode, PilotAreaId } from '../types/map';
import { getMapDistrictLabel } from '../utils/mapDistrictLabels';
import { CreviaBaseMap, type CreviaBaseMapControls } from './CreviaBaseMap';
import { MapReactionMotionHints } from './MapReactionMotionHints';

type Props = {
  viewMode: MapViewMode;
  detailDistrictId: MapDistrictId;
  pilotAreaId: PilotAreaId;
  selectedDistrictId: PilotDistrictId;
  selectedFilter: MapFilterId;
  gameDay: number;
  activeLayers: ActiveLayers;
  activeEvents: EventCard[];
  containerState?: ContainerState;
  vehicleState?: VehicleState;
  hideContainerSignals?: boolean;
  hideVehicleSignals?: boolean;
  selectedPinId?: string | null;
  crisisHighlightDistrictIds?: MapDistrictId[];
  resourceHighlightDistrictIds?: MapDistrictId[];
  reactionHighlightDistrictIds?: MapDistrictId[];
  reactionMotionCues?: MapDistrictMotionCue[];
  operationScopeMotionDistrictIds?: MapDistrictId[];
  journalMotionCue?: MapJournalMotionCue;
  bubbleMotionCue?: MapBubbleMotionCue;
  reducedMotionMode?: boolean;
  mapPresenceViewModel?: MapPresenceViewModel | null;
  activeOperationOverlay?: MapActiveOperationOverlayModel | null;
  activeOperationCard?: ActiveOperationMapCardModel | null;
  mapMotionPresentation?: MapMotionPresentationResult | null;
  onLayersPress: () => void;
  onDistrictSelect: (districtId: MapDistrictId) => void;
  onBackToOverview: () => void;
  onPinPress?: (pinId: string) => void;
  embedded?: boolean;
};

export function CityMapCard({
  viewMode,
  detailDistrictId,
  journalMotionCue,
  bubbleMotionCue,
  reducedMotionMode = false,
  activeOperationOverlay = null,
  activeOperationCard = null,
  mapMotionPresentation = null,
  onLayersPress,
  onDistrictSelect,
  onBackToOverview,
  embedded = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const mapControlsRef = useRef<CreviaBaseMapControls>(null);
  const isDetail = viewMode === 'detail';
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
  const detailLabel = getMapDistrictLabel(detailDistrictId);
  const detailCharacterLine = getNeighborhoodMapCharacterLine(detailDistrictId);
  const headerTop = Math.max(12, insets.top + 4);
  const floatingTop = headerTop + 80;
  const operationTitle =
    activeOperationCard?.title ?? activeOperationOverlay?.eventName ?? 'Aktif operasyon';
  const operationPhaseLabel =
    activeOperationCard?.phaseLabel ?? activeOperationOverlay?.title ?? 'Canli Operasyon';
  const operationMapLine =
    activeOperationCard?.mapLine ?? activeOperationOverlay?.timeLabel ?? 'Harita uzerinde izleniyor';
  const operationDecisionLine =
    activeOperationCard?.decisionLine ?? 'Operasyon detayini acarak sonraki adimi kontrol et.';
  const operationSupportLine =
    activeOperationCard?.routeLine ??
    activeOperationCard?.districtLine ??
    activeOperationCard?.pressureLine;
  const operationCtaLabel = activeOperationCard?.ctaLabel ?? 'Takip Et';

  const handleDistrictPress = useCallback(
    (districtId: MapDistrictId) => {
      onDistrictSelect(districtId);
    },
    [onDistrictSelect],
  );

  const handleFollowOperation = useCallback(() => {
    setBottomSheetVisible(false);
    mapControlsRef.current?.focusOnPoint({ x: 520, y: 505 }, 2.05);
  }, []);

  return (
    <View style={[styles.card, embedded && styles.cardEmbedded, shadows.card]}>
      <View style={[styles.header, { top: headerTop }]} pointerEvents="box-none">
        <Text style={styles.headerTitle} numberOfLines={1}>
          Harita
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerCircle}
            onPress={onLayersPress}
            accessibilityLabel="Harita filtreleri">
            <Ionicons name="filter-outline" size={23} color={mapUi.gold} />
          </Pressable>
        </View>
      </View>

      <View style={styles.mapArea}>
        <CreviaBaseMap
          ref={mapControlsRef}
          mode="fullscreen"
          contentFit="cover"
          districtMotionMarkers={mapMotionPresentation?.markers}
          reducedMotionMode={reducedMotionMode}
          onDistrictPress={handleDistrictPress}
        />

        {!isDetail ? (
          <MapReactionMotionHints
            journalCue={journalMotionCue}
            bubbleCue={bubbleMotionCue}
            reducedMotionMode={reducedMotionMode}
          />
        ) : null}

        {isDetail ? (
          <Pressable
            onPress={onBackToOverview}
            style={[styles.detailBackChip, { top: floatingTop }]}
            accessibilityLabel="Sehir haritasina don">
            <Ionicons name="chevron-back" size={16} color={mapUi.teal} />
            <View style={styles.detailBackCopy}>
              <Text style={styles.detailBackTitle} numberOfLines={1}>
                {detailLabel}
              </Text>
              {detailCharacterLine ? (
                <Text style={styles.detailBackSub} numberOfLines={1}>
                  {detailCharacterLine}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.liveOperationCard, { top: floatingTop }]}
            onPress={() => setBottomSheetVisible(true)}
            accessibilityLabel={activeOperationCard?.accessibilityLabel ?? 'Canli operasyon detayini ac'}>
            <View style={styles.liveIconWrap}>
              <Ionicons name="radio-outline" size={34} color={mapUi.teal} />
            </View>
            <View style={styles.liveCopy}>
              <View style={styles.liveEyebrowRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveEyebrow} numberOfLines={1}>
                  {operationPhaseLabel}
                </Text>
              </View>
              <Text style={styles.liveTitle} numberOfLines={1}>
                {operationTitle}
              </Text>
              <View style={styles.liveMetaRow}>
                <Ionicons name="map-outline" size={15} color={mapUi.textDark} />
                <Text style={styles.liveMetaText} numberOfLines={2}>
                  {operationMapLine}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={mapUi.textDark} />
          </Pressable>
        )}

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomIn()}
            accessibilityLabel="Yakinlastir">
            <Ionicons name="add" size={24} color={mapUi.textDark} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => mapControlsRef.current?.zoomOut()}
            accessibilityLabel="Uzaklastir">
            <Ionicons name="remove" size={24} color={mapUi.textDark} />
          </Pressable>
          <Pressable
            style={[styles.zoomBtn, styles.zoomBtnAccent]}
            onPress={() => mapControlsRef.current?.reset()}
            accessibilityLabel="Haritayi sigdir">
            <Ionicons name="locate-outline" size={22} color={mapUi.textDark} />
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={onLayersPress}
            accessibilityLabel="Harita katmanlari">
            <Ionicons name="layers-outline" size={22} color={mapUi.textDark} />
          </Pressable>
        </View>

        {isBottomSheetVisible ? (
          <View style={[styles.bottomSheet, { bottom: Math.max(14, tabBarHeight + 8) }]}>
            <Pressable
              style={styles.sheetCloseButton}
              onPress={() => setBottomSheetVisible(false)}
              accessibilityLabel="Operasyon kartini kapat">
              <Ionicons name="close" size={18} color={mapUi.textDark} />
            </Pressable>
            <View style={styles.sheetContent}>
              <View style={styles.operationBadgeWrap}>
                <View style={styles.operationBadge}>
                  <Ionicons name="leaf-outline" size={24} color={mapUi.tealDark} />
                </View>
                <View style={styles.badgeStatusDot} />
              </View>

              <View style={styles.sheetMain}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {operationTitle}
                </Text>
                <View style={styles.sheetMetaRow}>
                  <Ionicons name="pulse-outline" size={14} color={mapUi.textSecondary} />
                  <Text style={styles.sheetMetaText} numberOfLines={1}>
                    {operationPhaseLabel}
                  </Text>
                </View>
                <Text style={styles.sheetLineText} numberOfLines={2}>
                  {operationMapLine}
                </Text>
                <Text style={styles.sheetLineText} numberOfLines={2}>
                  {operationDecisionLine}
                </Text>
                {operationSupportLine ? (
                  <Text style={styles.sheetSupportText} numberOfLines={2}>
                    {operationSupportLine}
                  </Text>
                ) : null}
                <View style={styles.sheetActionRow}>
                  <View style={styles.xpChip}>
                    <Text style={styles.xpText} numberOfLines={1}>
                      100 XP
                    </Text>
                    <Ionicons name="star" size={13} color={mapUi.gold} />
                  </View>
                  <Pressable
                    style={styles.followButton}
                    onPress={handleFollowOperation}
                    accessibilityLabel="Operasyonu takip et">
                    <Text style={styles.followText} numberOfLines={1}>
                      {operationCtaLabel}
                    </Text>
                    <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: mapUi.screenPadding,
    borderRadius: 28,
    backgroundColor: colors.hubCream,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.1)',
  },
  cardEmbedded: {
    marginHorizontal: 0,
  },
  header: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 56,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.soft,
  },
  headerTitle: {
    position: 'absolute',
    left: 70,
    right: 70,
    textAlign: 'center',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
    textShadowColor: 'rgba(0, 45, 42, 0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapArea: {
    flex: 1,
    minHeight: 640,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.hubCream,
  },
  detailBackChip: {
    position: 'absolute',
    left: 18,
    right: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 18,
    ...shadows.soft,
  },
  detailBackCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  detailBackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  detailBackSub: {
    fontSize: 11,
    fontWeight: '600',
    color: mapUi.textSecondary,
  },
  liveOperationCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    maxWidth: 430,
    minHeight: 92,
    zIndex: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    ...shadows.card,
  },
  liveIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,246,241,0.74)',
    flexShrink: 0,
  },
  liveCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  liveEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: mapUi.teal,
  },
  liveEyebrow: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '800',
    color: mapUi.tealDark,
  },
  liveTitle: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
    color: mapUi.textDark,
    letterSpacing: 0,
  },
  liveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  liveMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: mapUi.textDark,
  },
  zoomControls: {
    position: 'absolute',
    left: 18,
    top: '40%',
    gap: 12,
    zIndex: 20,
  },
  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.soft,
  },
  zoomBtnAccent: {
    borderColor: mapUi.goldBorder,
  },
  bottomSheet: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 24,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.card,
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231,246,241,0.86)',
    zIndex: 2,
  },
  sheetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 28,
  },
  operationBadgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    ...shadows.soft,
  },
  operationBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mapUi.mint,
  },
  badgeStatusDot: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: mapUi.teal,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sheetMain: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  sheetTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: mapUi.textDark,
    letterSpacing: 0,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  sheetMetaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
    color: mapUi.textSecondary,
  },
  sheetLineText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: mapUi.textDark,
  },
  sheetSupportText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: mapUi.textSecondary,
  },
  sheetDotSep: {
    fontSize: 13,
    fontWeight: '800',
    color: mapUi.textSecondary,
    paddingHorizontal: 2,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  xpChip: {
    minWidth: 76,
    height: 30,
    borderRadius: 12,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: mapUi.goldSoft,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A6F10',
  },
  followButton: {
    minWidth: 104,
    height: 40,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: mapUi.tealDark,
    borderWidth: 1,
    borderColor: mapUi.gold,
    ...shadows.soft,
  },
  followText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
