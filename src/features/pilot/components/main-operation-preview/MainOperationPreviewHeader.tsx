import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationPreviewHeaderProps = {
  subtitle: string;
  onBack: () => void;
  onInfo: () => void;
};

function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconBtn, cardShadow]}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}>
      <Ionicons name={icon} size={22} color={MAIN_OP_PREVIEW_COLORS.title} />
    </Pressable>
  );
}

export function MainOperationPreviewHeader({
  subtitle,
  onBack,
  onInfo,
}: MainOperationPreviewHeaderProps) {
  return (
    <View style={styles.wrap}>
      <HeaderIconButton
        icon="chevron-back"
        onPress={onBack}
        accessibilityLabel="Geri"
      />
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          Ana Operasyon Önizlemesi
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <HeaderIconButton
        icon="information-circle-outline"
        onPress={onInfo}
        accessibilityLabel="Bilgi"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 86,
    position: 'relative',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7DDC8',
    zIndex: 2,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: MAIN_OP_PREVIEW_COLORS.title,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: MAIN_OP_PREVIEW_COLORS.muted,
    textAlign: 'center',
  },
});
