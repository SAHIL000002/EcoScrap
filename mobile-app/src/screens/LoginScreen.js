import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton } from '../components/Layout';

// EcoScrap brand mark — identical asset to the Android launcher icon.
const BRAND_MARK = require('../../assets/eco-logo.png');

export const LoginScreen = () => {
  const { login, isLoading, language, changeLanguage, setCurrentScreen, t } = useApp();
  const { gutter, bottomInset, topInset, font, scale } = useResponsive();
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [errorMessage, setErrorMessage] = useState('');

  const nextLanguage = () => {
    if (language === 'HI') changeLanguage('MR');
    else if (language === 'MR') changeLanguage('EN');
    else changeLanguage('HI');
  };

  const handleSendOtpOrLogin = async (rawPhone = null) => {
    setErrorMessage('');
    const num = (rawPhone || phoneNumber).trim().replace(/[^0-9]/g, '');

    if (num.length < 10) {
      setErrorMessage(t.phone_empty_err || 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें');
      return;
    }

    const formattedPhone = `+91${num.slice(-10)}`;
    const result = await login(formattedPhone, 'Password@123');

    if (!result.success) {
      if (result.isOffline) {
        setErrorMessage(t.network_err || 'सर्वर से कनेक्ट नहीं हो सका. कृपया नेटवर्क जांचें.');
      } else {
        setErrorMessage(result.message || t.login_failed_err || 'लॉगिन असफल रहा.');
      }
    }
  };

  const handle1TapDemo = () => {
    setPhoneNumber('9876543210');
    handleSendOtpOrLogin('9876543210');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={topInset}
    >
      <View style={styles.container}>
        {/* Top Header Bar from Stitch (safe-area aware, collision proof) */}
        <ScreenHeader
          left={
            <HeaderIconButton
              onPress={() => setCurrentScreen('LANGUAGE_SELECTION')}
              accessibilityLabel={t.select_language}
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
            <HeaderIconButton
              onPress={nextLanguage}
              style={styles.langToggleBtn}
              accessibilityLabel={t.select_language}
            >
              <Text style={styles.langToggleText}>अ/A</Text>
            </HeaderIconButton>
          }
        />

        {/* Scrollable Center Body */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gutter }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Circular Eco Icon Hero */}
          <View style={styles.heroIconBox}>
            <Text style={styles.heroIconText}>♻️</Text>
          </View>

          {/* Welcome Titles */}
          <Text style={[styles.welcomeHeadline, { fontSize: font(28) }]}>{t.login_welcome}</Text>
          <Text style={styles.welcomeSubtitle}>{t.login_subtitle}</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Mobile Input Group Card */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>📱 {t.mobile_label}</Text>

            <View style={[styles.phoneInputContainer, { minHeight: scale(56) }]}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagIcon}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.phoneTextInput, { fontSize: font(20) }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="98765 43210"
                placeholderTextColor="rgba(113, 121, 112, 0.4)"
              />
            </View>

            <View style={styles.otpHintRow}>
              <Text style={styles.smsIcon}>💬</Text>
              <Text style={styles.otpHintText}>{t.otp_info}</Text>
            </View>
          </View>

          {/* Primary Action Button: Send OTP */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ctaPrimaryBtn, { minHeight: scale(54) }]}
            disabled={isLoading}
            onPress={() => handleSendOtpOrLogin()}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={[styles.ctaPrimaryText, { fontSize: font(18) }]}>{t.btn_send_otp}</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider: OR */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerBadge}>
              <Text style={styles.dividerText}>{t.or_text}</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>

          {/* 1-Tap Demo Login Card from Stitch */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.demoCard}
            onPress={handle1TapDemo}
          >
            <View style={styles.demoIconWrapper}>
              <Text style={styles.badgeIcon}>🪪</Text>
            </View>

            <View style={styles.demoCardContent}>
              <View style={styles.demoBadgePill}>
                <Text style={styles.demoBadgeText}>{t.one_tap_demo}</Text>
              </View>
              <Text style={styles.demoCardTitle}>{t.view_with_demo}</Text>
              <Text style={styles.demoCardSub}>{t.demo_user_name}</Text>
            </View>

            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer Area: Trust Guarantee & Accreditation */}
        <View style={[styles.footerArea, { paddingHorizontal: gutter, paddingBottom: 20 + bottomInset }]}>
          <View style={styles.trustBadgeRow}>
            <Text style={styles.trustShieldIcon}>🛡️</Text>
            <Text style={styles.trustBadgeText}>{t.security_guarantee}</Text>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>{t.no_account}</Text>
            <TouchableOpacity onPress={() => handle1TapDemo()}>
              <Text style={styles.registerLinkText}> {t.create_new_account}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.accreditationText}>{t.govt_accreditation}</Text>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },
  // Header styles are shared through components/Layout.js
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
  // Replaces the previous ♻️ glyph at the same footprint (18px) so the brand row
  // keeps its exact horizontal rhythm.
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
  langToggleBtn: {
    width: 44,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surfaceContainer
  },
  langToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 20
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16
  },
  heroIconText: {
    fontSize: 32
  },
  welcomeHeadline: {
    fontWeight: '800',
    color: THEME.colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: THEME.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.danger,
    lineHeight: 18
  },
  inputSection: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface,
    marginBottom: 8
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  countryCodeBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border
  },
  flagIcon: {
    fontSize: 18,
    marginRight: 4
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  phoneTextInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: 0,
    fontWeight: '700',
    color: THEME.colors.onSurface,
    letterSpacing: 1
  },
  otpHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4
  },
  smsIcon: {
    fontSize: 13,
    marginRight: 6
  },
  otpHintText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  ctaPrimaryBtn: {
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
  ctaPrimaryText: {
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.outlineVariant
  },
  dividerBadge: {
    backgroundColor: THEME.colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 9999,
    marginHorizontal: 12
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.secondaryContainer,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  demoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  badgeIcon: {
    fontSize: 24
  },
  demoCardContent: {
    flex: 1
  },
  demoBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  demoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  demoCardSub: {
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  chevronIcon: {
    fontSize: 24,
    color: THEME.colors.outline,
    marginLeft: 8
  },
  footerArea: {
    paddingTop: 8,
    alignItems: 'center'
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    backgroundColor: THEME.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainer,
    marginBottom: 10
  },
  trustShieldIcon: {
    fontSize: 14,
    marginRight: 6
  },
  trustBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  noAccountText: {
    fontSize: 13,
    color: THEME.colors.onSurfaceVariant
  },
  registerLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primaryLight
  },
  accreditationText: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    textAlign: 'center'
  },
  homeIndicator: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(64, 73, 65, 0.25)',
    borderRadius: 2,
    marginTop: 12
  }
});