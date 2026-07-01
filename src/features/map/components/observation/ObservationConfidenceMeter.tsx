import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { mapUi } from '@/features/map/utils/mapUiTokens';

type Props = {
  initial: number;
  current: number;
  animate: boolean;
  reducedMotion?: boolean;
};

export function ObservationConfidenceMeter({
  initial,
  current,
  animate,
  reducedMotion = false,
}: Props) {
  const [display, setDisplay] = useState(initial);

  useEffect(() => {
    if (!animate) {
      setDisplay(initial);
      return;
    }
    if (reducedMotion) {
      setDisplay(current);
      return;
    }
    const start = Date.now();
    const duration = 760;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(initial + (current - initial) * eased));
      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [animate, current, initial, reducedMotion]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Doğruluk</Text>
        <Text style={styles.value}>
          %{initial} → %{current}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${display}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: mapUi.textSoft,
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.mint,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: mapUi.teal,
  },
});
