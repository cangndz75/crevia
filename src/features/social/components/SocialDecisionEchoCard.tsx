import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { SocialDecisionEchoModel } from '@/core/socialEcho/socialEchoTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  echo: SocialDecisionEchoModel | null | undefined;
  compact?: boolean;
};

const TONE_ACCENT: Record<SocialDecisionEchoModel['tone'], string> = {
  teal: colors.primary,
  mint: '#3D9B8F',
  amber: '#C98A2E',
  coral: '#D4736E',
  neutral: colors.textSecondary,
};

export function SocialDecisionEchoCard({ echo, compact }: Props) {
  if (!echo) {
    return null;
  }

  const isCompact = compact === true || echo.visibility === 'compact';
  const accent = TONE_ACCENT[echo.tone] ?? colors.primary;
  const iconName = (echo.iconKey || 'pulse-outline') as ComponentProps<
    typeof Ionicons
  >['name'];

  return (
    <Animated.View
      entering={FadeInUp.delay(280).duration(320)}
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        echo.visibility === 'highlighted' && styles.cardHighlighted,
        { borderLeftColor: accent },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={iconName} size={16} color={accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {echo.title}
        </Text>
        <Text style={styles.summary} numberOfLines={echo.maxLines}>
          {echo.mention}
        </Text>
        {echo.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {echo.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
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
    borderLeftWidth: 3,
    borderColor: SOCIAL_CARD_BORDER,
    minWidth: 0,
  },
  cardCompact: {
    paddingVertical: 8,
  },
  cardHighlighted: {
    backgroundColor: 'rgba(26,143,138,0.06)',
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
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    minWidth: 0,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    maxWidth: '48%',
    minWidth: 0,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
