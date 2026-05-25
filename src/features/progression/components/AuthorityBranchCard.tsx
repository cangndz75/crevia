import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthorityNodeCard } from '@/features/progression/components/AuthorityNodeCard';
import type { DerivedProgressionBranch } from '@/features/progression/utils/progressionDerived';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type AuthorityBranchCardProps = {
  branch: DerivedProgressionBranch;
};

export function AuthorityBranchCard({ branch }: AuthorityBranchCardProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={[styles.accentLine, { backgroundColor: branch.color }]} />
        <View style={[styles.branchIcon, { backgroundColor: branch.mutedColor }]}>
          <Ionicons name={branch.icon} size={18} color={branch.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={typography.subtitle}>{branch.title}</Text>
          <Text style={typography.caption}>{branch.description}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.nodeRow}>
        {branch.nodes.map((node, index) => (
          <View key={node.id} style={styles.nodeWrap}>
            {index > 0 && (
              <View
                style={[styles.connector, { backgroundColor: branch.color }]}
              />
            )}
            <AuthorityNodeCard
              node={node}
              branchColor={branch.color}
              branchMutedColor={branch.mutedColor}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  accentLine: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    minHeight: 44,
    opacity: 0.85,
  },
  branchIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nodeRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  nodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    width: 12,
    height: 2,
    borderRadius: 1,
    marginRight: spacing.sm,
    opacity: 0.35,
  },
});
