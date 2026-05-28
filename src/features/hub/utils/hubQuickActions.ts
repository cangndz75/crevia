import { Alert } from 'react-native';
import type { Href, Router } from 'expo-router';

export type HubQuickActionId = 'team' | 'route' | 'maint' | 'announce';

const MAP_ROUTE = '/risks' as Href;
const SOCIAL_ROUTE = '/social' as Href;

export function handleHubQuickAction(
  actionId: HubQuickActionId,
  router: Pick<Router, 'push'>,
): void {
  switch (actionId) {
    case 'team':
      Alert.alert(
        'Ekip Yönetimi',
        'Personel yönetimi Merkez ekranındaki ekip kartlarından yapılır.',
        [{ text: 'Tamam' }],
      );
      return;
    case 'route':
      router.push(MAP_ROUTE);
      return;
    case 'maint':
      Alert.alert(
        'Bakım Kontrol',
        'Bakım işlemleri Araç Filosu kartındaki aksiyonlardan yapılır.',
        [{ text: 'Tamam' }],
      );
      return;
    case 'announce':
      router.push(SOCIAL_ROUTE);
      return;
    default: {
      const _exhaustive: never = actionId;
      return _exhaustive;
    }
  }
}
