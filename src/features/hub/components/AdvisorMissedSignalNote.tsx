import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AdvisorMissedSignalPresentation } from '@/core/advisors/advisorTypes';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
} from '@/features/hub/utils/hubPremiumPresentation';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';

type AdvisorMissedSignalNoteProps = {
  model: AdvisorMissedSignalPresentation;
  onAcknowledge?: () => void;
};

export function AdvisorMissedSignalNote({
  model,
  onAcknowledge,
}: AdvisorMissedSignalNoteProps) {
  const handlePress = () => {
    if (!onAcknowledge) return;
    playLightImpactHaptic();
    onAcknowledge();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={1}>
        {model.title}
      </Text>
      <Text style={styles.body} numberOfLines={3} ellipsizeMode="tail">
        {model.body}
      </Text>
      <Text style={styles.footer} numberOfLines={2}>
        {model.footer}
      </Text>
      {model.showCta ? (
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={model.ctaLabel}
          style={({ pressed }) => [
            styles.cta,
            getPressFeedbackStyle({ pressed }),
          ]}>
          <Text style={styles.ctaText} numberOfLines={1}>
            {model.ctaLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(15, 143, 134, 0.06)',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.1)',
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.tealDark,
    flexShrink: 1,
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    color: '#3D4F4C',
    flexShrink: 1,
  },
  footer: {
    fontSize: 10,
    color: '#6B7F7B',
    flexShrink: 1,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: HUB_PREMIUM_COLORS.tealDark,
    maxWidth: '100%',
    minWidth: 0,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    flexShrink: 1,
  },
});
