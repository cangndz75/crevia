import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  buildOperationalResourceDetailSheetModel,
  buildOperationalResourceEngineInputFromStore,
} from '@/core/operationalResources/operationalResourcePresentation';
import type {
  OperationalContainerNetworkDetailRow,
  OperationalPersonnelDetailRow,
  OperationalResourceDetailTabId,
  OperationalVehicleDetailRow,
} from '@/core/operationalResources/operationalResourceTypes';
import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
} from '@/features/hub/utils/hubPremiumPresentation';
import { useGameStore } from '@/store/useGameStore';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const TONE_COLORS = {
  positive: { text: '#0F6B64', bg: 'rgba(15, 143, 134, 0.1)', pill: '#0F8F86' },
  neutral: { text: '#4A5F5B', bg: 'rgba(100, 130, 125, 0.1)', pill: '#6B7F7B' },
  warning: { text: '#9A6B12', bg: 'rgba(245, 230, 200, 0.55)', pill: '#C4922A' },
  critical: { text: '#8B5A14', bg: 'rgba(232, 180, 120, 0.35)', pill: '#B87318' },
} as const;

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  walk: 'walk-outline',
  construct: 'construct-outline',
  megaphone: 'megaphone-outline',
  bus: 'bus-outline',
  build: 'build-outline',
  navigate: 'navigate-outline',
  city: 'business-outline',
  home: 'home-outline',
  factory: 'construct-outline',
  route: 'git-branch-outline',
  leaf: 'leaf-outline',
};

function resolveIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[iconKey] ?? resolveIoniconForRegistryKey(iconKey);
}

type DetailRow =
  | OperationalPersonnelDetailRow
  | OperationalVehicleDetailRow
  | OperationalContainerNetworkDetailRow;

function ResourceDetailRowCard({ row }: { row: DetailRow }) {
  const palette = TONE_COLORS[row.tone];
  const chips =
    'workloadLabel' in row
      ? [row.workloadLabel, row.fatigueLabel, row.moraleLabel]
      : 'capacityLabel' in row
        ? [row.capacityLabel, row.maintenanceLabel, row.routeLabel]
        : [row.fillLabel, row.cleanlinessLabel, row.maintenanceLabel, row.socialLabel];

  return (
    <View style={[styles.detailRow, { backgroundColor: palette.bg }]}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleRow}>
          <Ionicons name={resolveIcon(row.iconKey)} size={18} color={palette.pill} />
          <Text style={[styles.detailLabel, { color: palette.text }]} numberOfLines={1}>
            {row.label}
          </Text>
        </View>
        <View style={[styles.statusPill, { borderColor: palette.pill }]}>
          <Text style={[styles.statusPillText, { color: palette.pill }]} numberOfLines={1}>
            {row.statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {chip}
            </Text>
          </View>
        ))}
      </View>
      {'usageLine' in row ? (
        <Text style={styles.usageLine} numberOfLines={1}>
          {row.usageLine}
        </Text>
      ) : null}
      <Text style={styles.summary} numberOfLines={2}>
        {row.summary}
      </Text>
      <Text style={styles.recommendation} numberOfLines={2}>
        {row.recommendationLine}
      </Text>
    </View>
  );
}

export function OperationalResourcesDetailSheet({ visible, onClose }: Props) {
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const operationSignals = useGameStore((s) => s.operationSignals);
  const dailyOperationsPlan = useGameStore((s) => s.dailyOperationsPlan);
  const assignments = useGameStore((s) => s.assignments);
  const microDecisionState = useGameStore((s) => s.microDecisionState);
  const crisisActionState = useGameStore((s) => s.crisisActionState);
  const operationalResources = useGameStore((s) => s.operationalResources);

  const sheetModel = useMemo(() => {
    if (!visible) {
      return undefined;
    }
    const input = buildOperationalResourceEngineInputFromStore({
      gameState,
      monetization,
      operationSignals,
      dailyOperationsPlan,
      assignments,
      microDecisionState,
      crisisActionState,
      operationalResources,
    });
    return buildOperationalResourceDetailSheetModel(input);
  }, [
    visible,
    assignments,
    crisisActionState,
    dailyOperationsPlan,
    gameState,
    microDecisionState,
    monetization,
    operationSignals,
    operationalResources,
  ]);

  const [activeTab, setActiveTab] = useState<OperationalResourceDetailTabId>('personnel');

  useEffect(() => {
    if (visible && sheetModel) {
      setActiveTab(sheetModel.defaultTabId);
    }
  }, [visible, sheetModel]);

  if (!visible || !sheetModel) {
    return null;
  }

  const tabId = activeTab;

  const activeRows =
    tabId === 'personnel'
      ? sheetModel.personnelRows
      : tabId === 'vehicles'
        ? sheetModel.vehicleRows
        : sheetModel.containerRows;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={1}>
            {sheetModel.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {sheetModel.subtitle}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}>
            {sheetModel.tabs.map((tab) => {
              const selected = tabId === tab.id;
              const palette = TONE_COLORS[tab.tone];
              return (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.tab,
                    selected && styles.tabSelected,
                    selected ? { borderColor: palette.pill } : null,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  accessibilityRole="button">
                  <Text
                    style={[styles.tabLabel, selected && { color: palette.pill }]}
                    numberOfLines={1}>
                    {tab.label}
                  </Text>
                  <Text style={styles.tabSummary} numberOfLines={1}>
                    {tab.summary}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}>
            {activeRows.map((row) => (
              <ResourceDetailRowCard
                key={'id' in row ? row.id : row.districtId}
                row={row}
              />
            ))}
            <Text style={styles.footerNote} numberOfLines={3}>
              {sheetModel.footerNote}
            </Text>
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.closeBtn, getPressFeedbackStyle({ pressed })]}
            onPress={onClose}
            accessibilityRole="button">
            <Text style={styles.closeBtnText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 40, 38, 0.35)',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFCF7',
    borderTopLeftRadius: HUB_PREMIUM_RADIUS.card + 4,
    borderTopRightRadius: HUB_PREMIUM_RADIUS.card + 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 10,
    minWidth: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 143, 134, 0.25)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 12,
    color: HUB_PREMIUM_COLORS.textMuted,
    flexShrink: 1,
  },
  tabScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    minWidth: 100,
    maxWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.15)',
    backgroundColor: '#F4FBF8',
    gap: 2,
  },
  tabSelected: {
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  tabSummary: {
    fontSize: 10,
    color: HUB_PREMIUM_COLORS.textMuted,
    flexShrink: 1,
  },
  bodyScroll: {
    maxHeight: 360,
    minWidth: 0,
  },
  bodyContent: {
    gap: 8,
    paddingBottom: 4,
  },
  detailRow: {
    borderRadius: 12,
    padding: 12,
    gap: 6,
    minWidth: 0,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '48%',
    minWidth: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A5F5B',
    flexShrink: 1,
  },
  usageLine: {
    fontSize: 11,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  summary: {
    fontSize: 12,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  recommendation: {
    fontSize: 11,
    color: '#6B5A40',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  footerNote: {
    fontSize: 11,
    color: HUB_PREMIUM_COLORS.textMuted,
    marginTop: 4,
    flexShrink: 1,
  },
  closeBtn: {
    alignSelf: 'stretch',
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
