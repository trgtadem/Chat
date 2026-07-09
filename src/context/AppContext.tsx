import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockedUser, ChatSettings, Friend, FriendRequest, ThemeSettings, User } from '../types';
import { buildTheme, Theme } from '../theme';
import {
    acceptRequest as acceptRequestSvc,
    declineRequest as declineRequestSvc,
    sendFriendRequest as sendFriendRequestSvc,
    subscribeFriends,
    subscribeIncomingRequests,
    SendRequestResult,
} from '../services/friends';
import {
    blockUserInFirestore,
    unblockUserInFirestore,
    subscribeBlockedUsers,
    migrateLegacyBlocks,
} from '../services/blocks';

// AsyncStorage anahtarlari — ayarlar uygulama yeniden acilinca korunur
const STORAGE_KEYS = {
    theme: '@chat_theme_settings',
    chatSettings: '@chat_chat_settings',
};

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
    /** Ayarlardan turetilmis aktif tema (renkler, radius, fontScale) */
    theme: Theme;
    updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
    getChatSettings: (chatId: string) => ChatSettings | undefined;
    updateChatSettings: (chatId: string, settings: Partial<ChatSettings>) => void;
    blockedUsers: BlockedUser[];
    blockUser: (user: User) => void;
    unblockUser: (userId: string) => void;
    isUserBlocked: (userId: string) => boolean;
    /** Arkadas listesi (users/{uid}/friends) */
    friends: Friend[];
    /** Arkadas aboneligi en az bir kez yuklendi mi */
    friendsHydrated: boolean;
    /** Bekleyen gelen arkadaslik istekleri */
    incomingRequests: FriendRequest[];
    /** Verilen uid arkadas mi? */
    isFriend: (uid: string) => boolean;
    /** Koda gore arkadaslik istegi gonderir */
    sendFriendRequest: (code: string) => Promise<SendRequestResult>;
    /** Gelen istegi kabul eder */
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    /** Gelen istegi reddeder */
    declineFriendRequest: (fromUid: string) => Promise<void>;
};

// ─── Context Oluştur ─────────────────────────────────────────────────────────

const defaultThemeSettings: ThemeSettings = {
    mode: 'dark',
    accentColor: '#3B82F6',
    chatBubbleStyle: 'default',
    fontSize: 'medium',
};

// Eski kayitlardan (appearance) yeni sekile (mode) guvenli gecis
function normalizeThemeSettings(raw: any): ThemeSettings {
    if (!raw || typeof raw !== 'object') return defaultThemeSettings;
    const mode: ThemeSettings['mode'] =
        raw.mode ?? (raw.appearance === 'light' ? 'light' : raw.appearance === 'system' ? 'system' : 'dark');
    return {
        mode,
        accentColor: raw.accentColor ?? defaultThemeSettings.accentColor,
        chatBubbleStyle: raw.chatBubbleStyle ?? 'default',
        fontSize: raw.fontSize ?? 'medium',
        globalWallpaper: raw.globalWallpaper,
    };
}

const AppContext = createContext<AppContextType>({
    currentUser: null,
    setCurrentUser: () => { },
    handleLogout: () => { },
    setLogoutFn: () => { },
    themeSettings: defaultThemeSettings,
    theme: buildTheme(defaultThemeSettings, 'dark'),
    updateThemeSettings: () => { },
    getChatSettings: () => undefined,
    updateChatSettings: () => { },
    blockedUsers: [],
    blockUser: () => { },
    unblockUser: () => { },
    isUserBlocked: () => false,
    friends: [],
    friendsHydrated: false,
    incomingRequests: [],
    isFriend: () => false,
    sendFriendRequest: async () => ({ ok: false, reason: 'error' }),
    acceptFriendRequest: async () => { },
    declineFriendRequest: async () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [logoutFn, setLogoutFnState] = useState<(() => void | Promise<void>) | null>(null);
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
    const [chatSettings, setChatSettings] = useState<Map<string, ChatSettings>>(new Map());
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsHydrated, setFriendsHydrated] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    // hydrated: kalici ayarlar yuklenmeden yazma yapilmasin (varsayilanlar kaydedilmesin)
    const [hydrated, setHydrated] = useState(false);

    // Cihaz temasi (system modu icin) ve turetilmis aktif tema
    const systemScheme = useColorScheme();
    const theme = useMemo(
        () => buildTheme(themeSettings, systemScheme),
        [themeSettings, systemScheme]
    );

    // Uygulama acilirken kalici ayarlari yukle
    useEffect(() => {
        (async () => {
            try {
                const [t, c] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.theme),
                    AsyncStorage.getItem(STORAGE_KEYS.chatSettings),
                ]);
                if (t) setThemeSettings(normalizeThemeSettings(JSON.parse(t)));
                if (c) setChatSettings(new Map(JSON.parse(c) as [string, ChatSettings][]));
            } catch (error) {
                console.warn('Kalici ayarlar yuklenemedi:', error);
            } finally {
                setHydrated(true);
            }
        })();
    }, []);

    // Degisiklikleri kalici olarak kaydet (yalnizca yukleme tamamlandiktan sonra)
    useEffect(() => {
        if (!hydrated) return;
        AsyncStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(themeSettings)).catch(() => { });
    }, [themeSettings, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        AsyncStorage.setItem(
            STORAGE_KEYS.chatSettings,
            JSON.stringify(Array.from(chatSettings.entries()))
        ).catch(() => { });
    }, [chatSettings, hydrated]);

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
        blockUserInFirestore(currentUser, user).catch((error) =>
            console.error('blockUser error:', error)
        );
    }, [currentUser]);

    const unblockUser = useCallback((userId: string) => {
        if (!currentUser) return;
        unblockUserInFirestore(currentUser.id, userId).catch((error) =>
            console.error('unblockUser error:', error)
        );
    }, [currentUser]);

    const isUserBlocked = useCallback((userId: string) => {
        return blockedUsers.some((entry) => entry.blockedUserId === userId);
    }, [blockedUsers]);

    useEffect(() => {
        if (!currentUser?.id) {
            setFriends([]);
            setIncomingRequests([]);
            setFriendsHydrated(false);
            setBlockedUsers([]);
            return;
        }

        migrateLegacyBlocks(currentUser.id).catch(() => {});

        const unsubFriends = subscribeFriends(currentUser.id, (list) => {
            setFriends(list);
            setFriendsHydrated(true);
        });
        const unsubRequests = subscribeIncomingRequests(currentUser.id, setIncomingRequests);
        const unsubBlocks = subscribeBlockedUsers(currentUser.id, setBlockedUsers);

        return () => {
            unsubFriends();
            unsubRequests();
            unsubBlocks();
        };
    }, [currentUser?.id]);

    const isFriend = useCallback(
        (uid: string) => friends.some((f) => f.id === uid),
        [friends]
    );

    const sendFriendRequest = useCallback(
        (code: string): Promise<SendRequestResult> => {
            if (!currentUser) return Promise.resolve({ ok: false as const, reason: 'error' as const });
            return sendFriendRequestSvc(currentUser, code);
        },
        [currentUser]
    );

    const acceptFriendRequest = useCallback(
        (request: FriendRequest) => {
            if (!currentUser) return Promise.resolve();
            return acceptRequestSvc(currentUser, request);
        },
        [currentUser]
    );

    const declineFriendRequest = useCallback(
        (fromUid: string) => {
            if (!currentUser) return Promise.resolve();
            return declineRequestSvc(currentUser.id, fromUid);
        },
        [currentUser]
    );

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                handleLogout,
                setLogoutFn,
                themeSettings,
                theme,
                updateThemeSettings,
                getChatSettings,
                updateChatSettings,
                blockedUsers,
                blockUser,
                unblockUser,
                isUserBlocked,
                friends,
                friendsHydrated,
                incomingRequests,
                isFriend,
                sendFriendRequest,
                acceptFriendRequest,
                declineFriendRequest,
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

/**
 * Aktif temaya kisa erisim hook'u.
 *
 * @example
 * const theme = useTheme();
 * const styles = useMemo(() => makeStyles(theme), [theme]);
 */
export function useTheme(): Theme {
    return useAppContext().theme;
}

export default AppContext;
