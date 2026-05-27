import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HotSocialTopicCard } from '../components/HotSocialTopicCard';
import { LiveMentionsStrip } from '../components/LiveMentionsStrip';
import { NeighborhoodSocialRiskStrip } from '../components/NeighborhoodSocialRiskStrip';
import { SocialNavHeader } from '../components/SocialNavHeader';
import { SocialOutcomeHistory } from '../components/SocialOutcomeHistory';
import { SocialPulseSummaryCard } from '../components/SocialPulseSummaryCard';
import { SocialSideTopicCards } from '../components/SocialSideTopicCards';
import { SocialTipBanner } from '../components/SocialTipBanner';
import { MOCK_SOCIAL_PULSE } from '../utils/socialUiModel';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

export function SocialPulseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = MOCK_SOCIAL_PULSE;

  const handleAction = (_actionId: string) => {
    // Will connect to socialState dispatch
  };

  return (
    <View style={styles.root}>
      <SocialNavHeader onBack={() => router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <SocialPulseSummaryCard data={data.summary} />

        <NeighborhoodSocialRiskStrip neighborhoods={data.neighborhoods} />

        <HotSocialTopicCard topic={data.hotTopic} onAction={handleAction} />

        <SocialSideTopicCards
          topics={data.sideTopics}
          onAction={handleAction}
        />

        <SocialOutcomeHistory outcomes={data.outcomes} />

        <LiveMentionsStrip
          mentions={data.mentions}
          activeMentionCount={data.activeMentionCount}
        />

        <SocialTipBanner text={data.tipText} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  body: {
    gap: 14,
    paddingTop: spacing.xs,
  },
});
