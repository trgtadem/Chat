import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { COLORS } from '../styles/baseStyles';
import { useAppContext } from '../context/AppContext';
import { RootStackParamList } from '../types/navigation';

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { currentUser, setCurrentUser } = useAppContext();
  const [name, setName] = useState(currentUser?.name ?? 'Unknown');
  const [surname, setSurname] = useState(currentUser?.surname ?? '');
  const [about, setAbout] = useState(currentUser?.about ?? '');
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? 'https://via.placeholder.com/100');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    formData.append('upload_preset', 'my_app');

    const response = await fetch('https://api.cloudinary.com/v1_1/dhrtxb1ou/image/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Avatar değiştirmek için medya izni gerekli.');
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
        const avatarUrl = await uploadToCloudinary(result.assets[0].uri);
        setAvatar(avatarUrl);
      }
    } catch (error) {
      console.error('Avatar picking error:', error);
      Alert.alert('Error', 'Avatar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Validation', 'Ad ve soyad zorunludur.');
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

      Alert.alert('Başarılı', 'Profilin güncellendi.', [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Profil güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ad"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Soyad</Text>
            <TextInput
              style={styles.input}
              placeholder="Soyad"
              placeholderTextColor={COLORS.textSecondary}
              value={surname}
              onChangeText={setSurname}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hakkımda</Text>
            <TextInput
              style={[styles.input, styles.aboutInput]}
              placeholder="Kendinden bahset..."
              placeholderTextColor={COLORS.textSecondary}
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
            {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveText}>Kaydet</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
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
    borderRadius: 60,
    backgroundColor: COLORS.surface,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  aboutInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  emailText: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  saveButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
