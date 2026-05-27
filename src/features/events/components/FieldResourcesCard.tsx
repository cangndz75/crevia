import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { FieldResourceRow } from '@/features/events/utils/eventDetailDecisionUtils';
import { shadows } from '@/ui/theme/shadows';

type FieldResourcesCardProps = {
  rows: FieldResourceRow[];
  onViewAll?: () => void;
};

function loadColor(tone: FieldResourceRow['loadTone']): string {
  switch (tone) {
    case 'high':
      return eventDetail.orange;
    case 'medium':
      return eventDetail.orange;
    default:
      return eventDetail.success;
  }
}

function rowIcon(name: FieldResourceRow['icon']) {
  switch (name) {
    case 'car':
      return 'car-outline' as const;
    case 'construct':
      return 'construct-outline' as const;
    default:
      return 'people-outline' as const;
  }
}

function LoadIndicator({ percent, tone }: { percent: number; tone: FieldResourceRow['loadTone'] }) {
  const color = loadColor(tone);
  return (
    <View style={indicatorStyles.wrap}>
      <View style={[indicatorStyles.ring, { borderColor: color }]}>
        <View
          style={[
            indicatorStyles.fill,
            {
              height: `${Math.min(100, percent)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function FieldResourcesCard({ rows, onViewAll }: FieldResourcesCardProps) {
  return (
    <View style={[styles.outer, shadows.card]}>
      <LinearGradient
        colors={[eventDetail.tealDark, '#0A5A54', eventDetail.teal]}
        style={styles.gradient}>
        <View style={styles.decor}>
          <View style={[styles.decorBar, { height: 48 }]} />
          <View style={[styles.decorBar, { height: 32 }]} />
          <View style={[styles.decorBar, { height: 56 }]} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>SAHA KAYNAKLARI: AKTİF</Text>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>Tümünü Gör →</Text>
          </Pressable>
        </View>

        {rows.map((row, index) => (
          <View key={row.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <Pressable style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name={rowIcon(row.icon)} size={18} color="#FFFFFF" />
              </View>
              <View style={styles.mid}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {row.subtitle}
                </Text>
                {row.pill ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText} numberOfLines={1}>
                      {row.pill}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.right}>
                <Text style={styles.loadLabel} numberOfLines={1}>
                  {row.loadLabel}
                </Text>
                <LoadIndicator percent={row.loadPercent} tone={row.loadTone} />
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          </View>
        ))}
      </LinearGradient>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  wrap: {
    marginVertical: 2,
  },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: {
    width: '100%',
    borderRadius: 2,
    opacity: 0.85,
  },
});

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.cardRadius,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    paddingTop: 14,
  },
  decor: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    flexDirection: 'row',
    gap: 4,
    opacity: 0.12,
  },
  decorBar: {
    width: 14,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    maxWidth: '100%',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: 88,
  },
  loadLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
  },
});
