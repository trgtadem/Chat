/**
 * Zego Express Engine sarmalayıcı (opsiyonel — yapılandırma yoksa no-op).
 */
import Constants from 'expo-constants';

let engineReady = false;

export function getZegoConfig(): { appID: number; appSign: string } | null {
  const extra = Constants.expoConfig?.extra?.zego as
    | { appID?: number | string; appSign?: string }
    | undefined;

  const rawId = extra?.appID ?? process.env.EXPO_PUBLIC_ZEGO_APP_ID;
  const appSign = (extra?.appSign ?? process.env.EXPO_PUBLIC_ZEGO_APP_SIGN ?? '').trim();

  const appID =
    typeof rawId === 'number'
      ? rawId
      : rawId
        ? parseInt(String(rawId), 10)
        : NaN;

  if (!appID || Number.isNaN(appID) || !appSign) {
    return null;
  }
  return { appID, appSign };
}

export async function startZegoEngine(
  _userID: string,
  _userName: string
): Promise<boolean> {
  const config = getZegoConfig();
  if (!config) return false;

  try {
    const mod: any = await import('zego-express-engine-reactnative');
    const ZegoExpressEngine = mod.default;
    await ZegoExpressEngine.createEngine(config.appID, config.appSign, false, 0);
    engineReady = true;
    return true;
  } catch (e) {
    console.warn('startZegoEngine', e);
    engineReady = false;
    return false;
  }
}

export async function loginZegoRoom(
  roomId: string,
  userID: string,
  userName: string
): Promise<boolean> {
  if (!engineReady) return false;
  try {
    const mod: any = await import('zego-express-engine-reactnative');
    const engine =
      typeof mod.default.instance === 'function'
        ? mod.default.instance()
        : mod.default.instance;
    const result = await engine.loginRoom(roomId, { userID, userName });
    return result?.errorCode === 0;
  } catch (e) {
    console.warn('loginZegoRoom', e);
    return false;
  }
}

export async function leaveRoom(roomId: string): Promise<void> {
  if (!engineReady) return;
  try {
    const mod: any = await import('zego-express-engine-reactnative');
    const engine =
      typeof mod.default.instance === 'function'
        ? mod.default.instance()
        : mod.default.instance;
    await engine.logoutRoom(roomId);
  } catch (e) {
    console.warn('leaveRoom', e);
  }
}

export async function destroyEngine(): Promise<void> {
  if (!engineReady) return;
  try {
    const mod: any = await import('zego-express-engine-reactnative');
    await mod.default.destroyEngine();
  } catch (e) {
    console.warn('destroyEngine', e);
  } finally {
    engineReady = false;
  }
}
