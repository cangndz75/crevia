import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type OnboardingMissionCardProps = {
  lead?: string;
  body: string;
};

export function OnboardingMissionCard({ lead, body }: OnboardingMissionCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.card, shadows.soft]}>
      <View style={styles.iconWrap}>
        <Ionicons name="locate-outline" size={22} color={colors.textInverse} />
      </View>
      <Text style={styles.text}>
        {lead ? <Text style={styles.lead}>{lead} </Text> : null}
        {body}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  lead: {
    fontWeight: '800',
    color: colors.primary,
  },
});
