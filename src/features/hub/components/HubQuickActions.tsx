import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { getQuickActionIcon } from '@/features/hub/utils/hubAssets';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const ACTIONS = [
  {
    id: 'team' as const,
    label: 'Ekip Ata',
    description: 'Hızlı müdahale',
    bg: colors.primaryMuted,
  },
  {
    id: 'route' as const,
    label: 'Rota Oluştur',
    description: 'Gecikmeyi azalt',
    bg: colors.secondaryMuted,
  },
  {
    id: 'maint' as const,
    label: 'Bakım Başlat',
    description: 'Arıza riskini düşür',
    bg: colors.warningMuted,
  },
  {
    id: 'announce' as const,
    label: 'Duyuru Yap',
    description: 'Halkı bilgilendir',
    bg: colors.purpleMuted,
  },
];

function ActionTile({
  action,
  onPress,
}: {
  action: (typeof ACTIONS)[number];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${action.label}, ${action.description}`}>
      <View style={styles.iconBadge}>
        <View style={[styles.iconInner, { backgroundColor: action.bg }]}>
          <HubAssetImage
            source={getQuickActionIcon(action.id)}
            containerStyle={styles.iconImage}
            contentFit="contain"
          />
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.textCol}>
          <Text style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {action.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

export function HubQuickActions() {
  const useQuickAction = useGameStore((s) => s.useQuickAction);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hızlı Aksiyonlar</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <ActionTile
            key={a.id}
            action={a}
            onPress={() => useQuickAction(a.id)}
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
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 0,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: 18,
    height: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textCol: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
    lineHeight: 15,
  },
  description: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 13,
  },
});
