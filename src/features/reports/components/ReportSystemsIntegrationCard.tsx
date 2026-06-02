import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type {
  CreviaReportSystemsIntegrationModel,
  CreviaReportSystemsLine,
  CreviaReportSystemsLineTone,
} from '@/core/reports/reportSystemsIntegrationPresentation';
import { colors } from '@/ui/theme/colors';

type Props = {
  model: CreviaReportSystemsIntegrationModel | null | undefined;
};

const TONE_COLORS: Record<CreviaReportSystemsLineTone, string> = {
  teal: colors.primary,
  mint: '#0D9488',
  gold: '#B45309',
  neutral: colors.textSecondary,
  warn: '#CA8A04',
};

function SystemsRow({ line }: { line: CreviaReportSystemsLine }) {
  const iconColor = TONE_COLORS[line.tone] ?? colors.primary;

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

export function ReportSystemsIntegrationCard({ model }: Props) {
  if (!model?.visible || model.lines.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {model.title}
      </Text>
      {model.lines.map((line) => (
        <SystemsRow key={line.id} line={line} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F4FBF9',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.14)',
    gap: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
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
    color: colors.primary,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
});
