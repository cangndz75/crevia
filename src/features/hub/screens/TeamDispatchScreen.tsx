import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { TeamDispatchHeader } from '@/features/hub/components/TeamDispatchHeader';
import { TeamDispatchListToolbar } from '@/features/hub/components/TeamDispatchListToolbar';
import { TeamDispatchQuickAssignCard } from '@/features/hub/components/TeamDispatchQuickAssignCard';
import { TeamDispatchTeamCard } from '@/features/hub/components/TeamDispatchTeamCard';
import { teamDispatch } from '@/features/hub/theme/teamDispatchTokens';
import { buildTeamDispatchScreenModel } from '@/features/hub/utils/teamDispatchPresentation';
import { usePersonnelTeams } from '@/features/personnel/hooks/usePersonnelTeams';
import { selectPersonnelState, useGameStore } from '@/store/useGameStore';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { spacing } from '@/ui/theme/spacing';

export function TeamDispatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const cardViews = usePersonnelTeams();
  const personnelState = useGameStore(selectPersonnelState);
  const pilotDistrictId = useGameStore((s) => s.gameState.pilot.selectedDistrictId);
  const neighborhoods = useGameStore((s) => s.neighborhoods);

  const districtLabel = useMemo(() => {
    const match = neighborhoods.find((n) => n.id === pilotDistrictId);
    return match?.name ?? pilotDistrictId ?? 'Şehir merkezi';
  }, [neighborhoods, pilotDistrictId]);

  const model = useMemo(
    () =>
      buildTeamDispatchScreenModel({
        teams: personnelState.teams,
        cardViews,
        districtLabel,
      }),
    [personnelState.teams, cardViews, districtLabel],
  );

  const cardViewById = useMemo(
    () => new Map(cardViews.map((card) => [card.id, card])),
    [cardViews],
  );

  const handleRoute = (route: string) => {
    playLightImpactHaptic();
    router.push(route as Href);
  };

  const handleBack = () => {
    playLightImpactHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/');
  };

  const handleTeamDetails = useCallback(
    (teamId: string) => {
      const card = cardViewById.get(teamId);
      if (!card) return;
      playLightImpactHaptic();
      Alert.alert(card.name, card.readinessText, [{ text: 'Tamam' }]);
    },
    [cardViewById],
  );

  const handleTeamPrimaryAction = useCallback(
    (teamId: string, variant: 'ready' | 'resting' | 'maintenance') => {
      const card = cardViewById.get(teamId);
      if (!card) return;
      playLightImpactHaptic();

      if (variant === 'ready') {
        handleRoute('/events');
        return;
      }

      if (variant === 'resting') {
        Alert.alert(
          'Hatırlatıcı',
          `${card.name} hazır olduğunda bildirim alacaksın.`,
          [{ text: 'Tamam' }],
        );
        return;
      }

      Alert.alert(
        'Bakım Takibi',
        'Ekipman bakım durumu yarın sabah 08:00 için planlandı.',
        [{ text: 'Tamam' }],
      );
    },
    [cardViewById],
  );

  return (
    <View style={styles.screen}>
      <TeamDispatchHeader
        title={model.title}
        subtitle={model.subtitle}
        onBack={handleBack}
        onNotifications={() =>
          Alert.alert('Bildirimler', 'Ekip durumu güncellemeleri burada görünür.', [
            { text: 'Tamam' },
          ])
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TeamDispatchQuickAssignCard
          title={model.quickAssignTitle}
          subtitle={model.quickAssignSubtitle}
          onPress={() => handleRoute(model.quickAssignRoute)}
        />

        <TeamDispatchListToolbar
          onFilter={() =>
            Alert.alert('Filtrele', 'Hazır, dinlenen ve bakımdaki ekipleri ayır.', [
              { text: 'Tamam' },
            ])
          }
          onSort={() =>
            Alert.alert('Sırala', 'Ekipler moral ve yorgunluk durumuna göre sıralanır.', [
              { text: 'Tamam' },
            ])
          }
        />

        <View style={styles.teamList}>
          {model.teams.map((team, index) => (
            <TeamDispatchTeamCard
              key={team.id}
              model={team}
              index={index}
              teamName={team.name}
              onDetails={() => handleTeamDetails(team.id)}
              onPrimaryAction={() => handleTeamPrimaryAction(team.id, team.variant)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: teamDispatch.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  teamList: {
    gap: 12,
  },
});
