import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import type { LastDecisionSocialEchoModel } from '../utils/socialPulsePresentation';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  model: LastDecisionSocialEchoModel;
};

export function SocialDecisionEchoCard({ model }: Props) {
  return (
    <Animated.View entering={FadeInUp.delay(280).duration(320)} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="pulse-outline" size={16} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {model.summary}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 17,
  },
});
