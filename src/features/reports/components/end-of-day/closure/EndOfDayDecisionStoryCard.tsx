import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { EndOfDayDecisionStoryPresentation } from '@/features/reports/presentation/closure/endOfDayDecisionStoryPresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { spacing } from '@/ui/theme/spacing';
import { shadows } from '@/ui/theme/shadows';

const BADGE_TONES = {
  positive: { bg: '#E6F6EA', text: gameUi.colors.mintPositive },
  neutral: { bg: gameUi.colors.cardMintTint, text: gameUi.colors.primaryTealDark },
  warning: { bg: gameUi.colors.cardWarmTint, text: gameUi.colors.amberCaution },
  mixed: { bg: '#E8F2FA', text: '#327EA8' },
};

const IMPACT_TONES = {
  positive: gameUi.colors.mintPositive,
  neutral: gameUi.colors.primaryTealMid,
  warning: gameUi.colors.amberCaution,
};

type Props = {
  model: EndOfDayDecisionStoryPresentation;
  reducedMotion?: boolean;
};

export function EndOfDayDecisionStoryCard({ model, reducedMotion }: Props) {
  if (!model.visible) return null;

  const badge = BADGE_TONES[model.outcomeBadgeTone];
  const entering = reducedMotion ? undefined : FadeInUp.delay(120).duration(260).springify().damping(24);

  return (
    <Animated.View entering={entering} style={[styles.card, shadows.card]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="git-branch-outline" size={16} color={gameUi.colors.primaryTealDark} />
        </View>
        <Text style={styles.title}>Günün karar hikayesi</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]} numberOfLines={1}>
            {model.outcomeBadge}
          </Text>
        </View>
      </View>

      <Text style={styles.sentence} numberOfLines={3}>
        {model.decisionSentence}
      </Text>

      <View style={styles.impacts}>
        {model.impactLines.map((line) => (
          <View key={line.key} style={styles.impactRow}>
            <View style={[styles.impactDot, { backgroundColor: IMPACT_TONES[line.tone] }]} />
            <Text style={styles.impactText} numberOfLines={1}>
              {line.label}
            </Text>
          </View>
        ))}
      </View>

      {model.playerStyleTag ? (
        <View style={styles.styleTag}>
          <Ionicons name="person-outline" size={12} color={gameUi.colors.primaryTealMid} />
          <Text style={styles.styleTagText} numberOfLines={1}>
            {model.playerStyleTag}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: gameUi.colors.cardWhite,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: gameUi.colors.borderSoft,
    padding: spacing.md,
    gap: 12,
    minWidth: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: gameUi.colors.cardMintTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '800', color: gameUi.colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, maxWidth: '42%' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  sentence: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: gameUi.colors.textPrimary },
  impacts: { gap: 6 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactDot: { width: 6, height: 6, borderRadius: 3 },
  impactText: { fontSize: 13, fontWeight: '600', color: gameUi.colors.textMuted, flex: 1 },
  styleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: gameUi.colors.cardMintTint,
  },
  styleTagText: { fontSize: 11, fontWeight: '700', color: gameUi.colors.primaryTealDark },
});
