import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { PlanningDetailRoutePreview } from '@/features/events/utils/eventWorkflowPlanDetails';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanningRoutePreviewCardProps = {
  route: PlanningDetailRoutePreview;
};

export function PlanningRoutePreviewCard({ route }: PlanningRoutePreviewCardProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mapBlock}>
        <View style={styles.mapInner}>
          <View style={styles.mapDotStart} />
          <View style={styles.mapPath} />
          <View style={styles.mapDotMid} />
          <View style={styles.mapPathShort} />
          <View style={styles.mapDotEnd} />
          <Ionicons
            name="navigate"
            size={16}
            color={eventDetail.teal}
            style={styles.mapIcon}
          />
        </View>
      </View>

      <View style={styles.metaCol}>
        <View style={styles.routeRow}>
          <Text style={styles.routeLabel}>Başlangıç</Text>
          <Text style={styles.routeValue} numberOfLines={1}>
            {route.startLabel}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <Text style={styles.routeLabel}>Bitiş</Text>
          <Text style={styles.routeValue} numberOfLines={1}>
            {route.endLabel}
          </Text>
        </View>
        <View style={[styles.zonePill]}>
          <Ionicons name="location-outline" size={12} color={eventDetail.teal} />
          <Text style={styles.zoneText} numberOfLines={2}>
            {route.zoneLabel}
          </Text>
        </View>
        {route.savingsLabel ? (
          <Text style={styles.savings} numberOfLines={1}>
            {route.savingsLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  mapBlock: {
    width: 96,
    minHeight: 108,
    borderRadius: 14,
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.1)',
    padding: 10,
    justifyContent: 'center',
  },
  mapInner: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  mapDotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: eventDetail.tealDark,
  },
  mapPath: {
    width: 2,
    height: 22,
    backgroundColor: 'rgba(11, 107, 97, 0.25)',
    marginLeft: 3,
    borderRadius: 1,
  },
  mapDotMid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: eventDetail.teal,
    marginLeft: 1,
  },
  mapPathShort: {
    width: 2,
    height: 14,
    backgroundColor: 'rgba(11, 107, 97, 0.2)',
    marginLeft: 3,
    borderRadius: 1,
  },
  mapDotEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: eventDetail.teal,
    backgroundColor: '#FFFFFF',
    marginLeft: 0,
  },
  mapIcon: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    opacity: 0.85,
  },
  metaCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    justifyContent: 'center',
  },
  routeRow: {
    gap: 2,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  zoneText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.tealDark,
    lineHeight: 15,
  },
  savings: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A7A5C',
  },
});
