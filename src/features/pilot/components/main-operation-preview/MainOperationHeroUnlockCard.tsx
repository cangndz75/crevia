import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationHeroUnlockCardProps = {
  cityImage: ImageSource;
  badgeImage?: ImageSource;
};

export function MainOperationHeroUnlockCard({
  cityImage,
  badgeImage,
}: MainOperationHeroUnlockCardProps) {
  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.left}>
        {badgeImage ? (
          <HubAssetImage
            source={badgeImage}
            containerStyle={styles.badge}
            contentFit="contain"
          />
        ) : (
          <View style={styles.badgeFallback}>
            <Ionicons name="business" size={28} color={MAIN_OP_PREVIEW_COLORS.gold} />
          </View>
        )}

        <Text style={styles.title}>
          Şehir Ölçeğine{'\n'}Geçiş Hazırlanıyor
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          Pilot bölgede aldığın kararlar, ana operasyondaki şehir stratejine temel
          olacak.
        </Text>

        <View style={styles.ctaPill}>
          <Ionicons name="lock-closed" size={14} color="#7A520F" />
          <Text style={styles.ctaText}>Yakında Açılacak</Text>
        </View>
      </View>

      <View style={styles.visualWrap} pointerEvents="none">
        <LinearGradient
          colors={['#FFFBF1', 'rgba(255,251,241,0.55)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.visualMask}
        />
        <HubAssetImage
          source={cityImage}
          containerStyle={styles.visualImage}
          contentFit="contain"
        />
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={20} color="#B88A16" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    minHeight: 188,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.hero,
    borderWidth: 1,
    borderColor: '#D9B85E',
    backgroundColor: '#FFFBF1',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  left: {
    flex: 1,
    minWidth: 0,
    maxWidth: '52%',
    padding: 16,
    paddingRight: 8,
    gap: 8,
    zIndex: 2,
  },
  badge: {
    width: 56,
    height: 56,
  },
  badgeFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MAIN_OP_PREVIEW_COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.heroTitle,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: MAIN_OP_PREVIEW_COLORS.heroBody,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.chip,
    backgroundColor: '#F7E5B8',
    borderWidth: 1,
    borderColor: '#E2C36E',
    marginTop: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A520F',
  },
  visualWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '58%',
    height: '108%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  visualMask: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  lockBadge: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7E5B8',
    borderWidth: 1,
    borderColor: '#E2C36E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
