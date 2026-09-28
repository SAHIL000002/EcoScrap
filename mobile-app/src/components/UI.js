import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  icon = null,
  style = {}
}) => {
  const getBackgroundColor = () => {
    if (disabled) return THEME.colors.borderStrong;
    switch (variant) {
      case 'primary':
        return THEME.colors.primary;
      case 'secondary':
        return THEME.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'danger':
        return THEME.colors.danger;
      default:
        return THEME.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return THEME.colors.textMuted;
    if (variant === 'outline') return THEME.colors.primary;
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 1.5, borderColor: THEME.colors.primary },
        styles[`size_${size}`],
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, styles[`textSize_${size}`]]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const Card = ({ children, style = {}, onPress = null }) => {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

export const Badge = ({ label, variant = 'primary', style = {} }) => {
  const getBg = () => {
    switch (variant) {
      case 'success':
        return THEME.colors.primaryBg;
      case 'warning':
        return THEME.colors.secondaryBg;
      case 'danger':
        return THEME.colors.dangerBg;
      case 'info':
        return THEME.colors.infoBg;
      default:
        return THEME.colors.primaryBg;
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'success':
        return THEME.colors.primary;
      case 'warning':
        return THEME.colors.secondary;
      case 'danger':
        return THEME.colors.danger;
      case 'info':
        return THEME.colors.info;
      default:
        return THEME.colors.primary;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBg() }, style]}>
      <Text style={[styles.badgeText, { color: getColor() }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconContainer: {
    marginRight: 8
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  text: {
    fontWeight: '700',
    textAlign: 'center'
  },
  textSize_sm: {
    fontSize: THEME.typography.sm
  },
  textSize_md: {
    fontSize: THEME.typography.md
  },
  textSize_lg: {
    fontSize: THEME.typography.lg
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: THEME.typography.xs,
    fontWeight: '700'
  }
});
