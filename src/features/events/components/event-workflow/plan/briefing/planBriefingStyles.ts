import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { StyleSheet } from 'react-native';

export const planBriefingStyles = StyleSheet.create({
  sectionGap: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: eventDetail.teal,
    textTransform: 'uppercase',
  },
  card: {
    marginHorizontal: eventDetail.screenPadding,
    backgroundColor: eventDetail.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    padding: 16,
  },
});
