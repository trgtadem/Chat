import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, FileText, Film } from 'lucide-react-native';

import { RootStackParamList } from '../types/navigation';
import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { Message } from '../types';
import { EmptyState } from '../components/EmptyState';
import { Image as ImageIcon } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'SharedMedia'>;

export function SharedMediaScreen({ navigation, route }: Props) {
  const { friend, messages } = route.params;
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const media = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.isDeleted &&
          (m.type === 'image' || m.type === 'file' || m.type === 'video' || m.type === 'audio')
      ),
    [messages]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Paylaşılan medya</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.sub}>{friend.name} ile</Text>
      {media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Paylaşılan medya yok"
          subtitle="Görsel, video ve dosyalar burada listelenir."
        />
      ) : (
        <FlatList
          data={media}
          keyExtractor={(i) => i.id}
          numColumns={3}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => <MediaCell item={item} styles={styles} theme={theme} />}
        />
      )}
    </SafeAreaView>
  );
}

function MediaCell({
  item,
  styles,
  theme,
}: {
  item: Message;
  styles: ReturnType<typeof makeStyles>;
  theme: Theme;
}) {
  if (item.type === 'image' && item.imageUrl) {
    return <Image source={{ uri: item.imageUrl }} style={styles.thumb} />;
  }
  if (item.type === 'video' && item.videoUrl) {
    return (
      <TouchableOpacity
        style={[styles.thumb, styles.fileCell]}
        onPress={() => Linking.openURL(item.videoUrl!)}
      >
        <Film size={28} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  }
  const url = item.fileUrl || item.audioUrl;
  return (
    <TouchableOpacity
      style={[styles.thumb, styles.fileCell]}
      onPress={() => url && Linking.openURL(url)}
    >
      <FileText size={28} color={theme.colors.primary} />
      <Text style={styles.fileName} numberOfLines={2}>
        {item.fileName || item.type}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.colors.headerBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    title: { fontSize: 17 * t.fontScale, fontWeight: '700', color: t.colors.textPrimary },
    sub: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
    },
    thumb: {
      width: '31%',
      aspectRatio: 1,
      margin: '1.16%',
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
    },
    fileCell: { alignItems: 'center', justifyContent: 'center', padding: 8 },
    fileName: {
      marginTop: 4,
      fontSize: 10 * t.fontScale,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
  });
