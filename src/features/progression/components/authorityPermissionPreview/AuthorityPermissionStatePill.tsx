import { StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewState } from '@/core/authority/authorityPermissionPreviewTypes';
import { resolveAuthorityPermissionStateStyle } from '@/features/progression/utils/authorityPermissionPreviewTheme';

type AuthorityPermissionStatePillProps = {
  label: string;
  state: AuthorityPermissionPreviewState;
};

export function AuthorityPermissionStatePill({
  label,
  state,
}: AuthorityPermissionStatePillProps) {
  const style = resolveAuthorityPermissionStateStyle(state);

  return (
    <View
      style={[styles.pill, { backgroundColor: style.pillBg }]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Text style={[styles.text, { color: style.pillText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
