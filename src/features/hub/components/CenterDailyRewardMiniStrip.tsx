import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterDailyRewardMiniStripModel } from '@/features/hub/utils/centerLowerDashboardUiPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';

type IconName = keyof typeof Ionicons.glyphMap;

type CenterDailyRewardMiniStripProps = {
  reward: CenterDailyRewardMiniStripModel;
};

function resolveIconName(iconKey: string | undefined, fallback: IconName = 'gift-outline'): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return fallback;
}

export function CenterDailyRewardMiniStrip({ reward }: CenterDailyRewardMiniStripProps) {
  return (
    <View style={styles.strip}>
      <View style={styles.icon}>
        <Ionicons name={resolveIconName(reward.iconKey)} size={15} color="#0D3F39" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {reward.label}
      </Text>
      <Text style={styles.reward} numberOfLines={1}>
        {reward.rewardText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.22)',
    backgroundColor: '#FFFCF5',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E3AF',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: '#173D3A',
  },
  reward: {
    flexShrink: 0,
    maxWidth: 104,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    color: '#9B741D',
  },
});
