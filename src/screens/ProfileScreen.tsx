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

import { db } from '../../firebaseConfig';
import { User } from '../types';
import { COLORS, baseStyles } from '../styles/baseStyles';
import { doc, updateDoc } from 'firebase/firestore';

type RootStackParamList = {
  Profile: { user: User };
};

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({
  route,
  navigation,
  currentUser,
  onUserUpdate,
}: {
  route: ProfileScreenProps['route'];
  navigation: ProfileScreenProps['navigation'];
  currentUser: User;
  onUserUpdate: (user: User) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [surname, setSurname] = useState(currentUser.surname);
  const [about, setAbout] = useState(currentUser.about || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
      formData.append('upload_preset', 'my_app');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dhrtxb1ou/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          'You need to grant camera roll permissions to change avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const avatarUrl = await uploadToCloudinary(result.assets[0].uri);
        setAvatar(avatarUrl);
        setLoading(false);
      }
    } catch (error) {
      console.error('Avatar picking error:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Validation', 'Name and surname are required.');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {
        name,
        surname,
        about,
        avatar,
      };

      await updateDoc(doc(db, 'users', currentUser.id), updateData);

      const updatedUser: User = {
        ...currentUser,
        ...updateData,
      };

      onUserUpdate(updatedUser);
      setIsEditing(false);

      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser.name);
    setSurname(currentUser.surname);
    setAbout(currentUser.about || '');
    setAvatar(currentUser.avatar);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={baseStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <ChevronLeft size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              {isEditing && (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handlePickAvatar}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Camera size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {!isEditing && (
              <Text style={styles.hintText}>
                Click the pencil icon to edit
              </Text>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>First Name</Text>
            <TextInput
              style={[
                styles.input,
                { opacity: isEditing ? 1 : 0.6 },
              ]}
              placeholder="First name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              editable={isEditing}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Last Name</Text>
            <TextInput
              style={[
                styles.input,
                { opacity: isEditing ? 1 : 0.6 },
              ]}
              placeholder="Last name"
              placeholderTextColor={COLORS.textSecondary}
              value={surname}
              onChangeText={setSurname}
              editable={isEditing}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <TextInput
              style={[
                styles.input,
                styles.aboutInput,
                { opacity: isEditing ? 1 : 0.6 },
              ]}
              placeholder="Write something about yourself..."
              placeholderTextColor={COLORS.textSecondary}
              value={about}
              onChangeText={setAbout}
              editable={isEditing}
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

          {/* Action Buttons */}
          {!isEditing ? (
            <TouchableOpacity
              style={[baseStyles.button, { marginTop: 32 }]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={baseStyles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[baseStyles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={baseStyles.buttonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[baseStyles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
    marginBottom: 12,
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
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
  buttonGroup: {
    gap: 12,
    marginTop: 32,
  },
  saveButton: {
    marginBottom: 0,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
