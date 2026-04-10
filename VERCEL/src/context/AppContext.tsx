import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, ThemeSettings, ChatSettings, BlockedUser, WallpaperOption } from '../types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => Promise<void>;
  
  // Theme settings
  themeSettings: ThemeSettings;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
  
  // Chat settings
  chatSettings: Map<string, ChatSettings>;
  getChatSettings: (chatId: string) => ChatSettings | undefined;
  updateChatSettings: (chatId: string, settings: Partial<ChatSettings>) => void;
  
  // Blocked users
  blockedUsers: BlockedUser[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  
  // Friends (derived from chat partners)
  friends: User[];
  setFriends: (friends: User[]) => void;
}

const defaultThemeSettings: ThemeSettings = {
  appearance: 'dark',
  chatBubbleStyle: 'default',
  fontSize: 'medium',
  globalWallpaper: undefined,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [chatSettings, setChatSettings] = useState<Map<string, ChatSettings>>(new Map());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [friends, setFriends] = useState<User[]>([]);

  const logout = useCallback(async () => {
    // TODO: Implement Firebase sign out
    setCurrentUser(null);
  }, []);

  const updateThemeSettings = useCallback((settings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const getChatSettings = useCallback((chatId: string) => {
    return chatSettings.get(chatId);
  }, [chatSettings]);

  const updateChatSettings = useCallback((chatId: string, settings: Partial<ChatSettings>) => {
    setChatSettings(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(chatId) || { chatId, muted: false };
      newMap.set(chatId, { ...existing, ...settings });
      return newMap;
    });
  }, []);

  const blockUser = useCallback((userId: string) => {
    if (!currentUser) return;
    const newBlock: BlockedUser = {
      id: `block_${Date.now()}`,
      userId: currentUser.id,
      blockedUserId: userId,
      blockedAt: new Date(),
    };
    setBlockedUsers(prev => [...prev, newBlock]);
  }, [currentUser]);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers(prev => prev.filter(b => b.blockedUserId !== userId));
  }, []);

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUsers.some(b => b.blockedUserId === userId);
  }, [blockedUsers]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        themeSettings,
        updateThemeSettings,
        chatSettings,
        getChatSettings,
        updateChatSettings,
        blockedUsers,
        blockUser,
        unblockUser,
        isUserBlocked,
        friends,
        setFriends,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
