import React from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppContext, useTheme } from '../context/AppContext';
import { RootStackParamList } from '../types/navigation';

import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { AddFriendScreen } from '../screens/AddFriendScreen';
import { ThemesScreen } from '../screens/ThemesScreen';
import { SecurityScreen } from '../screens/SecurityScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { BlockedUsersScreen } from '../screens/BlockedUsersScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { StarredMessagesScreen } from '../screens/StarredMessagesScreen';
import { ChatWallpaperScreen } from '../screens/ChatWallpaperScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  loading: boolean;
};

export function RootNavigator({ loading }: RootNavigatorProps) {
  const { currentUser } = useAppContext();
  const theme = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const navBase = theme.colors.isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...navBase,
        colors: {
          ...navBase.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
    >
      <StatusBar
        barStyle={theme.colors.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="AddFriend" component={AddFriendScreen} />
            <Stack.Screen name="Themes" component={ThemesScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="StarredMessages" component={StarredMessagesScreen} />
            <Stack.Screen name="ChatWallpaper" component={ChatWallpaperScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
