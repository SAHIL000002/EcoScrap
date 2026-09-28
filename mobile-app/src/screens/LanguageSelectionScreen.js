import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton } from '../components/Layout';

// EcoScrap brand mark — identical asset to the Android launcher icon.
const BRAND_MARK = require('../../assets/eco-logo.png');

export const LanguageSelectionScreen = () => {
  const { language, changeLanguage, setCurrentScreen, t } = useApp();
  const { gutter, bottomInset, font, scale } = useResponsive();

  const handleSelect = async (code) => {
    await changeLanguage(code);
  };

  const handleProceed = () => {
    setCurrentScreen('LOGIN');
  };

  return (
    <View style={styles.container}>
      {/* Top App Header with Navigation Bar (safe-area aware, collision proof) */}
      <ScreenHeader
        left={
          <HeaderIconButton
            onPress={() => setCurrentScreen('SPLASH')}
            accessibilityLabel={t.nav_home}
          >
            <Text style={styles.backIcon}>←</Text>
          </HeaderIconButton>
        }
        center={
          <View style={styles.brandTitleRow}>
            <Image source={BRAND_MARK} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandTitle} numberOfLines={1} ellipsizeMode="tail">
              EcoScrap
            </Text>
          </View>
        }
        right={
          <HeaderIconButton accessibilityLabel={t.select_language}>
            <Text style={styles.translateIcon}>🌐</Text>
          </HeaderIconButton>
        }
      />

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Badge */}
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>{t.step_1_of_3}</Text>
        </View>

        {/* Primary Screen Headline */}
        <Text style={[styles.headlineHi, { fontSize: font(26) }]}>{t.select_language}</Text>
        <Text style={[styles.headlineEn, { fontSize: font(17) }]}>
          {t.select_language_en || 'Select Your Language'}
        </Text>

        {/* Reassurance Subtext */}
        <Text style={styles.subtext}>{t.change_later_note}</Text>

        {/* Language Cards */}
        <View style={styles.cardsContainer}>
          {/* 1. Hindi Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.langCard,
              language === 'HI' ? styles.langCardSelected : styles.langCardDefault
            ]}
            onPress={() => handleSelect('HI')}
          >
            <View style={styles.cardLeft}>
              <View style={styles.flagCircle}>
                <Text style={styles.flagText}>🇮🇳</Text>
              </View>
              <View style={styles.cardTextCol}>
                <Text
                  style={[
                    styles.cardMainTitle,
                    { fontSize: font(20) },
                    language === 'HI' && styles.cardMainTitleActive
                  ]}
                >
                  {t.lang_hindi || 'हिंदी'}
                </Text>
                <Text style={styles.cardSubTitle}>{t.lang_hindi_sub || 'हिंदी में इस्तेमाल करें'}</Text>
              </View>
            </View>

            <View style={[
              styles.radioCircle,
              language === 'HI' ? styles.radioCircleSelected : styles.radioCircleDefault
            ]}>
              {language === 'HI' && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>

          {/* 2. Marathi Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.langCard,
              language === 'MR' ? styles.langCardSelected : styles.langCardDefault
            ]}
            onPress={() => handleSelect('MR')}
          >
            <View style={styles.cardLeft}>
              <View style={styles.letterCircle}>
                <Text style={styles.letterText}>म</Text>
              </View>
              <View style={styles.cardTextCol}>
                <Text
                  style={[
                    styles.cardMainTitle,
                    { fontSize: font(20) },
                    language === 'MR' && styles.cardMainTitleActive
                  ]}
                >
                  {t.lang_marathi || 'मराठी'}
                </Text>
                <Text style={styles.cardSubTitle}>{t.lang_marathi_sub || 'मराठीत वापरा'}</Text>
              </View>
            </View>

            <View style={[
              styles.radioCircle,
              language === 'MR' ? styles.radioCircleSelected : styles.radioCircleDefault
            ]}>
              {language === 'MR' && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>

          {/* 3. English Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.langCard,
              language === 'EN' ? styles.langCardSelected : styles.langCardDefault
            ]}
            onPress={() => handleSelect('EN')}
          >
            <View style={styles.cardLeft}>
              <View style={styles.globeCircle}>
                <Text style={styles.globeText}>EN</Text>
              </View>
              <View style={styles.cardTextCol}>
                <Text
                  style={[
                    styles.cardMainTitle,
                    { fontSize: font(20) },
                    language === 'EN' && styles.cardMainTitleActive
                  ]}
                >
                  {t.lang_english || 'English'}
                </Text>
                <Text style={styles.cardSubTitle}>{t.lang_english_sub || 'Use in English'}</Text>
              </View>
            </View>

            <View style={[
              styles.radioCircle,
              language === 'EN' ? styles.radioCircleSelected : styles.radioCircleDefault
            ]}>
              {language === 'EN' && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* Audio Assistance Banner for Low-Literacy Scrap Collectors */}
        <View style={styles.audioAssistBox}>
          <View style={styles.speakerIconWrapper}>
            <Text style={styles.speakerIcon}>🔊</Text>
          </View>
          <Text style={styles.audioAssistText}>{t.audio_assist_hint}</Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Footer (in normal flow, so the CTA can never be
          covered by content or by the system navigation area) */}
      <View style={[styles.footer, { paddingHorizontal: gutter, paddingBottom: 20 + bottomInset }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.ctaButton, { minHeight: scale(56) }]}
          onPress={handleProceed}
        >
          <Text style={[styles.ctaButtonText, { fontSize: font(18) }]}>{t.btn_proceed}</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        {/* Authorized Network Partner Trust Stamp */}
        <View style={styles.partnerStampRow}>
          <Text style={styles.stampIcon}>🛡️</Text>
          <Text style={styles.stampText}>{t.partner_stamp}</Text>
        </View>

        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },
  // Header + brand styles are shared through components/Layout.js
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  brandTitleRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Same 20px box the ♻️ glyph used, so the header row spacing is unchanged.
  brandLogo: {
    width: 20,
    height: 20,
    marginRight: 6
  },
  brandTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.3
  },
  translateIcon: {
    fontSize: 18
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 16
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    marginBottom: 12
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  headlineHi: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.onSurface,
    lineHeight: 32
  },
  headlineEn: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 8
  },
  subtext: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginBottom: 20
  },
  cardsContainer: {
    gap: 12
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff'
  },
  langCardDefault: {
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  langCardSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.primaryContainer,
    elevation: 2,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  flagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  flagText: {
    fontSize: 22
  },
  letterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  letterText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primaryLight
  },
  globeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  globeText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.info
  },
  cardTextCol: {
    flex: 1,
    minWidth: 0
  },
  cardMainTitle: {
    flexShrink: 1,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  cardMainTitleActive: {
    color: THEME.colors.primary,
    fontWeight: '800'
  },
  cardSubTitle: {
    flexShrink: 1,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleDefault: {
    borderWidth: 2,
    borderColor: THEME.colors.outlineVariant
  },
  radioCircleSelected: {
    backgroundColor: THEME.colors.primaryContainer
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  audioAssistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.4)'
  },
  speakerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  speakerIcon: {
    fontSize: 16
  },
  audioAssistText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.onSurfaceVariant,
    lineHeight: 18
  },
  footer: {
    paddingTop: 12,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 227, 0.6)'
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003b1b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3
  },
  ctaButtonText: {
    flexShrink: 1,
    fontWeight: '800',
    color: '#ffffff',
    marginRight: 8,
    textAlign: 'center'
  },
  ctaArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  },
  partnerStampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 12
  },
  stampIcon: {
    fontSize: 14,
    marginRight: 6
  },
  stampText: {
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
    alignSelf: 'center',
    marginTop: 14
  }
});