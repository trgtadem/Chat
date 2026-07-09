// Tema paletleri: Acik, Koyu ve AMOLED.
// Goz yormamasi icin saf beyaz/siyah yerine kirik-beyaz metin ve yumusak
// kontrastlar tercih edildi.

export type Palette = {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  headerBackground: string;
  inputBackground: string;
  primary: string;
  accent: string;
  onAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  read: string;
  myMessageBubble: string;
  theirMessageBubble: string;
  myMessageText: string;
  theirMessageText: string;
  overlay: string;
  shadow: string;
};

export const darkPalette: Palette = {
  isDark: true,
  background: '#0A1628',
  surface: '#151E2E',
  surfaceAlt: '#1E293B',
  headerBackground: '#121B2A',
  inputBackground: '#1E293B',
  primary: '#3B82F6',
  accent: '#3B82F6',
  onAccent: '#FFFFFF',
  textPrimary: '#E6EDF5',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#2A3646',
  error: '#EF4444',
  success: '#10B981',
  read: '#60A5FA',
  myMessageBubble: '#2563EB',
  theirMessageBubble: '#1E293B',
  myMessageText: '#FFFFFF',
  theirMessageText: '#E6EDF5',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const amoledPalette: Palette = {
  isDark: true,
  background: '#000000',
  surface: '#0B0F14',
  surfaceAlt: '#12161C',
  headerBackground: '#000000',
  inputBackground: '#12161C',
  primary: '#3B82F6',
  accent: '#3B82F6',
  onAccent: '#FFFFFF',
  textPrimary: '#E6EDF5',
  textSecondary: '#8B96A5',
  textMuted: '#5B6675',
  border: '#1C2530',
  error: '#EF4444',
  success: '#10B981',
  read: '#60A5FA',
  myMessageBubble: '#2563EB',
  theirMessageBubble: '#12161C',
  myMessageText: '#FFFFFF',
  theirMessageText: '#E6EDF5',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
};

export const lightPalette: Palette = {
  isDark: false,
  background: '#F2F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EAEEF5',
  headerBackground: '#FFFFFF',
  inputBackground: '#EDF1F7',
  primary: '#2563EB',
  accent: '#2563EB',
  onAccent: '#FFFFFF',
  textPrimary: '#16202E',
  textSecondary: '#5B6B7F',
  textMuted: '#8A97A8',
  border: '#DCE3ED',
  error: '#DC2626',
  success: '#059669',
  read: '#2563EB',
  myMessageBubble: '#2563EB',
  theirMessageBubble: '#FFFFFF',
  myMessageText: '#FFFFFF',
  theirMessageText: '#16202E',
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#334155',
};
