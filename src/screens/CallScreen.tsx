import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { useFeedback } from '../feedback/FeedbackContext';
import {
  createCall,
  endCall,
  updateCallStatus,
} from '../services/calls';
import {
  destroyEngine,
  getZegoConfig,
  leaveRoom,
  loginZegoRoom,
  startZegoEngine,
} from '../services/zego';

type CallScreenProps = NativeStackScreenProps<RootStackParamList, 'Call'>;

export function CallScreen({ route, navigation }: CallScreenProps) {
  const { friend, isVideo, isIncoming, callId: incomingCallId } = route.params;
  const { currentUser } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [callId, setCallId] = useState<string | null>(incomingCallId ?? null);
  const callIdRef = useRef<string | null>(incomingCallId ?? null);
  const [statusLabel, setStatusLabel] = useState(
    isIncoming ? 'Gelen arama' : 'Aranıyor...'
  );
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(isVideo);
  const endedRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!currentUser) return;

    let activeCallId = incomingCallId ?? null;
    const userName = `${currentUser.name} ${currentUser.surname}`.trim();

    const setup = async () => {
      if (!isIncoming) {
        try {
          activeCallId = await createCall(currentUser, friend, isVideo);
          callIdRef.current = activeCallId;
          setCallId(activeCallId);
        } catch (e) {
          console.error('createCall', e);
          toast.error('Arama başlatılamadı.');
          navigation.goBack();
          return;
        }
      } else if (!activeCallId) {
        toast.error('Arama bilgisi eksik.');
        navigation.goBack();
        return;
      }

      const zegoConfig = getZegoConfig();
      if (!zegoConfig) {
        toast.warning('Zego yapılandırması eksik');
      } else {
        const started = await startZegoEngine(currentUser.id, userName);
        if (started && activeCallId) {
          const joined = await loginZegoRoom(activeCallId, currentUser.id, userName);
          if (joined) {
            setStatusLabel(isIncoming ? 'Bağlandı' : 'Bağlanıyor...');
          }
        }
      }
    };

    void setup();

    return () => {
      if (endedRef.current) return;
      endedRef.current = true;
      const id = callIdRef.current;
      if (id) void endCall(id);
      if (id) void leaveRoom(id);
      void destroyEngine();
    };
  }, [currentUser, friend, isVideo, isIncoming, incomingCallId, navigation, toast]);

  const handleEnd = async () => {
    if (callId) {
      endedRef.current = true;
      await updateCallStatus(callId, 'ended');
      await leaveRoom(callId);
      await destroyEngine();
    }
    navigation.goBack();
  };

  const handleAccept = async () => {
    if (!callId) return;
    await updateCallStatus(callId, 'accepted');
    setStatusLabel('Bağlandı');
  };

  const handleDecline = async () => {
    if (!callId) {
      navigation.goBack();
      return;
    }
    endedRef.current = true;
    await updateCallStatus(callId, 'declined');
    await leaveRoom(callId);
    await destroyEngine();
    navigation.goBack();
  };

  const friendName = `${friend.name} ${friend.surname}`.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: friend.avatar ?? 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{friendName}</Text>
        <Text style={styles.status}>
          {statusLabel}
          {isVideo ? ' · Görüntülü' : ' · Sesli'}
        </Text>
      </View>

      <View style={styles.controls}>
        {isIncoming && (
          <View style={styles.incomingRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <PhoneOff size={28} color="#fff" />
              <Text style={styles.actionLabel}>Reddet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
              <Phone size={28} color="#fff" />
              <Text style={styles.actionLabel}>Kabul Et</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.toolRow}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setMuted((m) => !m)}
          >
            {muted ? (
              <MicOff size={24} color={theme.colors.textPrimary} />
            ) : (
              <Mic size={24} color={theme.colors.textPrimary} />
            )}
            <Text style={styles.toolLabel}>{muted ? 'Sessiz' : 'Mikrofon'}</Text>
          </TouchableOpacity>

          {isVideo && (
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setCameraOn((c) => !c)}
            >
              {cameraOn ? (
                <Video size={24} color={theme.colors.textPrimary} />
              ) : (
                <VideoOff size={24} color={theme.colors.textPrimary} />
              )}
              <Text style={styles.toolLabel}>
                {cameraOn ? 'Kamera' : 'Kapalı'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
          <PhoneOff size={28} color="#fff" />
          <Text style={styles.endLabel}>Bitir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: t.radius.pill,
      marginBottom: 20,
    },
    name: {
      color: t.colors.textPrimary,
      fontSize: 26 * t.fontScale,
      fontWeight: '700',
      marginBottom: 8,
    },
    status: {
      color: t.colors.textSecondary,
      fontSize: 16 * t.fontScale,
    },
    controls: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 20,
    },
    incomingRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 40,
      marginBottom: 8,
    },
    actionBtn: {
      alignItems: 'center',
      gap: 8,
    },
    acceptBtn: {
      width: 72,
      height: 72,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.success ?? '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
    },
    declineBtn: {
      width: 72,
      height: 72,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionLabel: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
    },
    toolRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 32,
    },
    toolBtn: {
      alignItems: 'center',
      gap: 6,
      padding: 12,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceAlt,
      minWidth: 80,
    },
    toolLabel: {
      color: t.colors.textSecondary,
      fontSize: 12 * t.fontScale,
    },
    endBtn: {
      alignSelf: 'center',
      width: 72,
      height: 72,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
    endLabel: {
      position: 'absolute',
      bottom: -22,
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      fontWeight: '600',
    },
  });
