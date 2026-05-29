import { StyleSheet, Text, View } from 'react-native';

import type { HubScreenLayoutModel } from '@/features/hub/utils/hubScreenPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  layout: HubScreenLayoutModel;
};

export function HubOperationContextStrip({ layout }: Props) {
  if (!layout.showOperationContextStrip || !layout.contextChip) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.chip}>
        <Text style={styles.chipText} numberOfLines={1}>
          {layout.contextChip}
        </Text>
      </View>
      {layout.focusMode === 'post_pilot_agenda' ? (
        <Text style={styles.hint} numberOfLines={1}>
          Pilot sonrası saha hazırlığı
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    minWidth: 0,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.18)',
    flexShrink: 1,
    maxWidth: '72%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.1,
  },
  hint: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
