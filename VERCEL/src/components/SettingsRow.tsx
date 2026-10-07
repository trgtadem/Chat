import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';

interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isFirst?: boolean;
  isLast?: boolean;
  style?: ViewStyle;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  isDestructive = false,
  disabled = false,
  rightElement,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  isFirst = false,
  isLast = false,
  style,
}: SettingsRowProps) {
  const Container = onPress && !isSwitch ? TouchableOpacity : View;

  return (
    <Container
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isFirst && styles.firstItem,
        isLast && styles.lastItem,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              isDestructive && styles.destructiveText,
              disabled && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {value && <Text style={styles.value}>{value}</Text>}
          {rightElement}
          {isSwitch ? (
            <Switch
              value={switchValue}
              onValueChange={onSwitchChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textPrimary}
              disabled={disabled}
            />
          ) : (
            showChevron &&
            onPress && (
              <ChevronRight
                size={18}
                color={colors.textTertiary}
                style={styles.chevron}
              />
            )
          )}
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  firstItem: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  lastItem: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  destructiveText: {
    color: colors.danger,
  },
  disabledText: {
    color: colors.textTertiary,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default SettingsRow;
