import { StyleSheet, Text, View } from 'react-native';

import type { PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';

type Props = {
  profile: PlayerStyleProfile | null | undefined;
  compact?: boolean;
  hubChip?: boolean;
};

const TONE_COLOR: Record<PlayerStyleProfile['tone'], string> = {
  calm: '#4A5F5B',
  encouraging: '#0F6B64',
  strategic: '#3F5C6B',
  warning: '#9A6B12',
  neutral: '#6B6560',
};

export function EcePlayerStyleInsightCard({ profile, compact = false, hubChip = false }: Props) {
  if (!profile?.visible) return null;

  const accent = TONE_COLOR[profile.tone];

  if (hubChip) {
    return (
      <View style={styles.chipRow}>
        <Text style={[styles.chipLabel, { color: accent }]} numberOfLines={1}>
          Tarz sinyali: {profile.shortLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
        {compact ? `Tarz: ${profile.shortLabel}` : profile.title}
      </Text>
      <Text style={styles.advisorLine} numberOfLines={compact ? 2 : 3}>
        {profile.advisorLine}
      </Text>
      {profile.tags.length > 0 && !compact ? (
        <View style={styles.tagRow}>
          {profile.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={[styles.tagText, { color: accent }]} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
    paddingTop: 4,
  },
  cardCompact: {
    gap: 4,
  },
  chipRow: {
    minWidth: 0,
    flexShrink: 1,
    paddingTop: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  advisorLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5A5550',
    flexShrink: 1,
    minWidth: 0,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 107, 100, 0.06)',
    maxWidth: '48%',
    minWidth: 0,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
});
