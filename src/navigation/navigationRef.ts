import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: 'Chat', params: RootStackParamList['Chat']): void;
export function navigate(name: keyof RootStackParamList, params?: object): void {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (n: string, p?: object) => void)(name, params);
  }
}
