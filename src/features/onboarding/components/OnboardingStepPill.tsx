import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type OnboardingStepPillProps = {
  label: string;
  tone?: 'info' | 'new';
};

export function OnboardingStepPill({
  label,
  tone = 'info',
}: OnboardingStepPillProps) {
  return (
    <View
      style={[
        styles.pill,
        tone === 'new' ? styles.pillNew : styles.pillInfo,
      ]}>
      <Text
        style={[
          styles.text,
          tone === 'new' ? styles.textNew : styles.textInfo,
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillInfo: {
    backgroundColor: '#E8F4F2',
  },
  pillNew: {
    backgroundColor: '#FFF4E0',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textInfo: {
    color: colors.headerTealDark,
  },
  textNew: {
    color: '#8A5A12',
  },
});
