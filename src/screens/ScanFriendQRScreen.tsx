import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ChevronLeft } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { normalizeFriendCode, isValidFriendCode } from '../utils/friendCode';
import { useFeedback } from '../feedback/FeedbackContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanFriendQR'>;

const REASON_MESSAGES: Record<string, string> = {
  not_found: 'Bu koda sahip bir kullanıcı bulunamadı.',
  self: 'Kendi kodunu ekleyemezsin.',
  already_friend: 'Bu kullanıcı zaten arkadaşın.',
  already_sent: 'Bu kullanıcıya zaten istek gönderdin.',
  incoming_pending: 'Bu kullanıcı sana zaten istek göndermiş. Gelen isteklerden kabul edebilirsin.',
  error: 'İstek gönderilirken bir hata oluştu.',
};

export function ScanFriendQRScreen({ navigation }: Props) {
  const { sendFriendRequest } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCode = useCallback(
    async (result: BarcodeScanningResult) => {
      if (lockedRef.current || processing) return;
      const code = normalizeFriendCode(result.data ?? '');
      if (!isValidFriendCode(code)) return;

      lockedRef.current = true;
      setProcessing(true);
      try {
        const res = await sendFriendRequest(code);
        if (res.ok) {
          toast.success('Arkadaşlık isteğin karşı tarafa iletildi.', 'İstek Gönderildi');
          navigation.goBack();
        } else {
          toast.warning(REASON_MESSAGES[res.reason] ?? 'Bilinmeyen hata.', 'Gönderilemedi');
          lockedRef.current = false;
          setProcessing(false);
        }
      } catch {
        toast.error('İstek gönderilemedi.');
        lockedRef.current = false;
        setProcessing(false);
      }
    },
    [navigation, processing, sendFriendRequest, toast]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Tara</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>QR taramak için kamera izni gerekli.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFF' }]}>QR Tara</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={processing ? undefined : handleBarCode}
        />
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.hint}>Arkadaşının QR kodunu çerçeveye hizala</Text>
          {processing && <ActivityIndicator color="#FFF" style={{ marginTop: 16 }} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 2,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      fontSize: 18 * t.fontScale,
      fontWeight: '600',
      color: t.colors.textPrimary,
    },
    cameraWrap: { flex: 1 },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    frame: {
      width: 240,
      height: 240,
      borderWidth: 2,
      borderColor: '#FFF',
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    hint: {
      marginTop: 20,
      color: '#FFF',
      fontSize: 14 * t.fontScale,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    permissionBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: t.colors.background,
    },
    permissionText: {
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      textAlign: 'center',
      marginBottom: 16,
    },
    permissionBtn: {
      backgroundColor: t.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: t.radius.lg,
    },
    permissionBtnText: { color: t.colors.onAccent, fontWeight: '600' },
  });
