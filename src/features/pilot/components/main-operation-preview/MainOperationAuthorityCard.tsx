import type { ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import type { OperationPreviewAuthoritySummary } from '@/core/authority/authorityPresentation';
import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationAuthorityCardProps = {
  summary: OperationPreviewAuthoritySummary;
  decorImage: ImageSource;
};

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function MainOperationAuthorityCard({
  summary,
  decorImage,
}: MainOperationAuthorityCardProps) {
  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.iconCircle}>
            <HubAssetImage
              source={creviaAssets.authority.shieldCheck}
              containerStyle={styles.iconAsset}
              contentFit="contain"
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Yetki Durumu</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              Resmi unvan yalnızca dönem sonu değerlendirmesiyle güncellenir.
            </Text>
          </View>
        </View>
        <HubAssetImage
          source={decorImage}
          containerStyle={styles.decor}
          contentFit="contain"
        />
      </View>

      <View style={styles.divider} />
      <InfoBlock label="Mevcut Yetki" value={summary.currentRankLabel} />
      <View style={styles.divider} />
      <InfoBlock label="Son Değerlendirme" value={summary.evaluationLabel} />
      <View style={styles.divider} />
      <InfoBlock
        label="Ana Operasyon İçin"
        value={summary.mainOperationRequirementLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MAIN_OP_PREVIEW_RADIUS.card,
    padding: 16,
    backgroundColor: '#FBF8FF',
    borderWidth: 1,
    borderColor: '#E5DCF5',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 88,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconAsset: {
    width: 30,
    height: 30,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  decor: {
    width: 88,
    height: 88,
    marginTop: -8,
    marginRight: -8,
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
  divider: {
    height: 1,
    backgroundColor: MAIN_OP_PREVIEW_COLORS.divider,
    marginVertical: 12,
  },
  block: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161B22',
    lineHeight: 20,
  },
});
