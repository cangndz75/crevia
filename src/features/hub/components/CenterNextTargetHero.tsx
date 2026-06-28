import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterNextTargetHeroPresentation } from '@/features/hub/utils/centerHubGameplayPresentation';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type IconName = keyof typeof Ionicons.glyphMap;

type CenterNextTargetHeroProps = {
  presentation: CenterNextTargetHeroPresentation;
  reducedMotion?: boolean;
};

function resolveIconName(iconKey: string | undefined): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return 'arrow-forward-circle-outline';
}

export function CenterNextTargetHero({
  presentation,
  reducedMotion = false,
}: CenterNextTargetHeroProps) {
  const router = useRouter();

  if (presentation.visibility !== 'visible' || !presentation.title.trim()) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#FFFCF5', '#F7EEDB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${presentation.eyebrow}. ${presentation.title}`}>
      <Image
        source={hubAssets.day1Plan.heroBuilding}
        style={styles.image}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(255,252,245,0.96)', 'rgba(255,252,245,0.74)', 'rgba(7,49,45,0.74)']}
        locations={[0, 0.52, 1]}
        style={styles.overlay}
      />

      <View style={styles.topRow}>
        <View style={styles.eyebrowPill}>
          <Ionicons name="flag-outline" size={12} color="#0D5048" />
          <Text style={styles.eyebrow} numberOfLines={1}>
            {presentation.eyebrow}
          </Text>
        </View>
        {presentation.statusLabel ? (
          <Text style={styles.statusLabel} numberOfLines={1}>
            {presentation.statusLabel}
          </Text>
        ) : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.iconBadge}>
          <Ionicons name={resolveIconName(presentation.iconKey)} size={20} color="#F5E3AF" />
        </View>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.84}>
          {presentation.title}
        </Text>
        {presentation.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {presentation.subtitle}
          </Text>
        ) : null}
      </View>

      <CreviaAnimatedPressable
        onPress={() => {
          if (presentation.routeKey) pushHubRoute(router, presentation.routeKey);
        }}
        reducedMotion={reducedMotion}
        pressScale={0.975}
        disabled={!presentation.routeKey}
        accessibilityRole="button"
        accessibilityLabel={presentation.title}
        style={[styles.cta, !presentation.routeKey ? styles.ctaDisabled : undefined]}>
        <Text style={styles.ctaText} numberOfLines={1}>
          Hedefe Git
        </Text>
        <View style={styles.ctaIcon}>
          <Ionicons name="chevron-forward" size={16} color="#0D5048" />
        </View>
      </CreviaAnimatedPressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 184,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.14)',
    padding: 14,
    gap: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(15, 60, 52, 0.14)',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  image: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '64%',
    height: '78%',
    opacity: 0.92,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrowPill: {
    minHeight: 28,
    maxWidth: '70%',
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7,86,79,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.12)',
  },
  eyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: '#0D5048',
    textTransform: 'uppercase',
  },
  statusLabel: {
    maxWidth: '28%',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: '#8A6B19',
    textAlign: 'right',
  },
  copy: {
    zIndex: 1,
    maxWidth: '72%',
    minWidth: 0,
    gap: 7,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D5048',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.36)',
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: '#173D3A',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#5E6B64',
  },
  cta: {
    zIndex: 1,
    alignSelf: 'flex-start',
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D5048',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.42)',
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: '#F5E3AF',
  },
  ctaIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E3AF',
  },
});
