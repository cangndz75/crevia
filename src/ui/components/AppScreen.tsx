import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type SafeEdge = 'top' | 'bottom' | 'left' | 'right';

type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  safeEdges?: SafeEdge[];
};

export function AppScreen({
  children,
  scrollable = true,
  style,
  contentStyle,
  safeEdges = ['top', 'left', 'right'],
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding =
    tabBarHeight > 0
      ? tabBarHeight + spacing.md
      : insets.bottom + spacing.lg;

  const paddedContent = [
    styles.content,
    { paddingBottom: bottomPadding },
    contentStyle,
  ];

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={safeEdges}>
        <ScrollView
          contentContainerStyle={paddedContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={safeEdges}>
      <View style={paddedContent}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
});
