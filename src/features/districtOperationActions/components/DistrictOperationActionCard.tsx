import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildDistrictOperationActionCandidates,
  buildDistrictOperationActionHubCopy,
  buildDistrictOperationActionMapCopy,
  type CreviaDistrictOperationAction,
} from '@/core/districtOperationActions';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';

type Props = {
  districtId?: MapDistrictId | string | null;
  source: 'hub_open_ended' | 'map_panel';
  compact?: boolean;
};

function selectAction(
  actions: CreviaDistrictOperationAction[],
): CreviaDistrictOperationAction | undefined {
  return (
    actions.find((action) => action.status === 'selected' || action.status === 'applied') ??
    actions.find((action) => action.status === 'available') ??
    actions.find((action) => action.status === 'preview_only') ??
    actions[0]
  );
}

export function DistrictOperationActionCard({
  districtId,
  source,
  compact = false,
}: Props) {
  const day = useGameStore((s) => s.gameState.city.day);
  const authorityState = useGameStore((s) => s.gameState.pilot.authorityState);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const operationalResources = useGameStore((s) => s.operationalResources);
  const crisisState = useGameStore((s) => s.crisisState);
  const actionState = useGameStore((s) => s.districtOperationActionState);
  const selectDistrictOperationAction = useGameStore(
    (s) => s.selectDistrictOperationAction,
  );

  const action = useMemo(
    () =>
      selectAction(
        buildDistrictOperationActionCandidates({
          day,
          focusDistrictId: districtId ?? operationSignals.priorityDistrictId,
          rankKey: authorityState?.formalRankId,
          unlockedPermissionIds: authorityState?.unlockedPermissionIds,
          operationSignals,
          resourceFatigue: operationalResources,
          crisisState,
          selectedByDay: actionState.selectedByDay,
          recentDistrictOperationKeys: actionState.recentDistrictOperationKeys,
        }),
      ),
    [
      actionState.recentDistrictOperationKeys,
      actionState.selectedByDay,
      authorityState?.formalRankId,
      authorityState?.unlockedPermissionIds,
      crisisState,
      day,
      districtId,
      operationSignals,
      operationalResources,
    ],
  );

  if (!action) return null;

  const disabled = !action.isSelectableNow;
  const title =
    source === 'map_panel'
      ? buildDistrictOperationActionMapCopy(action)
      : buildDistrictOperationActionHubCopy(action);
  const statusLabel =
    action.healthStatus === 'limited'
      ? 'Sınırlı etki'
      : action.status === 'preview_only'
        ? 'Önizleme'
        : 'Küçük hamle';

  return (
    <Pressable
      style={[
        styles.card,
        compact ? styles.compactCard : null,
        disabled ? styles.disabledCard : null,
      ]}
      disabled={disabled}
      onPress={() => selectDistrictOperationAction(action.id, action.districtId)}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={action.ctaLabel}>
      <View style={styles.iconWrap}>
        <Ionicons name="navigate-circle-outline" size={18} color="#0E5F5B" />
      </View>
      <View style={styles.copy}>
        <View style={styles.headerRow}>
          <Text style={styles.kicker} numberOfLines={1}>
            {statusLabel}
          </Text>
          <Text style={styles.cta} numberOfLines={1}>
            {action.ctaLabel}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.effect} numberOfLines={1}>
          {action.effectPreviewLine}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.16)',
    backgroundColor: '#F4FBF8',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  compactCard: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  disabledCard: {
    opacity: 0.76,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 143, 134, 0.12)',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  kicker: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '900',
    color: '#0E5F5B',
  },
  cta: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '800',
    color: '#3D615E',
  },
  title: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  effect: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
