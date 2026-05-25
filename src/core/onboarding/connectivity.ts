import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityStatus = 'checking' | 'online' | 'offline';

function isConnected(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return false;
  }
  if (state.isInternetReachable === false) {
    return false;
  }
  return true;
}

/** Tek seferlik bağlantı kontrolü. */
export async function checkConnectivity(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return isConnected(state);
}

/** Bağlantı durumunu dinler; unsubscribe fonksiyonu döner. */
export function subscribeConnectivity(
  onChange: (online: boolean) => void,
): () => void {
  return NetInfo.addEventListener((state) => {
    onChange(isConnected(state));
  });
}
