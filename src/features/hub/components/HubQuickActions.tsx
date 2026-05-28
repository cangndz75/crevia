import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getQuickActionIcon } from '@/features/hub/utils/hubAssets';
import {
  handleHubQuickAction,
  type HubQuickActionId,
} from '@/features/hub/utils/hubQuickActions';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const ACTIONS: {
  id: HubQuickActionId;
  label: string;
  bg: string;
}[] = [
  {
    id: 'team',
    label: 'Ekip Yönet',
    bg: colors.primaryMuted,
  },
  {
    id: 'route',
    label: 'Rota Planla',
    bg: colors.secondaryMuted,
  },
  {
    id: 'maint',
    label: 'Bakım Kontrol',
    bg: colors.warningMuted,
  },
  {
    id: 'announce',
    label: 'Duyuru Yap',
    bg: colors.purpleMuted,
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ActionTile({
  action,
  onPress,
}: {
  action: (typeof ACTIONS)[number];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      style={[styles.tile, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={action.label}>
      <View style={[styles.iconInner, { backgroundColor: action.bg }]}>
        <HubAssetImage
          source={getQuickActionIcon(action.id)}
          containerStyle={styles.iconImage}
          contentFit="contain"
        />
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{action.label}</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

export function HubQuickActions() {
  const router = useRouter();

  const onActionPress = useCallback(
    (actionId: HubQuickActionId) => {
      handleHubQuickAction(actionId, router);
    },
    [router],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hızlı Aksiyonlar</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <ActionTile
            key={a.id}
            action={a}
            onPress={() => onActionPress(a.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    ...shadows.soft,
  },
  iconInner: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    paddingHorizontal: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 13,
    flexShrink: 1,
  },
});
