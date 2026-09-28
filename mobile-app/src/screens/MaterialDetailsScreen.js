import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { THEME, CONDITIONS } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, BottomActionBar, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { categoryLabels, parseWeight, weightInputValue, FALLBACK_LOCATION } from '../utils/lotDraft';

// Stitch "कबाड़ की जानकारी" (Screen 06) weight shortcuts.
const WEIGHT_SHORTCUTS = [1, 5, 10, 25, 50];

// Material Symbols -> emoji, matching the icon language already used by
// Screen 05 (no icon-font dependency is installed in this project).
const CONDITION_EMOJI = {
  GOOD: '✅',
  USED: '🕓',
  DAMAGED: '💔',
  MIXED: '🗂️'
};

/**
 * expo-image-picker returns a `file://` uri. Multer validates the declared mime
 * type and stores the extension, so both must agree with the real file.
 */
const imageUploadMeta = (uri) => {
  const ext = String(uri).split('.').pop().toLowerCase();
  if (ext === 'png') return { name: 'lot-photo.png', type: 'image/png' };
  if (ext === 'webp') return { name: 'lot-photo.webp', type: 'image/webp' };
  return { name: 'lot-photo.jpg', type: 'image/jpeg' };
};

export const MaterialDetailsScreen = () => {
  const {
    t,
    setCurrentScreen,
    selectedMaterial,
    setSelectedMaterial,
    lotDraft,
    setLotDraft,
    setCreatedLot,
    setPriceEstimate,
    setDeviceLocation
  } = useApp();
  const { gutter, font, scale, width } = useResponsive();

  const [weightText, setWeightText] = useState(() => weightInputValue(lotDraft?.approxWeight));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const bottomBarSpace = useBottomBarSpace(scale(56));
  const draft = lotDraft;

  // Screen 06 is only reachable through Screen 05. Deep-entry or a stale state
  // (hot reload) must never post a lot without a chosen material.
  useEffect(() => {
    if (!draft?.category) {
      setCurrentScreen('MATERIAL_SELECTION');
    }
  }, [draft?.category, setCurrentScreen]);

  // Keep the visible weight in sync when the draft is rebuilt (chip reset).
  useEffect(() => {
    setWeightText(weightInputValue(draft?.approxWeight));
  }, [draft?.approxWeight]);

  if (!draft?.category) {
    return <View style={styles.container} />;
  }

  const labels = categoryLabels(draft.category, t);
  const halfCardWidth = Math.floor((width - gutter * 2 - 12) / 2);
  const selectedWeight = parseWeight(weightText);
  const patchDraft = (patch) => setLotDraft((previous) => (previous ? { ...previous, ...patch } : previous));

  const handleAudioGuide = () => {
    Alert.alert(
      `🔊 ${t.mat_audio_guide}`,
      `${t.md_photo_section} • ${t.md_weight_section} • ${t.md_condition_section}`
    );
  };

  const handleBack = () => setCurrentScreen('MATERIAL_SELECTION');

  const handleChangeMaterial = () => {
    setSelectedMaterial(draft.category);
    setCurrentScreen('MATERIAL_SELECTION');
  };

  const handlePickWeight = (value) => {
    setWeightText(String(value));
    patchDraft({ approxWeight: value, weightUnit: 'KG' });
  };

  const handleWeightChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setWeightText(cleaned);
    patchDraft({ approxWeight: parseWeight(cleaned), weightUnit: 'KG' });
  };

  const handleTakeCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.md_photo_section, t.md_photo_reminder);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6
      });
      if (!result.canceled && result.assets?.length) {
        patchDraft({ photoUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert(t.md_photo_section, error.message || t.network_err);
    }
  };

  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.md_photo_section, t.md_photo_reminder);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6
      });
      if (!result.canceled && result.assets?.length) {
        patchDraft({ photoUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert(t.md_photo_section, error.message || t.network_err);
    }
  };

  // Screen 08 needs real coordinates for the backend 2dsphere nearby search,
  // so the location card doubles as a "refresh my area" affordance.
  const handleUseLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.md_location_title, t.md_location_denied);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let city = draft.city || FALLBACK_LOCATION.city;
      let state = draft.state || FALLBACK_LOCATION.state;

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        const place = places && places[0];
        if (place) {
          city = place.city || place.subregion || place.district || city;
          state = place.region || state;
        }
      } catch (geocodeError) {
        // Reverse geocoding is best-effort: the coordinates are what matters.
      }

      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city,
        state
      };
      patchDraft(next);
      setDeviceLocation(next);
    } catch (error) {
      Alert.alert(t.md_location_title, t.md_location_denied);
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Writes the lot. This is the single backend touch point of Screens 05-06:
   * `POST /lots` runs multer + createLotValidator + ValuationService, so the
   * price the collector sees on Screen 07 is the backend's own number.
   */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const weight = parseWeight(weightText);
    if (!weight) {
      Alert.alert(t.md_weight_section, t.md_weight_err);
      return;
    }

    const nextDraft = { ...draft, approxWeight: weight, weightUnit: 'KG' };
    setLotDraft(nextDraft);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('category', nextDraft.category);
    formData.append('approxWeight', String(weight));
    formData.append('weightUnit', nextDraft.weightUnit);
    formData.append('condition', nextDraft.condition);
    formData.append('sourceType', nextDraft.sourceType);
    formData.append('city', nextDraft.city || '');
    formData.append('state', nextDraft.state || '');
    formData.append('address', nextDraft.address || '');
    formData.append('latitude', String(nextDraft.latitude));
    formData.append('longitude', String(nextDraft.longitude));
    formData.append('idempotencyKey', nextDraft.idempotencyKey);

    if (nextDraft.photoUri) {
      const meta = imageUploadMeta(nextDraft.photoUri);
      formData.append('images', { uri: nextDraft.photoUri, name: meta.name, type: meta.type });
    }

    try {
      const res = await ApiService.createLotMultipart(formData);
      setIsSubmitting(false);

      if (!res || !res.success || !res.data) {
        Alert.alert(t.pe_title, res?.message || t.pe_est_unavailable);
        return;
      }

      const lot = res.data;
      setCreatedLot(lot);
      setPriceEstimate({
        pricePerUnit: lot.pricePerUnit,
        estimatedValue: lot.estimatedValue,
        estimatedMinValue: lot.estimatedMinValue,
        estimatedMaxValue: lot.estimatedMaxValue,
        weightUnit: lot.weightUnit
      });
      setCurrentScreen('PRICE_ESTIMATE');
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(t.pe_title, error.message || t.network_err);
    }
  };

  // __HANDLERS__

  return (
    <View style={styles.container}>
      <ScreenHeader
        left={
          <HeaderIconButton
            onPress={handleBack}
            size={48}
            rounded="rounded"
            accessibilityLabel={t.mat_back}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonIcon}>←</Text>
          </HeaderIconButton>
        }
        center={
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: font(16) }]} numberOfLines={1}>
              {t.md_title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {t.md_step} • {t.md_selected_scrap}
            </Text>
          </View>
        }
        right={
          <HeaderIconButton
            onPress={handleAudioGuide}
            size={48}
            rounded="rounded"
            accessibilityLabel={t.mat_audio_guide}
            style={styles.headerButtonPrimary}
          >
            <Text style={styles.headerButtonIconPrimary}>🔊</Text>
          </HeaderIconButton>
        }
      />

      {/* Step 2 of 3 indicator (Stitch draws this as a 66% segmented bar) */}
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter, paddingBottom: bottomBarSpace + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected material summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconTile}>
            <Text style={styles.summaryIcon}>{labels.emoji}</Text>
          </View>
          <View style={styles.summaryTextCol}>
            <Text style={styles.summaryLabel}>{t.md_selected_scrap}</Text>
            <Text style={[styles.summaryTitle, { fontSize: font(18) }]} numberOfLines={1}>
              {labels.title} • {labels.sub}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeButton}
            activeOpacity={0.85}
            onPress={handleChangeMaterial}
            accessibilityRole="button"
            accessibilityLabel={t.md_change_btn}
          >
            <Text style={styles.changeButtonText}>{t.md_change_btn}</Text>
            <Text style={styles.changeButtonIcon}>⇄</Text>
          </TouchableOpacity>
        </View>

        {/* Photo capture */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionIcon}>📷</Text>
            <Text style={[styles.sectionTitle, { fontSize: font(18) }]} numberOfLines={1}>
              {t.md_photo_section}
            </Text>
            <View style={styles.requiredPill}>
              <Text style={styles.requiredPillText}>{t.md_photo_required}</Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>{t.md_photo_desc}</Text>

          <View style={styles.photoCard}>
            <View style={styles.photoFrame}>
              {draft.photoUri ? (
                <Image source={{ uri: draft.photoUri }} style={styles.photoImage} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>🖼️</Text>
                  <Text style={styles.photoPlaceholderText} numberOfLines={3}>
                    {t.md_photo_desc}
                  </Text>
                </View>
              )}

              {draft.photoUri ? (
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeIcon}>✅</Text>
                  <Text style={styles.photoBadgeText}>{t.md_photo_attached}</Text>
                </View>
              ) : null}

              {draft.photoUri ? (
                <TouchableOpacity
                  style={styles.retakeButton}
                  activeOpacity={0.85}
                  onPress={handleTakeCamera}
                  accessibilityRole="button"
                  accessibilityLabel={t.md_retake_btn}
                >
                  <Text style={styles.retakeIcon}>↻</Text>
                  <Text style={styles.retakeText}>{t.md_retake_btn}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[styles.photoActionOutline, { width: halfCardWidth }]}
                activeOpacity={0.85}
                onPress={handleTakeCamera}
                accessibilityRole="button"
                accessibilityLabel={t.md_take_camera}
              >
                <Text style={styles.photoActionIcon}>📷</Text>
                <Text style={styles.photoActionOutlineText} numberOfLines={1}>
                  {t.md_take_camera}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionSurface, { width: halfCardWidth }]}
                activeOpacity={0.85}
                onPress={handlePickGallery}
                accessibilityRole="button"
                accessibilityLabel={t.md_pick_gallery}
              >
                <Text style={styles.photoActionIcon}>🖼️</Text>
                <Text style={styles.photoActionSurfaceText} numberOfLines={1}>
                  {t.md_pick_gallery}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weight */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionIcon}>⚖️</Text>
            <Text style={[styles.sectionTitle, { fontSize: font(18) }]} numberOfLines={1}>
              {t.md_weight_section}
            </Text>
            <Text style={styles.sectionHint}>{t.md_weight_approx}</Text>
          </View>

          <View style={styles.weightCard}>
            <View style={styles.weightLeft}>
              <View style={styles.weightIconTile}>
                <Text style={styles.weightIcon}>⚖️</Text>
              </View>
              <TextInput
                style={[styles.weightInput, { fontSize: font(44) }]}
                value={weightText}
                onChangeText={handleWeightChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={THEME.colors.outlineVariant}
                maxLength={6}
                accessibilityLabel={t.md_weight_section}
              />
            </View>

            <View style={styles.weightRight}>
              <View style={styles.unitPill}>
                <Text style={styles.unitPillText}>{t.md_weight_unit}</Text>
              </View>
              <TouchableOpacity
                style={styles.clearWeightButton}
                activeOpacity={0.85}
                onPress={() => {
                  setWeightText('');
                  patchDraft({ approxWeight: null });
                }}
                accessibilityRole="button"
                accessibilityLabel={t.md_weight_err}
              >
                <Text style={styles.clearWeightIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {WEIGHT_SHORTCUTS.map((value) => {
              const isActive = selectedWeight === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, isActive && styles.chipActive]}
                  activeOpacity={0.85}
                  onPress={() => handlePickWeight(value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${value} KG`}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {value} KG{isActive ? ' ✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionIcon}>✨</Text>
            <Text style={[styles.sectionTitle, { fontSize: font(18) }]} numberOfLines={1}>
              {t.md_condition_section}
            </Text>
          </View>

          <View style={styles.conditionGrid}>
            {CONDITIONS.map((condition) => {
              const isActive = draft.condition === condition.id;
              return (
                <TouchableOpacity
                  key={condition.id}
                  style={[styles.conditionCard, { width: halfCardWidth }, isActive && styles.conditionCardActive]}
                  activeOpacity={0.9}
                  onPress={() => patchDraft({ condition: condition.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${t[condition.labelKey]} ${t[`${condition.labelKey}_sub`] || ''}`}
                >
                  <View style={styles.conditionTopRow}>
                    <Text style={[styles.conditionIcon, isActive && styles.conditionIconActive]}>
                      {CONDITION_EMOJI[condition.id] || '🔄'}
                    </Text>
                    {isActive ? (
                      <View style={styles.conditionCheck}>
                        <Text style={styles.conditionCheckText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.conditionRadio} />
                    )}
                  </View>
                  <View>
                    <Text
                      style={[styles.conditionTitle, isActive && styles.conditionTitleActive]}
                      numberOfLines={1}
                    >
                      {t[condition.labelKey]}
                    </Text>
                    <Text style={[styles.conditionSub, isActive && styles.conditionSubActive]} numberOfLines={1}>
                      {t[`${condition.labelKey}_sub`] || ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Area-level location — never the exact house address */}
        <TouchableOpacity
          style={styles.locationCard}
          activeOpacity={0.9}
          onPress={handleUseLocation}
          accessibilityRole="button"
          accessibilityLabel={t.md_location_title}
        >
          <View style={styles.locationIconTile}>
            {isLocating ? (
              <ActivityIndicator size="small" color={THEME.colors.primaryContainer} />
            ) : (
              <Text style={styles.locationIcon}>📍</Text>
            )}
          </View>
          <View style={styles.locationTextCol}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {draft.city ? `${draft.city}${draft.state ? `, ${draft.state}` : ''}` : t.md_location_title}
            </Text>
            <Text style={styles.locationSub} numberOfLines={2}>
              {t.md_location_sub}
            </Text>
          </View>
          <Text style={styles.locationArrow}>↻</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomActionBar>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t.md_cta}
          style={[styles.ctaButton, { minHeight: scale(54) }, isSubmitting && styles.ctaButtonBusy]}
        >
          {isSubmitting ? (
            <View style={styles.ctaContentRow}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={[styles.ctaText, { fontSize: font(16) }]}>{t.md_saving}</Text>
            </View>
          ) : (
            <View style={styles.ctaContentRow}>
              <Text style={[styles.ctaText, { fontSize: font(16) }]}>{t.md_cta}</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      </BottomActionBar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },

  // Header ---------------------------------------------------------------
  headerButton: {
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  headerButtonIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  headerButtonPrimary: {
    backgroundColor: THEME.colors.primaryContainer
  },
  headerButtonIconPrimary: {
    fontSize: 18
  },
  headerCenter: {
    alignItems: 'center'
  },
  headerTitle: {
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2
  },

  // Step indicator -------------------------------------------------------
  progressTrack: {
    height: 4,
    backgroundColor: THEME.colors.surfaceContainerHighest
  },
  progressFill: {
    height: 4,
    width: '66%',
    backgroundColor: THEME.colors.primary
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 16
  },

  // Selected material summary -------------------------------------------
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  summaryIconTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryIcon: {
    fontSize: 24
  },
  summaryTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: THEME.colors.textMuted
  },
  summaryTitle: {
    fontWeight: '700',
    color: THEME.colors.onSurface,
    marginTop: 2
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryBg,
    borderWidth: 1,
    borderColor: THEME.colors.primaryContainer,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  changeButtonIcon: {
    fontSize: 12,
    color: THEME.colors.primary,
    marginLeft: 4
  },

  // Sections -------------------------------------------------------------
  section: {
    marginTop: 24
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8
  },
  sectionTitle: {
    flex: 1,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: THEME.colors.textMuted,
    marginLeft: 8
  },
  requiredPill: {
    backgroundColor: THEME.colors.secondaryBg,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8
  },
  requiredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e'
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 6
  },
  // Photo -----------------------------------------------------------------
  photoCard: {
    marginTop: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  photoFrame: {
    width: '100%',
    height: 176,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoImage: {
    width: '100%',
    height: '100%'
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  photoPlaceholderText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: THEME.colors.textMuted
  },
  photoBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 83, 45, 0.92)',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  photoBadgeIcon: {
    fontSize: 12,
    marginRight: 4
  },
  photoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  },
  retakeButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  retakeIcon: {
    fontSize: 12,
    color: THEME.colors.primary,
    marginRight: 4
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  photoActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest
  },
  photoActionOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginLeft: 6
  },
  photoActionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surfaceContainer
  },
  photoActionSurfaceText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant,
    marginLeft: 6
  },
  photoActionIcon: {
    fontSize: 15
  },

  // Weight ----------------------------------------------------------------
  weightCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  weightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  weightIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  weightIcon: {
    fontSize: 20
  },
  weightInput: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    padding: 0,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  weightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8
  },
  unitPill: {
    backgroundColor: THEME.colors.primaryBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  clearWeightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  clearWeightIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },
  chipRow: {
    paddingTop: 12,
    paddingRight: 4
  },
  chip: {
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },
  chipTextActive: {
    color: '#ffffff'
  },
  // Condition -------------------------------------------------------------
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12
  },
  conditionCard: {
    height: 96,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    padding: 12,
    justifyContent: 'space-between',
    marginBottom: 12
  },
  conditionCardActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryBg
  },
  conditionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  conditionIcon: {
    fontSize: 22
  },
  // The icon itself is intentionally unchanged when selected; the border,
  // fill and radio marker carry the selected state.
  conditionIconActive: {
    opacity: 1
  },
  conditionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: THEME.colors.outlineVariant
  },
  conditionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  conditionCheckText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff'
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  conditionTitleActive: {
    color: THEME.colors.primary
  },
  conditionSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  conditionSubActive: {
    color: THEME.colors.primaryContainer
  },

  // Location + CTA --------------------------------------------------------
  locationCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  locationIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center'
  },
  locationIcon: {
    fontSize: 18
  },
  locationTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  locationSub: {
    fontSize: 11,
    lineHeight: 16,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  locationArrow: {
    fontSize: 16,
    color: THEME.colors.textMuted,
    marginLeft: 8
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 16
  },
  ctaButtonBusy: {
    opacity: 0.85
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ctaText: {
    fontWeight: '800',
    color: '#ffffff',
    marginHorizontal: 8
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  }
});
