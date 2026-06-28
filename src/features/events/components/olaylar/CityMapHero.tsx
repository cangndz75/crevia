import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eventImages } from '@/core/assets/eventScreenAssets';
import { OlaylarIncidentTimeline } from '@/features/events/components/olaylar/OlaylarIncidentTimeline';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type {
  OlaylarLiveIncidentMapView,
  OlaylarTimelineItem,
  OlaylarTimelineTone,
} from '@/features/events/types/olaylarScreenTypes';
import { getMapHeroSource } from '@/features/events/utils/olaylarScreenPresentation';

type CityMapHeroProps = {
  mapView: OlaylarLiveIncidentMapView;
  timeline: OlaylarTimelineItem[];
  onLayersPress?: () => void;
};

const PIN_COLORS: Record<OlaylarTimelineTone, string> = {
  critical: olaylar.critical,
  urgent: olaylar.urgent,
  active: olaylar.active,
  resolved: olaylar.success,
};

const PIN_ICONS: Record<OlaylarTimelineTone, keyof typeof Ionicons.glyphMap> = {
  critical: 'alert-circle',
  urgent: 'notifications',
  active: 'flash',
  resolved: 'checkmark-circle',
};

function NetworkOverlay() {
  return (
    <View style={styles.networkOverlay} pointerEvents="none">
      <View style={[styles.networkLine, styles.networkLineA]} />
      <View style={[styles.networkLine, styles.networkLineB]} />
      <View style={[styles.networkLine, styles.networkLineC]} />
      <View style={styles.radarRingOuter} />
      <View style={styles.radarRingInner} />
    </View>
  );
}

export function CityMapHero({ mapView, timeline, onLayersPress }: CityMapHeroProps) {
  const mapSource = getMapHeroSource();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.liveDot} />
          <Text style={styles.title}>{mapView.title}</Text>
        </View>
        <Pressable
          onPress={onLayersPress}
          style={({ pressed }) => [styles.layersBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={mapView.layerButtonLabel}>
          <Ionicons name="layers-outline" size={13} color={olaylar.teal} />
          <Text style={styles.layersText}>{mapView.layerButtonLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.mapFrame}>
        {imageFailed ? (
          <LinearGradient
            colors={[olaylar.mapFallbackTop, olaylar.mapFallbackBottom]}
            style={styles.mapImage}
          />
        ) : (
          <Image
            source={mapSource}
            style={styles.mapImage}
            contentFit="cover"
            placeholder={eventImages.cityMapHero}
            transition={0}
            onError={() => setImageFailed(true)}
          />
        )}

        <LinearGradient
          colors={[
            'rgba(6, 22, 20, 0.15)',
            'rgba(6, 22, 20, 0.35)',
            'rgba(6, 22, 20, 0.72)',
          ]}
          locations={[0, 0.45, 1]}
          style={styles.fade}
        />

        <NetworkOverlay />

        {mapView.pins.map((pin) => (
          <View
            key={pin.id}
            style={[
              styles.pin,
              { left: pin.left, top: pin.top },
            ]}>
            {pin.pulse ? <View style={styles.pulseRing} /> : null}
            <View
              style={[
                styles.pinDot,
                pin.pulse && styles.pinDotLarge,
                { backgroundColor: PIN_COLORS[pin.tone] },
              ]}>
              <Ionicons
                name={PIN_ICONS[pin.tone]}
                size={pin.pulse ? 16 : 12}
                color="#FFFFFF"
              />
            </View>
          </View>
        ))}

        <View style={styles.crosshair}>
          <Ionicons name="scan-outline" size={14} color="rgba(255,255,255,0.45)" />
        </View>

        <OlaylarIncidentTimeline items={timeline} liveLabel={mapView.liveLabel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: olaylar.liveDot,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: olaylar.textSoft,
    letterSpacing: 0.5,
  },
  layersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  layersText: {
    fontSize: 11,
    fontWeight: '700',
    color: olaylar.teal,
  },
  mapFrame: {
    height: olaylar.mapHeight,
    borderRadius: olaylar.radiusHero,
    overflow: 'hidden',
    backgroundColor: olaylar.mapFallbackTop,
    borderWidth: 1,
    borderColor: olaylar.borderStrong,
    ...olaylar.shadow,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  fade: {
    ...StyleSheet.absoluteFillObject,
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -14,
    marginTop: -14,
  },
  pinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  pinDotLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  crosshair: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(4, 18, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: olaylar.border,
  },
  pressed: {
    opacity: 0.88,
  },
  networkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  networkLine: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: 'rgba(20, 184, 166, 0.32)',
    transformOrigin: 'left center',
  },
  networkLineA: {
    left: '18%',
    top: '42%',
    width: '32%',
    transform: [{ rotate: '-8deg' }],
  },
  networkLineB: {
    left: '48%',
    top: '36%',
    width: '26%',
    transform: [{ rotate: '18deg' }],
  },
  networkLineC: {
    left: '34%',
    top: '58%',
    width: '16%',
    height: 1,
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
    transform: [{ rotate: '-32deg' }],
  },
  radarRingOuter: {
    position: 'absolute',
    left: '48%',
    top: '36%',
    width: 76,
    height: 76,
    marginLeft: -38,
    marginTop: -38,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  radarRingInner: {
    position: 'absolute',
    left: '48%',
    top: '36%',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
});
