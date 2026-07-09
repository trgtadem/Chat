import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { Theme } from '../theme';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color={styles.backIcon.color} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={styles.backPlaceholder} />}</View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    backButton: { padding: 8 },
    backPlaceholder: { width: 44 },
    backIcon: { color: theme.colors.textPrimary },
    title: {
      flex: 1,
      fontSize: 18 * theme.fontScale,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    right: { minWidth: 44, alignItems: 'flex-end' },
  });
