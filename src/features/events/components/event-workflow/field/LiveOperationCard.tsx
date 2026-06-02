import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldScreenModel } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { shadows } from '@/ui/theme/shadows';

import type { CreviaActiveTaskRouteUiModel } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';

type Props = {
  model: FieldScreenModel;
  routePreview?: CreviaActiveTaskRouteUiModel | null;
};

export function LiveOperationCard({ model, routePreview }: Props) {
  const routeLine = routePreview?.visible ? routePreview.fieldLine : undefined;
  const activeStep = routePreview?.activeStepIndex ?? 1;
  const stepCount = routePreview?.steps.length ?? 3;

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.liveDot} />
        <Text style={styles.status} numberOfLines={1}>
          {model.operationStatus}
        </Text>
      </View>

      <Text style={styles.detail} numberOfLines={2}>
        {model.operationDetail}
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${model.progressPercent}%` }]}
        />
      </View>

      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel} numberOfLines={1}>
          {model.progressLabel}
        </Text>
        <View style={styles.timeline}>
          {Array.from({ length: Math.min(stepCount, 4) }).map((_, step) => (
            <View
              key={step}
              style={[
                styles.timelineDot,
                step <= activeStep && styles.timelineDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {routeLine ? (
        <View style={styles.routeRow}>
          <Ionicons name="git-network-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.routeText} numberOfLines={2}>
            {routeLine}
          </Text>
        </View>
      ) : (
        <View style={styles.routeRow}>
          <Ionicons name="git-network-outline" size={13} color={eventDetail.teal} />
          <Text style={styles.routeText} numberOfLines={1}>
            Rota etkisi izleniyor · {model.location}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: eventDetail.teal,
  },
  status: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
    flex: 1,
    minWidth: 0,
  },
  detail: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: eventDetail.mintSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: eventDetail.teal,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  progressLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4DAD8',
  },
  timelineDotActive: {
    backgroundColor: eventDetail.teal,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
});
