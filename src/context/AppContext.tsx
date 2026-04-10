import React, { createContext, useCallback, useContext, useState } from 'react';
import { BlockedUser, ChatSettings, ThemeSettings, User } from '../types';

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

type AppContextType = {
    /** Giriş yapmış kullanıcı. Giriş yoksa null. */
    currentUser: User | null;
    /** Kullanıcı bilgisini günceller (profil düzenleme sonrası) */
    setCurrentUser: (user: User | null) => void;
    /** Uygulamadan çıkış yapar */
    handleLogout: () => void;
    /** Logout fonksiyonunu dışarıdan set et (App.tsx'ten) */
    setLogoutFn: (fn: () => void | Promise<void>) => void;
    themeSettings: ThemeSettings;
    updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
    getChatSettings: (chatId: string) => ChatSettings | undefined;
    updateChatSettings: (chatId: string, settings: Partial<ChatSettings>) => void;
    blockedUsers: BlockedUser[];
    blockUser: (user: User) => void;
    unblockUser: (userId: string) => void;
    isUserBlocked: (userId: string) => boolean;
    friends: User[];
    setFriends: (friends: User[]) => void;
};

// ─── Context Oluştur ─────────────────────────────────────────────────────────

const defaultThemeSettings: ThemeSettings = {
    appearance: 'dark',
    chatBubbleStyle: 'default',
    fontSize: 'medium',
};

const AppContext = createContext<AppContextType>({
    currentUser: null,
    setCurrentUser: () => { },
    handleLogout: () => { },
    setLogoutFn: () => { },
    themeSettings: defaultThemeSettings,
    updateThemeSettings: () => { },
    getChatSettings: () => undefined,
    updateChatSettings: () => { },
    blockedUsers: [],
    blockUser: () => { },
    unblockUser: () => { },
    isUserBlocked: () => false,
    friends: [],
    setFriends: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [logoutFn, setLogoutFnState] = useState<(() => void | Promise<void>) | null>(null);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
    const [chatSettings, setChatSettings] = useState<Map<string, ChatSettings>>(new Map());
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [friends, setFriends] = useState<User[]>([]);

    const handleLogout = useCallback(() => {
        if (logoutFn) logoutFn();
    }, [logoutFn]);

    const setLogoutFn = useCallback((fn: () => void | Promise<void>) => {
        setLogoutFnState(() => fn);
    }, []);

    const updateThemeSettings = useCallback((settings: Partial<ThemeSettings>) => {
        setThemeSettings((prev) => ({ ...prev, ...settings }));
    }, []);

    const getChatSettings = useCallback((chatId: string) => {
        return chatSettings.get(chatId);
    }, [chatSettings]);

    const updateChatSettings = useCallback((chatId: string, settings: Partial<ChatSettings>) => {
        setChatSettings((prev) => {
            const next = new Map(prev);
            const current = next.get(chatId) ?? { chatId, muted: false };
            next.set(chatId, { ...current, ...settings });
            return next;
        });
    }, []);

    const blockUser = useCallback((user: User) => {
        if (!currentUser || user.id === currentUser.id) return;

        setBlockedUsers((prev) => {
            if (prev.some((entry) => entry.blockedUserId === user.id)) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: `blocked-${user.id}`,
                    userId: currentUser.id,
                    blockedUserId: user.id,
                    blockedAt: new Date(),
                    user,
                },
            ];
        });
    }, [currentUser]);

    const unblockUser = useCallback((userId: string) => {
        setBlockedUsers((prev) => prev.filter((entry) => entry.blockedUserId !== userId));
    }, []);

    const isUserBlocked = useCallback((userId: string) => {
        return blockedUsers.some((entry) => entry.blockedUserId === userId);
    }, [blockedUsers]);

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                handleLogout,
                setLogoutFn,
                themeSettings,
                updateThemeSettings,
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Uygulama genelindeki global state'e erişim hook'u.
 *
 * @example
 * const { currentUser, handleLogout } = useAppContext();
 */
export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error('useAppContext must be used inside <AppProvider>');
    }
    return ctx;
}

export default AppContext;
