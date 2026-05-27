import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';

import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { EventsOperasyonHeader } from '@/features/events/components/EventsOperasyonHeader';
import { CompactGameHeader } from '@/ui/components/CompactGameHeader';
import { DashboardHeader } from '@/ui/components/DashboardHeader';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export type GameScreenHeaderVariant = 'compact' | 'dashboard' | 'events' | 'none';

type GameScreenShellProps = {
  children: ReactNode;
  /** İçerik kaydırılabilir mi? */
  scrollable?: boolean;
  /** Üst header varyantı — dashboard yalnızca Merkez ekranı */
  headerVariant?: GameScreenHeaderVariant;
  /** @deprecated headerVariant kullanın */
  showHeader?: boolean;
  /** Üst çubuk scroll dışında sabit kalır */
  fixedHeader?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  safeEdges?: Edge[];
  backgroundColor?: string;
  /** Kompakt header'da gösterilecek ekran başlığı */
  screenTitle?: string;
};

/**
 * Ana oyun sekmeleri için ortak kabuk: SafeArea + oyun header'ı + içerik.
 * Alt sekme çubuğu expo-router Tabs (AnimatedTabBar) üzerinden gelir.
 */
export function GameScreenShell({
  children,
  scrollable = true,
  headerVariant = 'compact',
  showHeader,
  fixedHeader = true,
  style,
  contentStyle,
  safeEdges = ['left', 'right'],
  backgroundColor = colors.background,
  screenTitle = 'Crevia',
}: GameScreenShellProps) {
  const tabBarHeight = useAppTabBarHeight();
  const bottomPadding = tabBarHeight > 0 ? tabBarHeight + spacing.md : spacing.lg;
  const resolvedVariant: GameScreenHeaderVariant =
    showHeader === false ? 'none' : headerVariant;

  const headerNode =
    resolvedVariant === 'dashboard' ? (
      <DashboardHeader />
    ) : resolvedVariant === 'events' ? (
      <EventsOperasyonHeader />
    ) : resolvedVariant === 'compact' ? (
      <CompactGameHeader screenTitle={screenTitle} />
    ) : null;

  const paddedContent: ViewStyle[] = [
    styles.content,
    { paddingBottom: bottomPadding },
    contentStyle,
  ].filter(Boolean) as ViewStyle[];

  if (scrollable && fixedHeader) {
    return (
      <View style={[styles.root, { backgroundColor }, style]}>
        {headerNode}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={paddedContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    );
  }

  if (scrollable) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor }, style]}
        edges={safeEdges}>
        <ScrollView
          contentContainerStyle={paddedContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {headerNode}
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (fixedHeader) {
    return (
      <View style={[styles.root, { backgroundColor }, style]}>
        {headerNode}
        <View style={[styles.flexFill, paddedContent]}>{children}</View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor }, style]}
      edges={safeEdges}>
      {headerNode}
      <View style={paddedContent}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
});
