import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { olaylar } from '@/features/events/theme/olaylarScreenTokens';

type EventsBottomSheetProps = {
  children: ReactNode;
  bottomInset: number;
};

/** Harita altı içerik paneli — statik, tab bar ile hizalı. */
export function EventsBottomSheet({ children, bottomInset }: EventsBottomSheetProps) {
  return (
    <View style={styles.sheet}>
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    marginTop: olaylar.sheetOverlap,
    backgroundColor: olaylar.card,
    borderTopLeftRadius: olaylar.radiusSheet,
    borderTopRightRadius: olaylar.radiusSheet,
    overflow: 'hidden',
    ...olaylar.sheetElevation,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: olaylar.screenPadding,
    paddingTop: 4,
    gap: 14,
  },
});
