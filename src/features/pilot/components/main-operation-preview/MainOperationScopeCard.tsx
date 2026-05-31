import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { MainOperationCardBanner } from '@/features/pilot/components/main-operation-preview/MainOperationCardBanner';
import type { MainOpPreviewScopeRow } from '@/features/pilot/utils/mainOperationPreviewUiModel';
import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationScopeCardProps = {
  rows: MainOpPreviewScopeRow[];
  decorImage: ImageSource;
};

function ScopeRow({ row }: { row: MainOpPreviewScopeRow }) {
  return (
    <View style={styles.row}>
      {row.thumbSource ? (
        <HubAssetImage
          source={row.thumbSource}
          containerStyle={styles.thumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="map" size={16} color={MAIN_OP_PREVIEW_COLORS.blue} />
        </View>
      )}

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {row.title}
        </Text>
        <View style={styles.trackRow}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, Math.max(0, row.progressPercent))}%` },
              ]}
            />
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>
              {row.pillLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function MainOperationScopeCard({ rows, decorImage }: MainOperationScopeCardProps) {
  return (
    <View style={[styles.card, cardShadow]}>
      <MainOperationCardBanner
        source={decorImage}
        height={64}
        borderRadius={14}
        style={styles.banner}
        overlayColors={['rgba(248,251,255,0.15)', 'rgba(248,251,255,0.95)']}
      />

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="map-outline" size={20} color={MAIN_OP_PREVIEW_COLORS.blue} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle}>Sıradaki Kapsam</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            Yetki ve pilot performansın gelecek operasyon alanlarını şekillendirir.
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {rows.map((row) => (
          <ScopeRow key={row.id} row={row} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MAIN_OP_PREVIEW_RADIUS.card,
    padding: 16,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#DDE7F5',
    overflow: 'hidden',
  },
  banner: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: MAIN_OP_PREVIEW_COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE7F5',
    overflow: 'hidden',
    backgroundColor: '#EAF2FF',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
    lineHeight: 17,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    minWidth: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8E2D8',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#2F5DBF',
  },
  pill: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.chip,
    borderWidth: 1,
    borderColor: '#D8D0C2',
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
});
