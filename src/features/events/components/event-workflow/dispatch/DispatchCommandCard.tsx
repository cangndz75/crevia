import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { DispatchScreenModel } from '@/features/events/utils/eventWorkflowDispatchFieldPresentation';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  model: DispatchScreenModel;
};

export function DispatchCommandCard({ model }: Props) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="navigate" size={16} color={eventDetail.tealDark} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            Operasyon komuta
          </Text>
          {model.selectedDecisionTitle ? (
            <Text style={styles.planTitle} numberOfLines={1}>
              {model.selectedDecisionTitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.riskPill}>
          <Text style={styles.riskText} numberOfLines={1}>
            {model.riskLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.goal} numberOfLines={2}>
        {model.commandGoalLine}
      </Text>

      {model.selectedTradeoff ? (
        <Text style={styles.tradeoff} numberOfLines={2}>
          {model.selectedTradeoff}
        </Text>
      ) : null}
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
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
    letterSpacing: 0.3,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  riskPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: eventDetail.mint,
    maxWidth: '34%',
    flexShrink: 1,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
  goal: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: eventDetail.textDark,
  },
  tradeoff: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: eventDetail.textMuted,
  },
});
