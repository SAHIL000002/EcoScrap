import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

// EcoScrap brand mark (assets/eco-logo.png) — same identity as the Android
// launcher icon, drawn flat so it stays crisp inside the rounded icon tile.
const BRAND_MARK = require('../../assets/eco-logo.png');

export const SplashScreen = () => {
  const { setCurrentScreen, t } = useApp();
  const { width, height } = useWindowDimensions();
  const { gutter, font, bottomInset } = useResponsive();

  // Decorative rings are sized from the live viewport (capped for tablets) and
  // clipped by the container, so they can never push functional content off the
  // screen whatever the aspect ratio is.
  const ringBase = Math.min(width, height, 520);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('LANGUAGE_SELECTION');
    }, 2400);
    return () => clearTimeout(timer);
  }, [setCurrentScreen]);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.container}
      onPress={() => setCurrentScreen('LANGUAGE_SELECTION')}
    >
      {/* Decorative Circular Background Rings from Stitch */}
      <View style={styles.backgroundRings} pointerEvents="none">
        <View
          style={[
            styles.ring,
            {
              width: ringBase * 1.3,
              height: ringBase * 1.3,
              borderRadius: (ringBase * 1.3) / 2,
              borderColor: 'rgba(192, 201, 190, 0.25)'
            }
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              width: ringBase * 0.9,
              height: ringBase * 0.9,
              borderRadius: (ringBase * 0.9) / 2,
              borderColor: 'rgba(192, 201, 190, 0.35)'
            }
          ]}
        />
      </View>

      {/* Center Section: Brand Identity & Trust Value Proposition */}
      <View style={[styles.centerContent, { paddingHorizontal: gutter }]}>
        {/* Glow Aura & Elevated Brand Icon Container */}
        <View style={styles.iconWrapper}>
          <View style={styles.glowAura} />
          <View style={styles.iconContainerOuter}>
            <View style={styles.iconContainerInner}>
              <Image source={BRAND_MARK} style={styles.brandIconImage} resizeMode="contain" />
            </View>
            {/* Integrated Verified Sync Tag */}
            <View style={styles.syncTag}>
              <Text style={styles.syncTagText}>✓</Text>
            </View>
          </View>
        </View>

        {/* Prominent Brand Headline */}
        <Text style={[styles.brandHeadline, { fontSize: font(28) }]}>EcoScrap</Text>

        {/* Hindi Tagline in Pill */}
        <View style={styles.taglinePill}>
          <Text style={styles.leafIcon}>🌱</Text>
          <Text style={styles.taglineText} numberOfLines={2}>
            {t.app_tagline}
          </Text>
        </View>

        {/* Trust Subtitle with Emerald Dot Separators */}
        <View style={styles.trustRow}>
          <Text style={styles.trustItem}>सही दाम</Text>
          <View style={styles.trustDot} />
          <Text style={styles.trustItem}>सही Recycler</Text>
          <View style={styles.trustDot} />
          <Text style={styles.trustItem}>सुरक्षित Recycling</Text>
        </View>
      </View>

      {/* Bottom Area: Loading Dots & Professional Guarantee */}
      <View style={[styles.footer, { paddingHorizontal: gutter, paddingBottom: 24 + bottomInset }]}>
        <View style={styles.loadingDotsRow}>
          <View style={[styles.dot, { backgroundColor: THEME.colors.primaryContainer }]} />
          <View style={[styles.dot, { backgroundColor: THEME.colors.primaryLight }]} />
          <View style={[styles.dot, { backgroundColor: THEME.colors.secondaryContainer }]} />
        </View>

        <View style={styles.guaranteeRow}>
          <Text style={styles.verifiedIcon}>🛡️</Text>
          <Text style={styles.guaranteeText}>
            Made for informal scrap collectors & formal recyclers
          </Text>
        </View>

        <View style={styles.homeIndicator} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundRings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ring: {
    borderWidth: 1,
    position: 'absolute'
  },
  centerContent: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    zIndex: 10
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  glowAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#7ffc97',
    opacity: 0.45
  },
  iconContainerOuter: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: THEME.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#003b1b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    position: 'relative'
  },
  iconContainerInner: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Sized to the previous ♻️ glyph footprint so the 64x64 brand tile keeps
  // exactly the same visual weight and the Stitch layout is untouched.
  brandIconImage: {
    width: 44,
    height: 44
  },
  syncTag: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.secondary,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  syncTagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  brandHeadline: {
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center'
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.6)',
    marginBottom: 16
  },
  leafIcon: {
    fontSize: 14,
    marginRight: 6
  },
  taglineText: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.onSurface,
    textAlign: 'center'
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    maxWidth: '100%'
  },
  trustItem: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.secondary,
    marginHorizontal: 8
  },
  footer: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    zIndex: 10
  },
  loadingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginHorizontal: 4
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifiedIcon: {
    fontSize: 16,
    marginRight: 6
  },
  guaranteeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    textAlign: 'center'
  },
  homeIndicator: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(64, 73, 65, 0.25)',
    borderRadius: 2,
    marginTop: 18
  }
});