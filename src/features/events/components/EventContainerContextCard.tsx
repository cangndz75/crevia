import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { selectEventContainerContext } from '@/core/containers/containerSelectors';
import {
  buildEventContainerMainLine,
  buildEventContainerRiskLine,
  buildNeighborhoodContainerHint,
  formatContainerRecommendedAction,
  getContainerStatusTone,
  resolveEventContainerVisibility,
} from '@/core/containers/containerUiHelpers';
import type { ContainerState } from '@/core/containers/containerTypes';
import type { EventCard } from '@/core/models/EventCard';
import { isDay1LearningEventId } from '@/features/tutorial/tutorialTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type EventContainerContextCardProps = {
  event: EventCard;
  containerState: ContainerState;
};

export function EventContainerContextCard({
  event,
  containerState,
}: EventContainerContextCardProps) {
  const context = useMemo(
    () => selectEventContainerContext(containerState, event),
    [containerState, event],
  );

  const visibility = useMemo(
    () => resolveEventContainerVisibility(event, context.status),
    [context.status, event],
  );

  const isDay1TutorialEvent = isDay1LearningEventId(event.id);

  if (!visibility.visible || isDay1TutorialEvent) {
    return null;
  }

  const status = context.status;
  if (!status) {
    return null;
  }

  const tone = getContainerStatusTone(status.statusLabel);
  const actionLabel = formatContainerRecommendedAction(status.recommendedAction);

  const mainLine = visibility.compact
    ? buildNeighborhoodContainerHint(status)
    : buildEventContainerMainLine(status, context.worstUnit);

  const riskLine =
    !visibility.compact && context.worstUnit
      ? buildEventContainerRiskLine(context.worstUnit)
      : null;

  if (visibility.compact) {
    return (
      <View
        style={[
          compactStyles.row,
          { backgroundColor: tone.background, borderColor: tone.border },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`Konteyner bağlamı: ${mainLine}`}>
        <Ionicons name="trash-outline" size={14} color={tone.iconColor} />
        <Text style={[compactStyles.text, { color: tone.text }]} numberOfLines={2}>
          {mainLine}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, { backgroundColor: tone.background, borderColor: tone.border }]}
      accessibilityRole="summary"
      accessibilityLabel={`Konteyner bağlamı: ${mainLine}`}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
          <Ionicons name="trash" size={16} color={tone.iconColor} />
        </View>
        <Text style={[styles.title, { color: tone.text }]}>Konteyner Bağlamı</Text>
        <View style={[styles.statusChip, { borderColor: tone.border }]}>
          <Text style={[styles.statusChipText, { color: tone.text }]}>
            {status.statusLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.mainLine, { color: eventDetail.textDark }]}>{mainLine}</Text>

      {riskLine ? (
        <Text style={[styles.riskLine, { color: tone.muted }]}>{riskLine}</Text>
      ) : null}

      <View style={[styles.actionChip, { backgroundColor: tone.iconBackground }]}>
        <Text style={[styles.actionChipText, { color: tone.text }]}>
          {actionLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.smallRadius,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainLine: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  riskLine: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

const compactStyles = StyleSheet.create({
  row: {
    marginHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
