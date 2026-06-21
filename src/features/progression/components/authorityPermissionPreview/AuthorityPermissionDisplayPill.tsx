import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionDisplayState } from '@/features/progression/utils/authorityPermissionsTabPresentation';
import { resolveAuthorityPermissionDisplayStyle } from '@/features/progression/utils/authorityPermissionPreviewTheme';

type AuthorityPermissionDisplayPillProps = {
  label: string;
  displayState: AuthorityPermissionDisplayState;
};

export function AuthorityPermissionDisplayPill({
  label,
  displayState,
}: AuthorityPermissionDisplayPillProps) {
  const style = resolveAuthorityPermissionDisplayStyle(displayState);

  return (
    <View
      style={[styles.pill, { backgroundColor: style.pillBg }]}
      accessibilityRole="text"
      accessibilityLabel={label}>
      <Ionicons name={style.icon} size={11} color={style.pillText} />
      <Text style={[styles.text, { color: style.pillText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
