import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#111B21',
  surface: '#202C33',
  primary: '#00A884',
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  inputBackground: '#2A3942',
  error: '#CF6679',
  success: '#00A884',
  read: '#53BDEB',
  myMessageBubble: '#005C4B',
  theirMessageBubble: '#202C33',
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
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
