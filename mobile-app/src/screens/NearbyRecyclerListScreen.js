import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, MATERIAL_CATEGORIES } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { formatRupees, formatWeight, formatDistance } from '../utils/format';

// Screen 08 searches inside the radius the backend validator accepts (0.1-500 km).
const SEARCH_RADIUS_KM = 50;

// Stitch "पास के Recycler" filter chips. `BEST` is a client-side ordering: the
// backend returns matchScore order, which is not a price order.
const FILTERS = [
  { id: 'ALL', labelKey: 'nr_filter_all', icon: '' },
  { id: 'NEAREST', labelKey: 'nr_filter_nearest', icon: '📍' },
  { id: 'BEST', labelKey: 'nr_filter_best', icon: '💰' },
  { id: 'PICKUP', labelKey: 'nr_filter_pickup', icon: '🚚' },
  { id: 'GOVT', labelKey: 'nr_filter_govt', icon: '✅' }
];

/** Backend material enum -> the translated label used in the pill list. */
const categoryName = (id, t) => {
  const found = MATERIAL_CATEGORIES.find((item) => item.id === id);
  return found ? t[found.labelKey] || id : id;
};

/** This recycler's own rate for the lot's category, or null when not quoted. */
const rateFor = (recycler, category) => {
  const rows = Array.isArray(recycler.offeredRates) ? recycler.offeredRates : [];
  const found = rows.find((row) => row.materialCategory === category && Number(row.ratePerUnit) > 0);
  return found ? Number(found.ratePerUnit) : null;
};

/** Ribbon text: the top match carries the highlighted "Authorized Partner" pill. */
const badgeKeyFor = (recycler, isTop) => {
  if (isTop) return 'nr_badge_partner';
  if (recycler.authorizationStatus === 'VERIFIED') return 'nr_badge_verified';
  return 'nr_badge_certified';
};

export const NearbyRecyclerListScreen = () => {
  const { t, setCurrentScreen, createdLot, lotDraft, setSelectedRecycler } = useApp();
  const { gutter, font, scale, bottomInset } = useResponsive();

  const [recyclers, setRecyclers] = useState([]);
  const [listState, setListState] = useState('loading'); // loading | ready | empty | error
  const [filter, setFilter] = useState('ALL');

  const navSpace = useBottomBarSpace(scale(64));
  const lot = createdLot;

  useEffect(() => {
    if (!createdLot) {
      setCurrentScreen(lotDraft?.category ? 'PRICE_ESTIMATE' : 'MATERIAL_SELECTION');
    }
  }, [createdLot, lotDraft?.category, setCurrentScreen]);

  const loadRecyclers = useCallback(async () => {
    if (!lot?.category) return;
    setListState('loading');

    // Lot coordinates first (they are what the collector confirmed), the draft
    // location as the fallback for a lot created before the fix-up step.
    const coords = lot.collectionCoordinates?.coordinates || [];
    const lng = Number(coords[0]) || Number(lotDraft?.longitude) || 0;
    const lat = Number(coords[1]) || Number(lotDraft?.latitude) || 0;

    const res = await ApiService.getNearbyRecyclers(lat, lng, lot.category, SEARCH_RADIUS_KM);

    if (res?.isOffline) {
      setRecyclers([]);
      setListState('error');
      return;
    }

    const rows = res?.success && Array.isArray(res.data) ? res.data : [];
    setRecyclers(rows);
    setListState(rows.length > 0 ? 'ready' : 'empty');
  }, [lot?.category, lot?.collectionCoordinates, lotDraft?.latitude, lotDraft?.longitude]);

  useEffect(() => {
    loadRecyclers();
  }, [loadRecyclers]);

  // Filtering / ordering all happen on the backend payload — no rate is invented
  // on the client. `PICKUP` and `GOVT` filter, `NEAREST` and `BEST` re-order.
  const visible = useMemo(() => {
    const withRate = recyclers.map((recycler) => ({
      ...recycler,
      lotRate: rateFor(recycler, lot?.category)
    }));

    let rows = withRate;

    if (filter === 'PICKUP') {
      rows = rows.filter((recycler) => recycler.pickupAvailable === true);
    } else if (filter === 'GOVT') {
      rows = rows.filter(
        (recycler) => recycler.authorizationStatus === 'VERIFIED' || recycler.isVerified === true
      );
    }

    if (filter === 'NEAREST') {
      return [...rows].sort(
        (a, b) =>
          (Number.isFinite(a.distanceKm) ? a.distanceKm : Number.MAX_SAFE_INTEGER) -
          (Number.isFinite(b.distanceKm) ? b.distanceKm : Number.MAX_SAFE_INTEGER)
      );
    }

    if (filter === 'BEST') {
      return [...rows].sort((a, b) => (b.lotRate ?? -1) - (a.lotRate ?? -1));
    }

    return rows;
  }, [recyclers, filter, lot?.category]);

  if (!lot) {
    return <View style={styles.container} />;
  }

  const weightText = formatWeight(lot.approxWeight, lot.weightUnit);
  const marketRate = Number(lot.pricePerUnit) || 0;
  const city = lot.collectionLocation?.city || lotDraft?.city || '';
  const stateName = lot.collectionLocation?.state || lotDraft?.state || '';

  const handleBack = () => setCurrentScreen('PRICE_ESTIMATE');
  const handleChangeLocation = () => setCurrentScreen('MATERIAL_DETAILS');
  const handleFieldOfficer = () => Alert.alert(t.nr_field_officer, t.nr_call_officer);

  /** Both card actions land on Screen 09; `intent` decides the primary CTA there. */
  const openRecycler = (recycler, intent) => {
    setSelectedRecycler({ ...recycler, intent });
    setCurrentScreen('LOT_DETAILS');
  };

  /** One recycler card: ribbon, name, accepted materials, rate bento, actions. */
  const renderCard = (item) => {
    const isTop = recyclers.length > 0 && item._id === recyclers[0]._id;
    const accepted = Array.isArray(item.materialsAccepted) ? item.materialsAccepted.slice(0, 3) : [];
    const rate = item.lotRate;
    const total = rate != null ? rate * Number(lot.approxWeight || 0) : null;
    const delta = rate != null && marketRate > 0 ? rate - marketRate : 0;
    const distance = formatDistance(item.distanceKm);
    const ribbon = t[badgeKeyFor(item, isTop)] || t.nr_badge_verified;

    return (
      <View
        key={item._id || item.recyclerId}
        style={[styles.card, isTop && styles.cardHighlight]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.ribbon, isTop ? styles.ribbonStrong : styles.ribbonMuted]}>
            <Text style={styles.ribbonIcon}>✅</Text>
            <Text style={styles.ribbonText} numberOfLines={1}>
              {ribbon}
            </Text>
          </View>
          {distance ? (
            <Text style={styles.cardDistance} numberOfLines={1}>
              📍 {distance}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.cardName, { fontSize: font(17) }]} numberOfLines={2}>
          {item.facilityName}
        </Text>
        <Text style={styles.cardSub} numberOfLines={2}>
          {item.authorizationType || t.nr_recognized}
        </Text>

        {accepted.length > 0 ? (
          <View style={styles.acceptedRow}>
            <Text style={styles.acceptedLabel}>{t.nr_accepted_label}</Text>
            {accepted.map((material, index) => (
              <View key={material} style={styles.acceptedGroup}>
                {index > 0 ? <Text style={styles.acceptedDot}>•</Text> : null}
                <View style={styles.acceptedPill}>
                  <Text style={styles.acceptedPillText}>{categoryName(material, t)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Rate bento: this recycler's own rate for the lot category, plus the
            total it would pay for the weight the backend stored on the lot. */}
        <View style={styles.rateGrid}>
          <View style={styles.rateCol}>
            <Text style={styles.rateLabel}>{t.nr_offered_rate}</Text>
            <View style={styles.rateValueRow}>
              <Text style={[styles.rateValue, { fontSize: font(22) }]}>
                {rate != null ? formatRupees(rate) : t.nr_rate_na}
              </Text>
              {rate != null ? <Text style={styles.rateUnit}>/ KG {t.nr_up_to}</Text> : null}
            </View>
            {delta > 0 ? (
              <View style={styles.deltaPill}>
                <Text style={styles.deltaText}>↑ {formatRupees(delta)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rateColRight}>
            <Text style={styles.rateLabel}>{t.nr_est_earnings}</Text>
            <Text style={[styles.totalValue, { fontSize: font(18) }]} numberOfLines={1}>
              {total != null ? formatRupees(total) : '—'}
            </Text>
            <Text style={styles.totalSub} numberOfLines={1}>
              {weightText} {t.nr_for_weight}
            </Text>
          </View>
        </View>

        <View style={styles.logisticsStrip}>
          <Text style={styles.logisticsIcon}>🚚</Text>
          <Text style={styles.logisticsText} numberOfLines={2}>
            {item.pickupAvailable ? t.nr_pickup_free : t.nr_pickup_direct}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openRecycler(item, 'DETAILS')}
            accessibilityRole="button"
            accessibilityLabel={t.nr_btn_details}
            style={styles.detailsButton}
          >
            <Text style={styles.detailsText} numberOfLines={1}>
              👁 {t.nr_btn_details}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openRecycler(item, 'QUOTE')}
            accessibilityRole="button"
            accessibilityLabel={t.nr_btn_get_quote}
            style={styles.quoteButton}
          >
            <Text style={styles.quoteText} numberOfLines={1}>
              {t.nr_btn_get_quote}
            </Text>
            <Text style={styles.quoteArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        left={
          <HeaderIconButton onPress={handleBack} size={40} tone="plain" accessibilityLabel={t.mat_back}>
            <Text style={styles.headerBackIcon}>←</Text>
          </HeaderIconButton>
        }
        center={
          <View style={styles.headerCenter}>
            <Text style={[styles.headerAppName, { fontSize: font(17) }]} numberOfLines={1}>
              {t.app_name}
            </Text>
          </View>
        }
        right={
          <HeaderIconButton size={36} style={styles.headerAvatar}>
            <Text style={styles.headerAvatarIcon}>👤</Text>
          </HeaderIconButton>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: navSpace }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Contextual section header (index 0) */}
        <View style={[styles.sectionBlock, { paddingHorizontal: gutter }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: font(22) }]} numberOfLines={1}>
              {t.nr_title}
            </Text>
            {listState === 'ready' ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {visible.length} {t.nr_active_badge}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.buyersRow}>
            <View style={styles.liveDot} />
            <Text style={styles.buyersText} numberOfLines={2}>
              {weightText} • {categoryName(lot.category, t)} — {t.nr_buyers_avail}
            </Text>
          </View>

          <View style={styles.locationStrip}>
            <Text style={styles.locationStripText} numberOfLines={1}>
              📍 {city ? `${city}${stateName ? `, ${stateName}` : ''}` : t.md_location_title}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleChangeLocation}
              accessibilityRole="button"
              accessibilityLabel={t.nr_location_change}
              style={styles.locationChangeButton}
            >
              <Text style={styles.locationChangeText}>{t.nr_location_change}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sticky filter chips (index 1) */}
        <View style={[styles.filterBar, { paddingHorizontal: gutter }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((item) => {
              const isActive = item.id === filter;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setFilter(item.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  {item.icon ? <Text style={styles.chipIcon}>{item.icon}</Text> : null}
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]} numberOfLines={1}>
                    {t[item.labelKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Result list (index 2) */}
        <View style={[styles.listWrap, { paddingHorizontal: gutter }]}>
          {listState === 'loading' ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={THEME.colors.primary} />
            </View>
          ) : null}

          {listState === 'error' ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateIcon}>📡</Text>
              <Text style={styles.stateTitle}>{t.pe_est_unavailable}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={loadRecyclers}
                accessibilityRole="button"
                accessibilityLabel={t.lq_refresh_btn}
                style={styles.stateRetry}
              >
                <Text style={styles.stateRetryText}>↻ {t.lq_refresh_btn}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {listState === 'ready' || listState === 'empty' ? (
            visible.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateIcon}>🔍</Text>
                <Text style={styles.stateTitle}>{t.nr_empty_title}</Text>
                <Text style={styles.stateDesc}>{t.nr_empty_desc}</Text>
              </View>
            ) : (
              visible.map((item) => renderCard(item))
            )
          ) : null}

          {/* Trust assurance strip */}
          <View style={styles.trustStrip}>
            <Text style={styles.trustStripIcon}>🛡️</Text>
            <Text style={styles.trustStripText}>{t.nr_trust_strip}</Text>
          </View>

          {/* Contextual field support */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleFieldOfficer}
            accessibilityRole="button"
            accessibilityLabel={t.nr_field_officer}
            style={styles.officerButton}
          >
            <Text style={styles.officerIcon}>📞</Text>
            <Text style={styles.officerText} numberOfLines={2}>
              {t.nr_field_officer}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Bottom nav mirrors the shared Stitch nav already implemented on
          DashboardScreen. "My Lots" is the active context for this journey;
          Home is the only destination that exists in this phase, so the
          remaining tabs are rendered as plain (non-pressable) labels. */}
      <View
        style={[
          styles.bottomNav,
          {
            minHeight: scale(64),
            paddingTop: scale(8),
            paddingBottom: Math.max(bottomInset, scale(8))
          }
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('DASHBOARD')}
          accessibilityRole="button"
          accessibilityLabel={t.nav_home}
        >
          <Text style={styles.navIcon}>♻️</Text>
          <Text style={styles.navLabel} numberOfLines={1}>
            {t.nav_home}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('MY_LOTS')}
          accessibilityRole="button"
          accessibilityLabel={t.nav_my_lots}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>📦</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]} numberOfLines={1}>
            {t.nav_my_lots}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('EARNINGS')}
          accessibilityRole="button"
          accessibilityLabel={t.nav_earnings}
        >
          <Text style={styles.navIcon}>💳</Text>
          <Text style={styles.navLabel} numberOfLines={1}>
            {t.nav_earnings}
          </Text>
        </TouchableOpacity>

        <View style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel} numberOfLines={1}>
            {t.nav_profile}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },

  // Header ---------------------------------------------------------------
  headerBackIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: THEME.colors.primary
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0
  },
  headerAppName: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  headerAvatar: {
    backgroundColor: THEME.colors.primaryContainer,
    borderWidth: 2,
    borderColor: THEME.colors.border
  },
  headerAvatarIcon: {
    fontSize: 16
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 0
  },

  // Contextual section header -------------------------------------------
  sectionBlock: {
    paddingTop: 16,
    paddingBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'
  },
  title: {
    flexShrink: 1,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  countPill: {
    marginLeft: 8,
    backgroundColor: THEME.colors.secondaryContainer,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007230'
  },
  buyersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: THEME.colors.secondary
  },
  buyersText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant
  },
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    borderRadius: 12
  },
  locationStripText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.onSurface,
    marginRight: 8
  },
  locationChangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  locationChangeText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.secondary
  },

  // Sticky filter chips --------------------------------------------------
  filterBar: {
    paddingVertical: 10,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceContainerHigh
  },
  filterRow: {
    alignItems: 'center',
    paddingRight: 8
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  chipActive: {
    backgroundColor: THEME.colors.primaryContainer,
    borderColor: THEME.colors.primaryContainer
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 5
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  chipTextActive: {
    color: THEME.colors.onPrimary,
    fontWeight: '700'
  },

  // List + states --------------------------------------------------------
  listWrap: {
    paddingTop: 12
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  stateIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: THEME.colors.onSurface
  },
  stateDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 4
  },
  stateRetry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.primary
  },
  stateRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  // Recycler card --------------------------------------------------------
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  cardHighlight: {
    borderWidth: 2,
    borderColor: 'rgba(0, 110, 45, 0.3)'
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceContainerHigh
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full
  },
  ribbonStrong: {
    backgroundColor: 'rgba(124, 249, 148, 0.6)'
  },
  ribbonMuted: {
    backgroundColor: THEME.colors.surfaceContainerHigh
  },
  ribbonIcon: {
    fontSize: 12,
    marginRight: 5
  },
  ribbonText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  cardDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginLeft: 8
  },
  cardName: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  acceptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10
  },
  acceptedLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginRight: 6
  },
  acceptedGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  acceptedDot: {
    fontSize: 10,
    color: THEME.colors.outlineVariant,
    marginHorizontal: 5
  },
  acceptedPill: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  acceptedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  // Rate bento -----------------------------------------------------------
  rateGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    borderRadius: 12
  },
  rateCol: {
    flex: 1,
    minWidth: 0
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant
  },
  rateValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2
  },
  rateValue: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  rateUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginLeft: 4
  },
  deltaPill: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(127, 252, 151, 0.5)'
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007230'
  },
  rateColRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: THEME.colors.surfaceContainerHigh
  },
  totalValue: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.secondary,
    marginTop: 2
  },
  totalSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  logisticsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    borderRadius: 8
  },
  logisticsIcon: {
    fontSize: 15,
    marginRight: 6
  },
  logisticsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurface
  },

  // Card actions ---------------------------------------------------------
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14
  },
  detailsButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.primary
  },
  detailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  quoteButton: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryContainer
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  quoteArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.onPrimary,
    marginLeft: 6
  },
  // Trust + field support ------------------------------------------------
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    borderRadius: 12
  },
  trustStripIcon: {
    fontSize: 18,
    marginRight: 8
  },
  trustStripText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.onSurface
  },
  officerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
    backgroundColor: 'rgba(124, 249, 148, 0.2)'
  },
  officerIcon: {
    fontSize: 16,
    marginRight: 8
  },
  officerText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary
  },

  // Bottom nav (mirrors DashboardScreen) ---------------------------------
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainerHigh,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14
  },
  navItemActive: {
    backgroundColor: THEME.colors.secondaryContainer
  },
  navIcon: {
    fontSize: 20,
    color: THEME.colors.onSurfaceVariant
  },
  navIconActive: {
    color: THEME.colors.primary
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2,
    textAlign: 'center'
  },
  navLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '800'
  }
});
