import { StyleSheet, View } from 'react-native';
import type { ImageSource } from 'expo-image';

import { MainOperationAuthorityCard } from '@/features/pilot/components/main-operation-preview/MainOperationAuthorityCard';
import { MainOperationScopeCard } from '@/features/pilot/components/main-operation-preview/MainOperationScopeCard';
import type { OperationPreviewAuthoritySummary } from '@/core/authority/authorityPresentation';
import type { MainOpPreviewScopeRow } from '@/features/pilot/utils/mainOperationPreviewUiModel';

type MainOperationInsightColumnsProps = {
  authoritySummary: OperationPreviewAuthoritySummary;
  scopeRows: MainOpPreviewScopeRow[];
  authorityDecorImage: ImageSource;
  scopeDecorImage: ImageSource;
};

export function MainOperationInsightColumns({
  authoritySummary,
  scopeRows,
  authorityDecorImage,
  scopeDecorImage,
}: MainOperationInsightColumnsProps) {
  return (
    <View style={styles.wrap}>
      <MainOperationAuthorityCard
        summary={authoritySummary}
        decorImage={authorityDecorImage}
      />
      <MainOperationScopeCard rows={scopeRows} decorImage={scopeDecorImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
});
