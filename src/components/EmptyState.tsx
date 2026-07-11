import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../context/AppContext';
import { Theme } from '../theme';

type EmptyStateProps = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={36} color={theme.colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 36,
      paddingVertical: 48,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: t.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      color: t.colors.textPrimary,
      fontSize: 17 * t.fontScale,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      color: t.colors.textSecondary,
      fontSize: 14 * t.fontScale,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
