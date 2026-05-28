import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Accent = 'teal' | 'violet';

const HEADER_GRADIENT: Record<Accent, readonly [string, string]> = {
  teal: ['#E6F5F4', '#FFFFFF'],
  violet: ['#EDE5F7', '#FFFFFF'],
};

type Props = {
  visible: boolean;
  onClose: () => void;
  accent: Accent;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SocialBottomSheet({
  visible,
  onClose,
  accent,
  icon,
  title,
  subtitle,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      {visible ? (
        <View style={styles.overlay}>
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
            style={StyleSheet.absoluteFill}>
            <Pressable style={styles.backdrop} onPress={onClose} />
          </Animated.View>

          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(280)}
            exiting={SlideOutDown.duration(220)}
            style={[
              styles.sheet,
              shadows.card,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}>
            <View style={styles.handle} />

            <LinearGradient
              colors={[...HEADER_GRADIENT[accent]]}
              style={styles.header}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.headerIcon,
                    accent === 'teal' ? styles.headerIconTeal : styles.headerIconViolet,
                  ]}>
                  <Ionicons
                    name={icon}
                    size={22}
                    color={accent === 'teal' ? colors.primary : '#7B5BB8'}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>{title}</Text>
                  {subtitle ? (
                    <Text style={styles.headerSubtitle}>{subtitle}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.closeBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat">
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

export function SocialSheetListItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 50).duration(350)}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,28,30,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl + 4,
    borderTopRightRadius: radius.xxl + 4,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconTeal: {
    backgroundColor: colors.primaryMuted,
  },
  headerIconViolet: {
    backgroundColor: '#F0E8FC',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.35,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    opacity: 0.85,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 10,
  },
});
