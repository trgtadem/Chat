import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, ImagePlus, Type } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../types/navigation';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { useFeedback } from '../feedback/FeedbackContext';
import { postStatus } from '../services/status';
import { uploadToCloudinary } from '../services/media';

type StatusComposeScreenProps = NativeStackScreenProps<RootStackParamList, 'StatusCompose'>;

type ComposeMode = 'text' | 'image';

export function StatusComposeScreen({ navigation }: StatusComposeScreenProps) {
  const { currentUser } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [mode, setMode] = useState<ComposeMode>('text');
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (!currentUser) return null;

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.info('Görsel seçmek için medya izni gerekli.', 'İzin gerekli');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setMode('image');
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('pick image', e);
      toast.error('Görsel seçilemedi.');
    }
  };

  const handlePost = async () => {
    if (mode === 'text' && !text.trim()) {
      toast.warning('Durum metni boş olamaz.');
      return;
    }
    if (mode === 'image' && !imageUri) {
      toast.warning('Bir görsel seçmelisin.');
      return;
    }

    setPosting(true);
    try {
      if (mode === 'text') {
        await postStatus(currentUser, { type: 'text', text: text.trim() });
      } else if (imageUri) {
        const uploaded = await uploadToCloudinary(imageUri, 'status.jpg', 'image/jpeg');
        await postStatus(currentUser, { type: 'image', imageUrl: uploaded.url });
      }
      toast.success('Durumun paylaşıldı.');
      navigation.goBack();
    } catch (e) {
      console.error('postStatus', e);
      toast.error('Durum paylaşılamadı.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Durum Ekle</Text>
        <TouchableOpacity
          onPress={handlePost}
          style={styles.postButton}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.postText}>Paylaş</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
          onPress={() => setMode('text')}
        >
          <Type size={18} color={mode === 'text' ? '#fff' : theme.colors.textPrimary} />
          <Text style={[styles.modeLabel, mode === 'text' && styles.modeLabelActive]}>
            Metin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'image' && styles.modeBtnActive]}
          onPress={() => {
            setMode('image');
            if (!imageUri) void handlePickImage();
          }}
        >
          <ImagePlus size={18} color={mode === 'image' ? '#fff' : theme.colors.textPrimary} />
          <Text style={[styles.modeLabel, mode === 'image' && styles.modeLabelActive]}>
            Görsel
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {mode === 'text' ? (
          <TextInput
            style={styles.textInput}
            placeholder="Ne düşünüyorsun?"
            placeholderTextColor={theme.colors.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            autoFocus
          />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <TouchableOpacity style={styles.pickArea} onPress={handlePickImage}>
            <ImagePlus size={40} color={theme.colors.textSecondary} />
            <Text style={styles.pickLabel}>Görsel seç</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.headerBackground,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.colors.surfaceAlt,
    },
    headerTitle: {
      color: t.colors.textPrimary,
      fontSize: 20 * t.fontScale,
      fontWeight: '700',
    },
    postButton: {
      minWidth: 64,
      alignItems: 'flex-end',
    },
    postText: {
      color: t.colors.primary,
      fontSize: 16 * t.fontScale,
      fontWeight: '700',
    },
    modeRow: {
      flexDirection: 'row',
      padding: 16,
      gap: 10,
    },
    modeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    modeBtnActive: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    modeLabel: {
      color: t.colors.textPrimary,
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
    },
    modeLabelActive: {
      color: '#fff',
    },
    body: {
      flexGrow: 1,
      padding: 16,
    },
    textInput: {
      minHeight: 160,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: 16,
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      lineHeight: 26,
      textAlignVertical: 'top',
    },
    preview: {
      width: '100%',
      aspectRatio: 9 / 16,
      borderRadius: t.radius.xl,
      backgroundColor: t.colors.surfaceAlt,
    },
    pickArea: {
      minHeight: 240,
      borderRadius: t.radius.xl,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: t.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    pickLabel: {
      color: t.colors.textSecondary,
      fontSize: 15 * t.fontScale,
    },
  });
