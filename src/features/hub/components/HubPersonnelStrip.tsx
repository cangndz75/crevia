import { useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { usePersonnelTeams } from '@/features/personnel/hooks/usePersonnelTeams';
import type { RestActionType } from '@/core/personnel/personnelTypes';
import { useGameStore } from '@/store/useGameStore';
import { PersonnelTeamCard } from '@/ui/components/personnel/PersonnelTeamCard';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

export function HubPersonnelStrip() {
  const teams = usePersonnelTeams();
  const restPersonnelTeam = useGameStore((s) => s.restPersonnelTeam);

  const runRestAction = useCallback(
    (teamId: string, teamName: string, restType: RestActionType) => {
      const result = restPersonnelTeam(teamId, restType);
      Alert.alert(
        result.success ? 'Personel' : 'İşlem yapılamadı',
        result.message || `${teamName} için işlem tamamlandı.`,
        [{ text: 'Tamam' }],
      );
    },
    [restPersonnelTeam],
  );

  const showRestPicker = useCallback(
    (teamId: string, teamName: string, restDisabled: boolean) => {
      if (restDisabled) {
        Alert.alert('Personel', `${teamName} bugün dinlenme planında.`);
        return;
      }

      Alert.alert('Dinlendir', `${teamName} için aksiyon seç.`, [
        {
          text: 'Hafif görev',
          onPress: () => runRestAction(teamId, teamName, 'light_duty'),
        },
        {
          text: 'Tam dinlenme',
          style: 'destructive',
          onPress: () => runRestAction(teamId, teamName, 'full_rest'),
        },
        {
          text: 'Motivasyon (Kaynak)',
          onPress: () => runRestAction(teamId, teamName, 'motivation'),
        },
        {
          text: 'Ekipman desteği (Kaynak)',
          onPress: () => runRestAction(teamId, teamName, 'equipment_support'),
        },
        { text: 'Vazgeç', style: 'cancel' },
      ]);
    },
    [runRestAction],
  );

  if (teams.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Personel Durumu</Text>
        <Text style={styles.subtitle}>Canlı ekip kaynağı — dinlendirme trade-off</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {teams.map((team) => (
          <PersonnelTeamCard
            key={team.id}
            team={team}
            variant="compact"
            style={styles.cardSpacing}
            onRestPress={() =>
              showRestPicker(team.id, team.name, team.restModeLabel != null)
            }
            restDisabled={team.restModeLabel != null}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  header: {
    gap: 2,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  cardSpacing: {
    marginRight: 0,
  },
});
