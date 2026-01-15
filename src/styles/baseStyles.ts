import { StyleSheet } from 'react-native';

export const COLORS = {
  // Mavi tonları - Modern ve özgün tasarım
  background: '#0A1628',        // Koyu mavi arka plan
  surface: '#1A2332',            // Yüzey rengi (biraz daha açık mavi-gri)
  primary: '#3B82F6',           // Parlak mavi (ana renk - butonlar, vurgular)
  textPrimary: '#E8F0F8',       // Açık mavi-beyaz metin
  textSecondary: '#94A3B8',      // Gri-mavi ikincil metin
  inputBackground: '#1E293B',     // Input arka planı (koyu mavi-gri)
  error: '#EF4444',              // Kırmızı hata rengi
  success: '#10B981',            // Yeşil başarı rengi
  read: '#60A5FA',               // Okundu işareti için açık mavi
  myMessageBubble: '#2563EB',    // Kendi mesajlarımız için koyu mavi
  theirMessageBubble: '#1E293B', // Karşı taraf mesajları için koyu yüzey
  accent: '#60A5FA',             // Vurgu rengi (açık mavi)
  border: '#334155',             // Kenarlık rengi
};

export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF', // Mavi arka plan üzerinde beyaz metin daha okunabilir
    fontSize: 16,
    fontWeight: 'bold',
  },
});
