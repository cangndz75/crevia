import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { eventImages } from '@/core/assets/eventScreenAssets';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import { getMapHeroSource } from '@/features/events/utils/olaylarScreenPresentation';

export function CityMapHero() {
  const mapSource = getMapHeroSource();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.mapFrame}>
        {imageFailed ? (
          <LinearGradient colors={['#EEF5F1', '#DCEFE8']} style={styles.mapImage} />
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
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(248,250,248,1)']}
          locations={[0.5, 0.82, 1]}
          style={styles.fade}
        />

        <View style={[styles.pin, styles.pinLeft]}>
          <View style={[styles.pinDot, styles.pinUrgent]}>
            <Ionicons name="notifications" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={[styles.pin, styles.pinCenter]}>
          <View style={styles.pulseRing} />
          <View style={[styles.pinDot, styles.pinCritical]}>
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View style={[styles.pin, styles.pinRight]}>
          <View style={[styles.pinDot, styles.pinResolved]}>
            <Ionicons name="leaf" size={12} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: olaylar.screenPadding,
  },
  mapFrame: {
    height: olaylar.mapHeight,
    borderRadius: olaylar.radiusHero,
    overflow: 'hidden',
    backgroundColor: '#EEF5F1',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 69, 0.08)',
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
  },
  pinLeft: {
    left: '18%',
    top: '42%',
  },
  pinCenter: {
    left: '50%',
    top: '34%',
    marginLeft: -24,
  },
  pinRight: {
    right: '16%',
    top: '48%',
  },
  pinDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinCritical: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: olaylar.critical,
  },
  pinUrgent: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: olaylar.urgent,
  },
  pinResolved: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: olaylar.success,
  },
  pulseRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
});
