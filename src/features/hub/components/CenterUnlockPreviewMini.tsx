import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterUnlockPreviewMiniPresentation } from '@/features/hub/utils/centerHubDepthPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type IconName = keyof typeof Ionicons.glyphMap;

type CenterUnlockPreviewMiniProps = {
  presentation: CenterUnlockPreviewMiniPresentation;
  reducedMotion?: boolean;
};

function resolveIconName(iconKey: string | undefined): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return 'lock-closed-outline';
}

export function CenterUnlockPreviewMini({
  presentation,
  reducedMotion = false,
}: CenterUnlockPreviewMiniProps) {
  const router = useRouter();

  if (presentation.visibility !== 'visible' || !presentation.unlockCondition.trim()) {
    return null;
  }

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (presentation.routeKey) pushHubRoute(router, presentation.routeKey);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.985}
      disabled={!presentation.routeKey}
      accessibilityRole="button"
      accessibilityLabel={`${presentation.featureTitle}. ${presentation.unlockCondition}`}
      style={styles.strip}>
      <View style={styles.iconWrap}>
        <Ionicons name={resolveIconName(presentation.iconKey)} size={14} color="#9B741D" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {presentation.featureTitle}
        </Text>
        <Text style={styles.condition} numberOfLines={1}>
          {presentation.unlockCondition}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#9B741D" />
    </CreviaAnimatedPressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.22)',
    borderStyle: 'dashed',
    backgroundColor: '#FFFCF5',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,227,175,0.35)',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: '#173D3A',
  },
  condition: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#6B7D78',
  },
});
