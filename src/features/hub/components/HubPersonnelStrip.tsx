import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getPersonnelTeamImage } from '@/core/assets/creviaAssetPresentation';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import Animated, { FadeIn } from 'react-native-reanimated';

import { usePersonnelTeams } from '@/features/personnel/hooks/usePersonnelTeams';
import type { RestActionType } from '@/core/personnel/personnelTypes';
import type { PersonnelTeamCardView } from '@/core/personnel/personnelTypes';
import { useGameStore } from '@/store/useGameStore';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

function HubPersonnelRow({
  team,
  onRestPress,
  restDisabled,
}: {
  team: PersonnelTeamCardView;
  onRestPress?: () => void;
  restDisabled?: boolean;
}) {
  const isHighFatigue = team.fatigue >= 71;
  const fatigueTone = isHighFatigue
    ? colors.warning
    : team.fatigue >= 51
      ? colors.hubGoldDark
      : colors.secondary;
  const moraleTone =
    team.morale < 40
      ? colors.warning
      : team.morale >= 60
        ? colors.success
        : colors.textSecondary;

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <HubAssetImage
          source={getPersonnelTeamImage(team.name)}
          containerStyle={styles.rowIconAsset}
          contentFit="contain"
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {team.name}
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Yorg.</Text>
            <View style={styles.metricTrack}>
              <View
                style={[
                  styles.metricFill,
                  { width: `${team.fatigue}%`, backgroundColor: fatigueTone },
                ]}
              />
            </View>
            <Text style={styles.metricValue}>{team.fatigue}</Text>
          </View>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Moral</Text>
            <View style={styles.metricTrack}>
              <View
                style={[
                  styles.metricFill,
                  { width: `${team.morale}%`, backgroundColor: moraleTone },
                ]}
              />
            </View>
            <Text style={styles.metricValue}>{team.morale}</Text>
          </View>
        </View>
      </View>
      <View style={styles.statusPill}>
        <Text style={styles.statusText} numberOfLines={1}>
          {team.statusLabel}
        </Text>
      </View>
      {onRestPress && !team.restModeLabel ? (
        <Pressable
          onPress={onRestPress}
          disabled={restDisabled}
          hitSlop={6}
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${team.name} dinlendir`}>
          <Ionicons name="moon-outline" size={16} color={colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function HubPersonnelStrip() {
  const router = useRouter();
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

  const handleGlobalRest = useCallback(() => {
    const first = teams.find((t) => !t.restModeLabel);
    if (!first) {
      Alert.alert('Personel', 'Tüm ekipler dinlenme planında.');
      return;
    }
    showRestPicker(first.id, first.name, false);
  }, [showRestPicker, teams]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Personel Durumu</Text>
        <Pressable
          style={styles.seeAllBtn}
          onPress={() => router.push('/team-dispatch')}
          accessibilityRole="button"
          accessibilityLabel="Tüm personeli gör">
          <Text style={styles.seeAllText}>Tümünü gör</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={[styles.card, hubPremiumShadowCard()]}>
        {teams.map((team, index) => (
          <View key={team.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <HubPersonnelRow
              team={team}
              onRestPress={() =>
                showRestPicker(team.id, team.name, team.restModeLabel != null)
              }
              restDisabled={team.restModeLabel != null}
            />
          </View>
        ))}

        <Pressable
          onPress={handleGlobalRest}
          style={({ pressed }) => [styles.restFooter, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Dinlendir">
          <Ionicons name="moon-outline" size={16} color={colors.secondary} />
          <Text style={styles.restFooterText}>Dinlendir</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginHorizontal: spacing.lg,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: HUB_PREMIUM_COLORS.card,
    borderRadius: HUB_PREMIUM_RADIUS.card,
    borderWidth: 1,
    borderColor: HUB_PREMIUM_COLORS.borderSoft,
    paddingHorizontal: 14,
    paddingTop: 10,
    overflow: 'hidden',
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    minHeight: 60,
    minWidth: 0,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(189, 239, 231, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  rowIconAsset: {
    width: 28,
    height: 28,
  },
  rowBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.textDark,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
  },
  metricCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 34,
    flexShrink: 0,
  },
  metricTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.backgroundAlt,
    overflow: 'hidden',
    minWidth: 0,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    width: 20,
    textAlign: 'right',
    flexShrink: 0,
  },
  statusPill: {
    backgroundColor: colors.purpleMuted,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.purple,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  restFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginHorizontal: -14,
    paddingVertical: 11,
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: HUB_PREMIUM_COLORS.borderSoft,
    backgroundColor: 'rgba(189, 239, 231, 0.2)',
  },
  restFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.teal,
  },
  pressed: {
    opacity: 0.85,
  },
});
