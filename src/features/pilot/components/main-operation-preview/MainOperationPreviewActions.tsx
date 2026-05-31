import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationPreviewActionsProps = {
  onLeaderboard: () => void;
  onAchievements: () => void;
  onPilotReport: () => void;
};

function SideAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, styles.btnOutline, cardShadow]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={MAIN_OP_PREVIEW_COLORS.title} />
      <Text style={styles.btnOutlineText} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MainOperationPreviewActions({
  onLeaderboard,
  onAchievements,
  onPilotReport,
}: MainOperationPreviewActionsProps) {
  return (
    <View style={styles.row}>
      <SideAction label="Liderliği Gör" icon="podium-outline" onPress={onLeaderboard} />

      <Pressable
        onPress={onAchievements}
        style={[styles.btn, styles.btnGold, cardShadow]}
        accessibilityRole="button"
        accessibilityLabel="Başarılarım">
        <Ionicons name="trophy" size={20} color="#FFFDF6" />
        <Text style={styles.btnGoldText} numberOfLines={2}>
          Başarılarım
        </Text>
      </Pressable>

      <SideAction
        label="Pilot Raporuna Dön"
        icon="document-text-outline"
        onPress={onPilotReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    minWidth: 0,
    height: 60,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.small + 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 4,
  },
  btnOutline: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7E0D1',
  },
  btnOutlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.title,
    textAlign: 'center',
    lineHeight: 14,
  },
  btnGold: {
    backgroundColor: '#D5A72C',
    borderWidth: 1,
    borderColor: '#C99922',
  },
  btnGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFDF6',
    textAlign: 'center',
    lineHeight: 14,
  },
});
