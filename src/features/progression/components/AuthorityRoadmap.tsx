import { StyleSheet, Text, View } from 'react-native';

import { AuthorityBranchCard } from '@/features/progression/components/AuthorityBranchCard';
import type { DerivedProgressionBranch } from '@/features/progression/utils/progressionDerived';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type AuthorityRoadmapProps = {
  branches: DerivedProgressionBranch[];
};

export function AuthorityRoadmap({ branches }: AuthorityRoadmapProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerPad}>
        <SectionHeader
          title="Yetki Haritası"
          subtitle="Her dal yeni bir yönetim gücü açar."
          icon="git-network-outline"
          iconColor={colors.primary}
        />
        <Text style={styles.hint}>
          Yeni sistemler, operasyon başarınla birlikte açılır.
        </Text>
      </View>

      <View style={styles.branches}>
        {branches.map((branch) => (
          <AuthorityBranchCard key={branch.id} branch={branch} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  headerPad: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: -spacing.sm,
  },
  branches: {
    gap: spacing.lg,
  },
});
