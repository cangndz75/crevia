import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlanDetail, PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  buildPlanDetailTabMetrics,
  type PlanDetailMetric,
  type PlanDetailTabId,
} from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanDetailsInspectSectionProps = {
  selectedPlanId: PlanOptionId;
  selectedPlan: PlanDetail;
};

const TABS: {
  id: PlanDetailTabId;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'resource', label: 'Kaynak', icon: 'cube-outline' },
  { id: 'personnel', label: 'Personel', icon: 'people-outline' },
  { id: 'citizen', label: 'Vatandaş', icon: 'heart-outline' },
];

function PlanDetailMetricTile({ metric }: { metric: PlanDetailMetric }) {
  return (
    <View style={styles.metricTile}>
      <View style={styles.metricIconWrap}>
        <Ionicons name={metric.icon} size={16} color={eventDetail.teal} />
      </View>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {metric.label}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {metric.value}
      </Text>
    </View>
  );
}

function PlanDetailMetricCard({ metrics }: { metrics: PlanDetailMetric[] }) {
  return (
    <View style={[styles.metricCard, shadows.soft]}>
      <View style={styles.metricRow}>
        {metrics.map((metric, index) => (
          <View key={metric.label} style={styles.metricCellWrap}>
            {index > 0 ? <View style={styles.metricDivider} /> : null}
            <PlanDetailMetricTile metric={metric} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function PlanDetailsInspectSection({
  selectedPlanId,
  selectedPlan,
}: PlanDetailsInspectSectionProps) {
  const [activeTab, setActiveTab] = useState<PlanDetailTabId>('resource');

  const metrics = useMemo(
    () => buildPlanDetailTabMetrics(activeTab, selectedPlanId, selectedPlan),
    [activeTab, selectedPlan, selectedPlanId],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Detayları İncele
      </Text>

      <View style={styles.tabShell}>
        {TABS.map((tab, index) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                index > 0 ? styles.tabWithDivider : null,
                active ? styles.tabActive : styles.tabIdle,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? '#FFFFFF' : eventDetail.textMuted}
              />
              <Text
                style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
                numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PlanDetailMetricCard metrics={metrics} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.2,
  },
  tabShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: eventDetail.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 4,
    minHeight: 50,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabWithDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(6, 63, 59, 0.06)',
  },
  tabActive: {
    backgroundColor: eventDetail.tealDark,
  },
  tabIdle: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: eventDetail.textMuted,
    flexShrink: 1,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  metricCard: {
    backgroundColor: eventDetail.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.07)',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricCellWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(6, 63, 59, 0.1)',
    marginVertical: 4,
  },
  metricTile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    textAlign: 'center',
  },
});
