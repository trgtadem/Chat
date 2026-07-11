import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { markStatusViewed } from '../services/status';
import { StatusItem } from '../types';

type StatusViewerScreenProps = NativeStackScreenProps<RootStackParamList, 'StatusViewer'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function StatusViewerScreen({ route, navigation }: StatusViewerScreenProps) {
  const { statuses, startIndex = 0 } = route.params;
  const { currentUser } = useAppContext();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(statuses.length - 1, 0))
  );

  const current = statuses[index];

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!current?.id || !currentUser?.id) return;
    void markStatusViewed(current.id, currentUser.id);
  }, [current?.id, currentUser?.id]);

  const goNext = useCallback(() => {
    if (index < statuses.length - 1) setIndex((i) => i + 1);
    else navigation.goBack();
  }, [index, statuses.length, navigation]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  if (!current) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.emptyText}>Durum bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const authorLabel = current.authorName ?? 'Kullanıcı';

  return (
    <View style={styles.container}>
      {current.type === 'image' && current.imageUrl ? (
        <Image
          source={{ uri: current.imageUrl }}
          style={styles.fullImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.textBackdrop}>
          <Text style={styles.statusText}>{current.text ?? ''}</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          {current.authorAvatar ? (
            <Image source={{ uri: current.authorAvatar }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, styles.avatarPlaceholder]} />
          )}
          <Text style={styles.authorName} numberOfLines={1}>
            {authorLabel}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          {statuses.map((_, i) => (
            <View
              key={statuses[i].id}
              style={[styles.progressDot, i === index && styles.progressDotActive]}
            />
          ))}
        </View>
      </SafeAreaView>

      <Pressable style={styles.tapLeft} onPress={goPrev} />
      <Pressable style={styles.tapRight} onPress={goNext} />

      {index > 0 && (
        <TouchableOpacity style={styles.navHintLeft} onPress={goPrev}>
          <ChevronLeft size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
      {index < statuses.length - 1 && (
        <TouchableOpacity style={styles.navHintRight} onPress={goNext}>
          <ChevronRight size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    fullImage: {
      width: SCREEN_W,
      height: SCREEN_H,
    },
    textBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: t.colors.primary,
    },
    statusText: {
      color: '#fff',
      fontSize: 28 * t.fontScale,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 38,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 10,
    },
    authorAvatar: {
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
    },
    avatarPlaceholder: {
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    authorName: {
      flex: 1,
      color: '#fff',
      fontSize: 16 * t.fontScale,
      fontWeight: '700',
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    progressDot: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    progressDotActive: {
      backgroundColor: '#fff',
    },
    tapLeft: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '35%',
    },
    tapRight: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '65%',
    },
    navHintLeft: {
      position: 'absolute',
      left: 8,
      top: '50%',
      marginTop: -20,
      padding: 8,
    },
    navHintRight: {
      position: 'absolute',
      right: 8,
      top: '50%',
      marginTop: -20,
      padding: 8,
    },
    emptyText: {
      color: '#fff',
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16 * t.fontScale,
    },
  });
