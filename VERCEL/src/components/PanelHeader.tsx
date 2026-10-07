import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { colors, spacing, fontSize } from '../styles/baseStyles';

interface PanelHeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  rightElement?: React.ReactNode;
  showBackArrow?: boolean;
}

export function PanelHeader({
  title,
  onBack,
  onClose,
  rightElement,
  showBackArrow = true,
}: PanelHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {(onBack || onClose) && showBackArrow && (
          <TouchableOpacity
            onPress={onBack || onClose}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightElement}
        {onClose && !showBackArrow && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
});

export default PanelHeader;
