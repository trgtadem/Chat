import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../styles/baseStyles';

interface SettingsSectionProps {
  title?: string;
  children: ReactNode;
  footer?: string;
}

export function SettingsSection({ title, children, footer }: SettingsSectionProps) {
  const childArray = React.Children.toArray(children);
  const childCount = childArray.length;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={styles.content}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              isFirst: index === 0,
              isLast: index === childCount - 1,
            });
          }
          return child;
        })}
      </View>
      {footer && (
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>{footer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  footerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  footer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },
});

export default SettingsSection;
