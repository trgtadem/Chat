import React, { useState, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, updateDoc } from 'firebase/firestore';

import { uploadToCloudinary } from '../services/media';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { useAppContext, useTheme } from '../context/AppContext';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { useFeedback } from '../feedback/FeedbackContext';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { currentUser, setCurrentUser } = useAppContext();
  const { toast } = useFeedback();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [name, setName] = useState(currentUser?.name ?? 'Unknown');
  const [surname, setSurname] = useState(currentUser?.surname ?? '');
  const [about, setAbout] = useState(currentUser?.about ?? '');
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? 'https://via.placeholder.com/100');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (!currentUser) return null;

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.info('Avatar değiştirmek için medya izni gerekli.', 'İzin gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const uploaded = await uploadToCloudinary(result.assets[0].uri, 'avatar.jpg', 'image/jpeg');
        const avatarUrl = uploaded.url;
        setAvatar(avatarUrl);
      }
    } catch (error) {
      console.error('Avatar picking error:', error);
      toast.error('Avatar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      toast.warning('Ad ve soyad zorunludur.', 'Eksik bilgi');
      return;
    }

    try {
      setLoading(true);
      const updateData: Partial<User> = {
        name,
        surname,
        about,
        avatar,
      };

      await updateDoc(doc(db, 'users', currentUser.id), updateData);
      setCurrentUser({
        ...currentUser,
        ...updateData,
      });

      toast.success('Profilin güncellendi.');
      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={theme.colors.onAccent} /> : <Camera size={20} color={theme.colors.onAccent} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ad"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Soyad"
              placeholderTextColor={theme.colors.textSecondary}
              value={surname}
              onChangeText={setSurname}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hakkımda</Text>
            <TextInput
              style={[styles.input, styles.aboutInput]}
              placeholder="Kendinden bahset..."
              placeholderTextColor={theme.colors.textSecondary}
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Email</Text>
            <View style={[styles.input, { justifyContent: 'center' }]}>
              <Text style={styles.emailText}>{currentUser.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={theme.colors.onAccent} /> : <Text style={styles.saveText}>Kaydet</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.background },
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
    content: {
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: t.colors.primary,
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: t.colors.background,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14 * t.fontScale,
      fontWeight: '600',
      color: t.colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: t.colors.inputBackground,
      borderRadius: t.radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    aboutInput: {
      minHeight: 100,
      paddingTop: 12,
    },
    emailText: {
      color: t.colors.textPrimary,
      fontSize: 16 * t.fontScale,
    },
    saveButton: {
      width: '100%',
      backgroundColor: t.colors.primary,
      borderRadius: t.radius.lg,
      padding: 16,
      alignItems: 'center',
      marginTop: 12,
    },
    saveText: {
      color: t.colors.onAccent,
      fontSize: 16 * t.fontScale,
      fontWeight: '700',
    },
  });
