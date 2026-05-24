import { StyleSheet, View } from 'react-native';

import { AbilityNodeCard } from '@/features/progression/components/AbilityNodeCard';
import { buildAbilityLevels } from '@/core/utils/abilityPresentation';
import { mockGameData } from '@/core/content/mockGameData';
import { Ability } from '@/core/models/Ability';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type AbilityTreeViewProps = {
  selectedId: string | null;
  onSelect: (ability: Ability) => void;
};

export function AbilityTreeView({ selectedId, onSelect }: AbilityTreeViewProps) {
  const levels = buildAbilityLevels(mockGameData.abilities);

  return (
    <View style={styles.tree}>
      {levels.map((level, levelIndex) => (
        <View key={`level-${levelIndex}`} style={styles.levelBlock}>
          {levelIndex > 0 ? (
            <View style={styles.connectorZone}>
              <View style={styles.connectorVertical} />
              {level.length > 1 ? (
                <View
                  style={[
                    styles.connectorHorizontal,
                    { width: Math.min(level.length * 100, 280) },
                  ]}
                />
              ) : null}
            </View>
          ) : null}

          <View
            style={[
              styles.levelRow,
              level.length === 1 && styles.levelRowSingle,
            ]}>
            {level.map((ability) => (
              <View key={ability.id} style={styles.nodeSlot}>
                {levelIndex > 0 ? (
                  <View style={styles.connectorStem} />
                ) : null}
                <AbilityNodeCard
                  ability={ability}
                  selected={selectedId === ability.id}
                  onPress={() => onSelect(ability)}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tree: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  levelBlock: {
    alignItems: 'center',
    width: '100%',
  },
  connectorZone: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  connectorVertical: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
  },
  connectorHorizontal: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    width: '100%',
  },
  levelRowSingle: {
    justifyContent: 'center',
  },
  nodeSlot: {
    alignItems: 'center',
  },
  connectorStem: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
});
