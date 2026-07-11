import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react-native';

import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
  durationMs: number;
};

type FeedbackApi = {
  toast: {
    show: (input: ToastInput | string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

/** Hook disi (useAuthBootstrap vb.) icin */
let feedbackApiRef: FeedbackApi | null = null;

export function getFeedback(): FeedbackApi | null {
  return feedbackApiRef;
}

function normalizeToast(input: ToastInput | string): ToastItem {
  if (typeof input === 'string') {
    return {
      id: `${Date.now()}-${Math.random()}`,
      message: input,
      variant: 'info',
      durationMs: 2800,
    };
  }
  return {
    id: `${Date.now()}-${Math.random()}`,
    title: input.title,
    message: input.message,
    variant: input.variant ?? 'info',
    durationMs: input.durationMs ?? (input.variant === 'error' ? 3500 : 2800),
  };
}

function ToastHost({
  current,
  onDone,
}: {
  current: ToastItem | null;
  onDone: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeToastStyles(theme), [theme]);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    translateY.setValue(-80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDone();
      });
    }, current.durationMs);

    return () => clearTimeout(t);
  }, [current?.id]);

  if (!current) return null;

  const accent =
    current.variant === 'success'
      ? theme.colors.success
      : current.variant === 'error'
        ? theme.colors.error
        : current.variant === 'warning'
          ? '#F59E0B'
          : theme.colors.primary;

  const Icon =
    current.variant === 'success'
      ? CheckCircle2
      : current.variant === 'error'
        ? XCircle
        : current.variant === 'warning'
          ? AlertTriangle
          : Info;

  return (
    <View pointerEvents="box-none" style={[styles.toastWrap, { paddingTop: insets.top + 8 }]}>
      <Animated.View
        style={[
          styles.toast,
          { borderLeftColor: accent, opacity, transform: [{ translateY }] },
        ]}
      >
        <Icon size={20} color={accent} />
        <View style={{ flex: 1 }}>
          {!!current.title && <Text style={styles.toastTitle}>{current.title}</Text>}
          <Text style={styles.toastMessage} numberOfLines={3}>
            {current.message}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function ConfirmHost({
  options,
  onResolve,
}: {
  options: ConfirmOptions | null;
  onResolve: (value: boolean) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeConfirmStyles(theme), [theme]);

  if (!options) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onResolve(false)}>
      <Pressable style={styles.overlay} onPress={() => onResolve(false)}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{options.title}</Text>
          {!!options.message && <Text style={styles.message}>{options.message}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={() => onResolve(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnCancelText}>{options.cancelLabel ?? 'Vazgeç'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                options.destructive ? styles.btnDestructive : styles.btnPrimary,
              ]}
              onPress={() => onResolve(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnConfirmText}>
                {options.confirmLabel ?? (options.destructive ? 'Sil' : 'Tamam')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolver = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  const showToast = useCallback((input: ToastInput | string) => {
    setQueue((q) => [...q, normalizeToast(input)]);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      setConfirmOptions(options);
    });
  }, []);

  const resolveConfirm = useCallback((value: boolean) => {
    setConfirmOptions(null);
    confirmResolver.current?.(value);
    confirmResolver.current = null;
  }, []);

  const api = useMemo<FeedbackApi>(
    () => ({
      toast: {
        show: showToast,
        success: (message, title) =>
          showToast({ message, title, variant: 'success' }),
        error: (message, title) => showToast({ message, title, variant: 'error' }),
        warning: (message, title) =>
          showToast({ message, title, variant: 'warning' }),
        info: (message, title) => showToast({ message, title, variant: 'info' }),
      },
      confirm,
    }),
    [showToast, confirm]
  );

  useEffect(() => {
    feedbackApiRef = api;
    return () => {
      if (feedbackApiRef === api) feedbackApiRef = null;
    };
  }, [api]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastHost current={current} onDone={() => setCurrent(null)} />
      <ConfirmHost options={confirmOptions} onResolve={resolveConfirm} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}

const makeToastStyles = (t: Theme) =>
  StyleSheet.create({
    toastWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      width: '100%',
      maxWidth: 480,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      borderLeftWidth: 4,
      paddingVertical: 12,
      paddingHorizontal: 14,
      shadowColor: t.colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    toastTitle: {
      color: t.colors.textPrimary,
      fontWeight: '700',
      fontSize: 14 * t.fontScale,
      marginBottom: 2,
    },
    toastMessage: {
      color: t.colors.textSecondary,
      fontSize: 13 * t.fontScale,
      lineHeight: 18,
    },
  });

const makeConfirmStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: t.colors.overlay ?? 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: 20,
    },
    title: {
      color: t.colors.textPrimary,
      fontSize: 18 * t.fontScale,
      fontWeight: '700',
      marginBottom: 8,
    },
    message: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      lineHeight: 20,
      marginBottom: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'flex-end',
    },
    btn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: t.radius.lg,
      minWidth: 88,
      alignItems: 'center',
    },
    btnCancel: {
      backgroundColor: t.colors.surfaceAlt,
    },
    btnPrimary: {
      backgroundColor: t.colors.primary,
    },
    btnDestructive: {
      backgroundColor: t.colors.error,
    },
    btnCancelText: {
      color: t.colors.textPrimary,
      fontWeight: '600',
      fontSize: 14 * t.fontScale,
    },
    btnConfirmText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14 * t.fontScale,
    },
  });
