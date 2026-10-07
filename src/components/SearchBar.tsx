import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { Theme } from '../theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Ara...' }: SearchBarProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <Search size={18} color={styles.iconColor.color} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholder.color}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <X size={18} color={styles.iconColor.color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.lg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      marginHorizontal: 12,
      marginTop: 6,
      marginBottom: 4,
    },
    input: {
      flex: 1,
      fontSize: 15 * theme.fontScale,
      color: theme.colors.textPrimary,
      padding: 0,
    },
    iconColor: { color: theme.colors.textSecondary },
    placeholder: { color: theme.colors.textSecondary },
  });
