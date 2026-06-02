import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type {
  CreviaEventResultSystemsEchoLine,
  CreviaEventResultSystemsEchoModel,
  CreviaEventResultSystemsEchoTone,
} from '@/core/events/eventResultNewSystemsPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  model: CreviaEventResultSystemsEchoModel | null | undefined;
};

const TONE_COLORS: Record<CreviaEventResultSystemsEchoTone, string> = {
  teal: eventDetail.teal,
  mint: '#0D9488',
  gold: '#B45309',
  neutral: eventDetail.textMuted,
  warn: '#CA8A04',
};

function EchoRow({ line }: { line: CreviaEventResultSystemsEchoLine }) {
  const iconColor = TONE_COLORS[line.tone] ?? eventDetail.teal;

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={line.iconKey as keyof typeof Ionicons.glyphMap}
          size={13}
          color={iconColor}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label} numberOfLines={1}>
          {line.label}
        </Text>
        <Text style={styles.text} numberOfLines={line.maxLines}>
          {line.text}
        </Text>
      </View>
    </View>
  );
}

export function EventResultSystemsEchoStrip({ model }: Props) {
  if (!model?.visible || model.lines.length === 0) return null;

  return (
    <View style={styles.card}>
      {model.lines.map((line) => (
        <EchoRow key={line.id} line={line} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F4FBF9',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.14)',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  iconWrap: {
    marginTop: 1,
    width: 16,
    alignItems: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    flexShrink: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.teal,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: eventDetail.textDark,
    flexShrink: 1,
    minWidth: 0,
  },
});
