import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type GestureRootProviderProps = {
  children: ReactNode;
};

/** GestureDetector / RNGH bileşenleri için zorunlu kök sarmalayıcı. */
export function GestureRootProvider({ children }: GestureRootProviderProps) {
  return (
    <GestureHandlerRootView style={styles.root}>{children}</GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
