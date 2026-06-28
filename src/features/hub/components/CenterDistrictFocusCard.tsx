import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterDistrictFocusPresentation } from '@/features/hub/utils/centerHubDepthPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type CenterDistrictFocusCardProps = {
  presentation: CenterDistrictFocusPresentation;
  reducedMotion?: boolean;
};

export function CenterDistrictFocusCard({
  presentation,
  reducedMotion = false,
}: CenterDistrictFocusCardProps) {
  const router = useRouter();

  if (presentation.visibility !== 'visible') {
    return null;
  }

  const statsLine = `${presentation.developmentLabel} · ${presentation.populationLabel} · Talep ${presentation.demandLabel}`;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            BÖLGE ODAĞI
          </Text>
          <Text style={styles.districtName} numberOfLines={1}>
            {presentation.districtName}
          </Text>
          <Text style={styles.statsLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {statsLine}
          </Text>
          <Text style={styles.opportunity} numberOfLines={2}>
            {presentation.domainLabel ?? presentation.opportunityLabel}
          </Text>
        </View>
        <View style={styles.mapIcon}>
          <Ionicons name="map-outline" size={18} color="#F5E3AF" />
        </View>
      </View>
      <CreviaAnimatedPressable
        onPress={() => {
          if (presentation.cta.route) pushHubRoute(router, presentation.cta.route);
        }}
        reducedMotion={reducedMotion}
        pressScale={0.985}
        disabled={!presentation.cta.route}
        accessibilityRole="button"
        accessibilityLabel={`${presentation.districtName}. ${presentation.cta.label}`}
        style={styles.ctaPill}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {presentation.cta.label}
        </Text>
        <Ionicons name="chevron-forward" size={13} color="#0D3F39" />
      </CreviaAnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.22)',
    backgroundColor: '#0D3F39',
    padding: 14,
    gap: 10,
    shadowColor: 'rgba(15, 60, 52, 0.18)',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: '#F5E3AF',
  },
  districtName: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statsLine: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#9DF2D2',
  },
  opportunity: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  mapIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,227,175,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.18)',
    flexShrink: 0,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    minHeight: CENTER_MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#F5E3AF',
    paddingHorizontal: 12,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D3F39',
  },
});
