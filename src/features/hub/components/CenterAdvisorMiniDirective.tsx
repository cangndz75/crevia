import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterAdvisorMiniDirectivePresentation } from '@/features/hub/utils/centerHubDepthPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type CenterAdvisorMiniDirectiveProps = {
  presentation: CenterAdvisorMiniDirectivePresentation;
  reducedMotion?: boolean;
};

export function CenterAdvisorMiniDirective({
  presentation,
  reducedMotion = false,
}: CenterAdvisorMiniDirectiveProps) {
  const router = useRouter();

  if (presentation.visibility !== 'visible' || !presentation.directive.trim()) {
    return null;
  }

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (presentation.cta.route) pushHubRoute(router, presentation.cta.route);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.985}
      disabled={!presentation.cta.route}
      accessibilityRole="button"
      accessibilityLabel={`${presentation.advisorName} önerisi. ${presentation.directive}`}
      style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={15} color="#0D3F39" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label} numberOfLines={1}>
          {presentation.advisorName}
        </Text>
        <Text style={styles.directive} numberOfLines={2}>
          {presentation.directive}
        </Text>
      </View>
      <View style={styles.ctaPill}>
        <Text style={styles.ctaText} numberOfLines={1}>
          {presentation.cta.label}
        </Text>
        <Ionicons name="chevron-forward" size={12} color="#0D3F39" />
      </View>
    </CreviaAnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.22)',
    backgroundColor: '#F4FBF8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E3AF',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#07564F',
    textTransform: 'uppercase',
  },
  directive: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#173D3A',
  },
  ctaPill: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    backgroundColor: '#F5E3AF',
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  ctaText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D3F39',
    maxWidth: 72,
  },
});
