import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Responsive layout primitives shared by the Stitch screens.
 *
 * These replace the previous fixed-coordinate headers/footers:
 *  - the app root owns the TOP safe area (status bar / notch / Dynamic Island)
 *  - every bar owns its own BOTTOM safe area (home indicator / gesture bar)
 *  - headers are three real flex slots, so long Hindi/Marathi labels shrink
 *    or wrap instead of colliding or clipping
 */

export const HEADER_MIN_HEIGHT = 56;
export const HEADER_VERTICAL_PADDING = 10;
export const BOTTOM_BAR_PADDING_TOP = 12;
export const BOTTOM_BAR_PADDING_BOTTOM = 12;

/**
 * Generic 3-slot app bar: [left] [center (flexible)] [right]
 * Slots never collide: the centre slot is the only flexible one and it shrinks
 * before the side slots do.
 */
export const ScreenHeader = ({ left = null, center = null, right = null, style = null }) => {
  const { gutter } = useResponsive();

  return (
    <View style={[styles.header, { paddingHorizontal: gutter }, style]}>
      {left ? <View style={styles.slotLeft}>{left}</View> : null}
      <View style={styles.slotCenter}>{center}</View>
      {right ? <View style={styles.slotRight}>{right}</View> : null}
    </View>
  );
};

/**
 * Square header affordance (back / language / audio). Visual size is preserved
 * from the existing design; hitSlop guarantees a 44x44+ touch target.
 */
export const HeaderIconButton = ({
  onPress,
  children,
  accessibilityLabel,
  size = 40,
  rounded = 'circle', // circle | rounded
  tone = 'surface', // surface | plain
  style = null
}) => {
  const { scale } = useResponsive();
  const side = scale(size);
  const shapeStyle = [
    styles.iconButton,
    {
      width: side,
      height: side,
      borderRadius: rounded === 'rounded' ? 14 : side / 2
    },
    tone === 'surface' && { backgroundColor: THEME.colors.surfaceContainer },
    style
  ];

  // Decorative affordances (e.g. the language globe) are not pressable.
  if (!onPress) {
    return <View style={shapeStyle}>{children}</View>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={shapeStyle}
    >
      {children}
    </TouchableOpacity>
  );
};

/**
 * Edge-to-edge bottom CTA bar. It is absolutely positioned (matching the Stitch
 * `fixed bottom-0` intent) and reserves the device bottom inset internally, so
 * no surrounding layout can push it around and it never sits under the gesture
 * bar.
 */
export const BottomActionBar = ({ children, style = null }) => {
  const { gutter, bottomInset } = useResponsive();

  return (
    <View
      style={[
        styles.bottomBar,
        {
          paddingHorizontal: gutter,
          paddingBottom: BOTTOM_BAR_PADDING_BOTTOM + bottomInset
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

/**
 * Height that a screen must reserve at the end of its scrollable content so the
 * last card is never hidden behind a fixed bottom bar.
 */
export const useBottomBarSpace = (barContentHeight) => {
  const { bottomInset } = useResponsive();
  return barContentHeight + BOTTOM_BAR_PADDING_TOP + BOTTOM_BAR_PADDING_BOTTOM + bottomInset;
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_MIN_HEIGHT,
    paddingVertical: HEADER_VERTICAL_PADDING,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 227, 0.6)'
  },
  slotLeft: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8
  },
  slotCenter: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotRight: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: BOTTOM_BAR_PADDING_TOP,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 227, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 8
  }
});


