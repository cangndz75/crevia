import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { INSPECT_MAIN_FINDINGS_TEXT } from '@/features/events/utils/eventWorkflowPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type MainFindingsCardProps = {
  sceneImage: ImageSource;
  onDetailsPress?: () => void;
};

export function MainFindingsCard({ sceneImage, onDetailsPress }: MainFindingsCardProps) {
  return (
    <LinearGradient
      colors={['#DCEEF8', '#E8F4FC', '#F4FAFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}>
      <View style={styles.contentRow}>
        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={16} color={eventDetail.teal} />
            <Text style={styles.title}>Ana Bulgular</Text>
          </View>

          <Text style={styles.body}>{INSPECT_MAIN_FINDINGS_TEXT}</Text>

          <Pressable
            onPress={onDetailsPress}
            style={({ pressed }) => [styles.detailsBtn, pressed && styles.detailsBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Detayları gör">
            <Text style={styles.detailsLabel}>Detayları Gör →</Text>
          </Pressable>
        </View>

        <View style={styles.sceneFrame}>
          <Image
            source={sceneImage}
            style={styles.sceneImage}
            contentFit="contain"
            accessibilityLabel="Saha bulgusu illüstrasyonu"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: eventDetail.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 198, 0.12)',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    color: eventDetail.textDark,
    lineHeight: 20,
  },
  detailsBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(221, 244, 232, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.18)',
  },
  detailsBtnPressed: {
    opacity: 0.88,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  sceneFrame: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
});
