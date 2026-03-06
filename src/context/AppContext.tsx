import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

type AppContextType = {
    /** Giriş yapmış kullanıcı. Giriş yoksa null. */
    currentUser: User | null;
    /** Kullanıcı bilgisini günceller (profil düzenleme sonrası) */
    setCurrentUser: (user: User | null) => void;
    /** Uygulamadan çıkış yapar */
    handleLogout: () => void;
    /** Logout fonksiyonunu dışarıdan set et (App.tsx'ten) */
    setLogoutFn: (fn: () => void) => void;
};

// ─── Context Oluştur ─────────────────────────────────────────────────────────

const AppContext = createContext<AppContextType>({
    currentUser: null,
    setCurrentUser: () => { },
    handleLogout: () => { },
    setLogoutFn: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [logoutFn, setLogoutFnState] = useState<(() => void) | null>(null);

    const handleLogout = useCallback(() => {
        if (logoutFn) logoutFn();
    }, [logoutFn]);

    const setLogoutFn = useCallback((fn: () => void) => {
        setLogoutFnState(() => fn);
    }, []);

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                handleLogout,
                setLogoutFn,
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
