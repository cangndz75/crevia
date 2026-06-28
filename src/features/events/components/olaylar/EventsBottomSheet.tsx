import { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';

type EventsBottomSheetProps = {
  children: ReactNode;
  bottomInset: number;
};

/** Olaylar scroll içerik kabı — tab bar ile hizalı. */
export function EventsBottomSheet({ children, bottomInset }: EventsBottomSheetProps) {
  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + olaylar.scrollBottomPad },
      ]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: olaylar.screenPadding,
    paddingTop: 2,
    gap: 14,
  },
});
