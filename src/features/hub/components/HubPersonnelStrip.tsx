import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
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
        <Text style={styles.title}>PERSONEL DURUMU</Text>
        <Pressable
          style={styles.seeAllBtn}
          onPress={() =>
            Alert.alert(
              'Personel',
              'Ekip detayları Merkez ekranındaki kartlardan yönetilir.',
              [{ text: 'Tamam' }],
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Tüm personeli gör">
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
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
