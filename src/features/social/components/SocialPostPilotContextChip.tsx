import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  line: string;
};

export function SocialPostPilotContextChip({ line }: Props) {
  return (
    <View style={styles.chip}>
      <Ionicons name="trail-sign-outline" size={13} color={colors.secondary} />
      <Text style={styles.text} numberOfLines={2}>
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.16)',
    minWidth: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    lineHeight: 15,
  },
});
