import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, MATERIAL_CATEGORIES, MATERIAL_GRID_ORDER } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, BottomActionBar, useBottomBarSpace } from '../components/Layout';
import { buildLotDraft } from '../utils/lotDraft';

// Stitch grid order: CRT TV · LCD Panel · PCB · Cable · Battery · Motor ·
// Magnet · Mixed Plastic · Other (the "Other" card spans the full row).
const ORDERED_CATEGORIES = MATERIAL_GRID_ORDER
  .map((id) => MATERIAL_CATEGORIES.find((category) => category.id === id))
  .filter(Boolean);

const CARD_GAP = 14;

const MaterialCard = ({ category, selected, onPress, t, width, wide = false }) => {
  const title = t[category.titleKey] || category.id;
  const sub = t[category.subKey] || '';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${sub}`}
      style={[
        styles.card,
        wide ? styles.cardWide : styles.cardGrid,
        wide ? { width: '100%' } : { width },
        selected ? styles.cardSelected : styles.cardDefault
      ]}
    >
      <View
        style={[
          wide ? styles.iconTileWide : styles.iconTile,
          selected && styles.iconTileSelected
        ]}
      >
        <Text style={wide ? styles.iconWide : styles.icon}>{category.emoji}</Text>
      </View>

      <View style={wide ? styles.wideTextCol : styles.gridTextCol}>
        <Text
          style={[styles.cardTitle, selected && styles.cardTitleSelected]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text
          style={[styles.cardSub, selected && styles.cardSubSelected]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {sub}
        </Text>
      </View>

      {selected ? (
        <View style={wide ? styles.selectionBadgeWide : styles.selectionBadge}>
          <Text style={styles.selectionBadgeText}>✓</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export const MaterialSelectionScreen = () => {
  const { t, user, setCurrentScreen, selectedMaterial, setSelectedMaterial, setLotDraft, resetLotWorkflow } =
    useApp();
  const { width, gutter, font, scale } = useResponsive();

  // Two columns exactly like the Stitch grid; the full row is reserved for "Other".
  const contentWidth = width - gutter * 2;
  const halfCardWidth = Math.floor((contentWidth - CARD_GAP) / 2);

  const bottomBarSpace = useBottomBarSpace(scale(52));
  const selectedCount = selectedMaterial ? 1 : 0;

  // Single selection (Screen 05 → one MaterialLot.category). Tapping the selected
  // card again clears it.
  const handleSelect = (categoryId) => {
    setSelectedMaterial((previous) => (previous === categoryId ? null : categoryId));
  };

  const handleProceed = () => {
    if (!selectedMaterial) {
      Alert.alert(t.mat_title, t.mat_pick_first);
      return;
    }

    // Screen 06 (Material Details: photo + weight + condition) owns the rest of
    // the journey. Every new selection starts from a clean draft so no weight,
    // photo or price leaks over from a previous lot.
    resetLotWorkflow();
    setLotDraft(buildLotDraft(selectedMaterial, user));
    setCurrentScreen('MATERIAL_DETAILS');
  };

  const handleAudioGuide = () => {
    Alert.alert(`🔊 ${t.mat_audio_guide}`, `${t.mat_title} • ${t.mat_subtitle}`);
  };

  const handleSafetyHelp = () => {
    Alert.alert(t.mat_safety_title, t.mat_safety_desc);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Header (safe-area aware) */}
      <ScreenHeader
        left={
          <HeaderIconButton
            onPress={() => setCurrentScreen('DASHBOARD')}
            size={48}
            rounded="rounded"
            accessibilityLabel={t.mat_back}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonIcon}>←</Text>
          </HeaderIconButton>
        }
        center={
          <View style={styles.stepPill}>
            <View style={styles.stepPillDot} />
            <Text style={styles.stepPillText} numberOfLines={1}>
              {t.mat_step}
            </Text>
          </View>
        }
        right={
          <HeaderIconButton
            onPress={handleAudioGuide}
            size={48}
            rounded="rounded"
            accessibilityLabel={t.mat_audio_guide}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonIconPrimary}>🔊</Text>
          </HeaderIconButton>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter, paddingBottom: bottomBarSpace + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title & Guidance Section */}
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { fontSize: font(28) }]} numberOfLines={1}>
            {t.mat_title}
          </Text>
          <View style={styles.selectedCountBadge}>
            <Text style={styles.selectedCountText}>
              {selectedCount} {t.mat_selected_suffix}
            </Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>{t.mat_subtitle}</Text>

        {/* Material Selection Grid (9 backend categories) */}
        <View style={styles.grid}>
          {ORDERED_CATEGORIES.map((category) => {
            const wide = category.id === 'OTHER';
            return (
              <MaterialCard
                key={category.id}
                category={category}
                t={t}
                selected={selectedMaterial === category.id}
                onPress={() => handleSelect(category.id)}
                width={wide ? contentWidth : halfCardWidth}
                wide={wide}
              />
            );
          })}
        </View>

        {/* Safety Alert Card */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyIconBox}>
            <Text style={styles.safetyIcon}>⚠️</Text>
          </View>
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitle}>{t.mat_safety_title}</Text>
            <Text style={styles.safetyDesc}>{t.mat_safety_desc}</Text>
            <TouchableOpacity
              style={styles.safetyLink}
              activeOpacity={0.7}
              onPress={handleSafetyHelp}
            >
              <Text style={styles.safetyLinkText}>{t.mat_safety_link}</Text>
              <Text style={styles.safetyLinkArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA (owns its own gesture-bar inset) */}
      <BottomActionBar>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleProceed}
          accessibilityRole="button"
          accessibilityLabel={t.mat_cta}
          style={[
            styles.ctaButton,
            { minHeight: scale(52) },
            !selectedMaterial && styles.ctaButtonIdle
          ]}
        >
          <Text style={[styles.ctaText, { fontSize: font(16) }]}>{t.mat_cta}</Text>
          <Text style={styles.ctaArrow}>→</Text>
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
  headerButton: {
    backgroundColor: THEME.colors.surfaceContainerLow
  },
  headerButtonIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  headerButtonIconPrimary: {
    fontSize: 20,
    color: THEME.colors.primary
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 249, 148, 0.4)',
    borderWidth: 1,
    borderColor: THEME.colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999
  },
  stepPillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME.colors.secondary,
    marginRight: 6
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 16
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 4
  },
  pageTitle: {
    flexShrink: 1,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.4
  },
  selectedCountBadge: {
    flexShrink: 0,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  pageSubtitle: {
    fontSize: 15,
    color: THEME.colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 16
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 20
  },
  card: {
    borderRadius: 18,
    position: 'relative'
  },
  cardDefault: {
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.border
  },
  cardSelected: {
    backgroundColor: 'rgba(124, 249, 148, 0.2)',
    borderWidth: 2,
    borderColor: THEME.colors.primaryContainer,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  cardGrid: {
    minHeight: 148,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  cardWide: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  iconTileWide: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  iconTileSelected: {
    backgroundColor: 'rgba(124, 249, 148, 0.5)'
  },
  icon: {
    fontSize: 28
  },
  iconWide: {
    fontSize: 24
  },
  gridTextCol: {
    alignItems: 'center'
  },
  wideTextCol: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.onSurface,
    textAlign: 'center'
  },
  cardTitleSelected: {
    color: THEME.colors.primaryContainer,
    fontWeight: '800'
  },
  cardSub: {
    fontSize: 13,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center'
  },
  cardSubSelected: {
    color: THEME.colors.secondary,
    fontWeight: '600'
  },
  selectionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionBadgeWide: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectionBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 18,
    padding: 14,
    marginBottom: 8
  },
  safetyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2
  },
  safetyIcon: {
    fontSize: 18
  },
  safetyTextCol: {
    flex: 1,
    minWidth: 0
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    lineHeight: 18
  },
  safetyDesc: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
    lineHeight: 16
  },
  safetyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  safetyLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350f',
    textDecorationLine: 'underline',
    marginRight: 4
  },
  safetyLinkArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350f'
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
  ctaButtonIdle: {
    opacity: 0.8
  },
  ctaText: {
    fontWeight: '800',
    color: '#ffffff',
    marginRight: 8
  },
  ctaArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  }
});