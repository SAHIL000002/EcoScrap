import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, CONDITIONS, API_BASE_URL } from '../constants/theme';
import { useResponsive, clamp } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, BottomActionBar, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { categoryLabels } from '../utils/lotDraft';
import { formatRupees, formatWeight, formatClock, formatShortDate } from '../utils/format';

// Stitch "अनुमानित कीमत" (Screen 07) draws a 4-bar chart inside a "last 7 days"
// card; the backend `GET /prices/history` supplies the rows.
const HISTORY_LIMIT = 7;
const TREND_BARS = 4;

// Market-range bar geometry, taken from the mock (shaded band 15% -> 90%).
const BAND_START_PCT = 15;
const BAND_WIDTH_PCT = 75;

/** Bar height (%) so the highest plotted rate fills the chart axis. */
const barHeight = (price, min, max) => {
  if (!Number.isFinite(price) || !Number.isFinite(min) || !Number.isFinite(max)) return 55;
  if (max <= min) return 95;
  return Math.round(45 + ((price - min) / (max - min)) * 50);
};

const dayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/** Price-row date -> the mock's relative label ("आज" / "कल" / "4 दिन पूर्व"). */
const dayLabel = (value, t) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const days = Math.round((dayStart(new Date()) - dayStart(date)) / 86400000);
  if (days <= 0) return t.pe_today;
  if (days === 1) return t.pe_yesterday;
  if (days === 3) return t.pe_day_3_ago;
  if (days === 4) return t.pe_day_4_ago;
  return formatShortDate(date);
};

/** `/uploads/x.jpg` -> absolute URL; Cloudinary URLs pass through untouched. */
const serverUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

/** The local capture renders even offline, so it wins over the stored URL. */
const lotPhotoUri = (draftUri, images) => {
  if (draftUri) return draftUri;
  const first = Array.isArray(images) ? images[0] : null;
  return serverUrl(first);
};

export const PriceEstimateScreen = () => {
  const { t, setCurrentScreen, createdLot, priceEstimate, lotDraft } = useApp();
  const { gutter, font, scale } = useResponsive();

  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState('loading'); // loading | ready | empty | error
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const bottomBarSpace = useBottomBarSpace(scale(112));
  const lot = createdLot;

  // Screen 07 is only reachable after the backend priced the lot. A stale /
  // deep entry must never show a hard-coded amount, so it falls back to the
  // screen that still owns the draft.
  useEffect(() => {
    if (!createdLot) {
      setCurrentScreen(lotDraft?.category ? 'MATERIAL_DETAILS' : 'MATERIAL_SELECTION');
    }
  }, [createdLot, lotDraft?.category, setCurrentScreen]);

  const loadHistory = useCallback(async () => {
    if (!createdLot?.category) return;
    setHistoryState('loading');

    const res = await ApiService.getPriceHistory(createdLot.category, HISTORY_LIMIT);

    if (res?.isOffline) {
      setHistory([]);
      setHistoryState('error');
      return;
    }

    const rows =
      res?.success && Array.isArray(res.data)
        ? res.data.filter((row) => Number(row?.buyingPrice) > 0)
        : [];

    // Backend returns newest-first; the chart reads oldest -> newest.
    setHistory(rows.slice(0, HISTORY_LIMIT).reverse());
    setHistoryState(rows.length > 0 ? 'ready' : 'empty');
  }, [createdLot?.category]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Every money value below is read back from the backend response — nothing is
  // recomputed or hard-coded on the client.
  const estimate = useMemo(() => {
    const source = priceEstimate || createdLot || {};
    const value = Number(source.estimatedValue);
    const min = Number(source.estimatedMinValue);
    const max = Number(source.estimatedMaxValue);
    const rate = Number(source.pricePerUnit);

    return {
      value: Number.isFinite(value) ? value : 0,
      min: Number.isFinite(min) ? min : Number.isFinite(value) ? value : 0,
      max: Number.isFinite(max) ? max : Number.isFinite(value) ? value : 0,
      rate: Number.isFinite(rate) ? rate : 0,
      unit: source.weightUnit || createdLot?.weightUnit || 'KG'
    };
  }, [priceEstimate, createdLot]);

  const trend = useMemo(() => {
    const rows = history.slice(-TREND_BARS);
    const prices = rows.map((row) => Number(row.buyingPrice));
    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const latest = prices[prices.length - 1];
    const previous = prices.length > 1 ? prices[prices.length - 2] : null;
    const changePct = previous ? ((latest - previous) / previous) * 100 : 0;

    return { rows, prices, min, max, changePct, isUp: changePct >= 0 };
  }, [history]);

  if (!lot) {
    return <View style={styles.container} />;
  }

  const labels = categoryLabels(lot.category, t);
  const condition = CONDITIONS.find((item) => item.id === lot.condition);
  const conditionText = condition ? t[condition.labelKey] || lot.condition : lot.condition || '';
  const city = lot.collectionLocation?.city || lotDraft?.city || '';
  const stateName = lot.collectionLocation?.state || lotDraft?.state || '';
  const photoUri = lotPhotoUri(lotDraft?.photoUri, lot.images);
  const weightText = formatWeight(lot.approxWeight, estimate.unit);

  // Pin position = where the backend's estimate sits inside its own min/max band.
  const pinRatio =
    estimate.max > estimate.min
      ? clamp((estimate.value - estimate.min) / (estimate.max - estimate.min), 0, 1)
      : 0.5;
  const pinLeftPct = Math.round(BAND_START_PCT + pinRatio * BAND_WIDTH_PCT);

  const handleBack = () => setCurrentScreen('MATERIAL_DETAILS');
  const handleEditDetails = () => setCurrentScreen('MATERIAL_DETAILS');
  const handleFindRecyclers = () => setCurrentScreen('NEARBY_RECYCLERS');

  const handleSaveDraft = async () => {
    if (isSavingDraft) return;
    setIsSavingDraft(true);

    // Same lot, same id: the draft flag is persisted, never a second lot.
    const res = await ApiService.updateLot(lot.lotId || lot._id, { status: 'DRAFT' });

    setIsSavingDraft(false);
    Alert.alert(t.pe_title, res?.success ? t.pe_draft_saved : res?.message || t.network_err);
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
            <View style={styles.headerTitleRow}>
              <Text style={[styles.headerTitle, { fontSize: font(18) }]} numberOfLines={1}>
                {t.pe_title}
              </Text>
              <View style={styles.headerStepPill}>
                <Text style={styles.headerStepPillText}>{t.pe_step}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {t.pe_subtitle}
            </Text>
          </View>
        }
        right={
          <View style={styles.stepper}>
            <View style={[styles.stepperDot, styles.stepperDotDone]} />
            <View style={[styles.stepperDot, styles.stepperDotDone]} />
            <View style={[styles.stepperWide, styles.stepperWideActive]} />
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter, paddingBottom: bottomBarSpace }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Material summary mini card (Stitch: photo + category + weight + condition) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryThumb}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.summaryThumbImage} resizeMode="cover" />
              ) : (
                <Text style={styles.summaryThumbEmoji}>{labels.emoji}</Text>
              )}
            </View>
            <View style={styles.summaryTextCol}>
              <View style={styles.summaryTitleRow}>
                <Text style={styles.summaryTitleIcon}>{labels.emoji}</Text>
                <Text style={[styles.summaryTitle, { fontSize: font(15) }]} numberOfLines={1}>
                  {labels.title}
                </Text>
              </View>
              <View style={styles.summaryMetaRow}>
                <Text style={[styles.summaryMetaStrong, { fontSize: font(13) }]}>{weightText}</Text>
                <Text style={styles.summaryMetaDot}>•</Text>
                <Text style={styles.summaryMeta} numberOfLines={1}>
                  {t.pe_condition_label}:{' '}
                  <Text style={styles.summaryMetaValue}>{conditionText}</Text>
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEditDetails}
            accessibilityRole="button"
            accessibilityLabel={t.pe_edit_details}
            style={styles.editButton}
          >
            <Text style={styles.editButtonIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
        {/* Hero: total estimated value + market range (all values from the backend) */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroValueCol}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabelIcon}>💰</Text>
                <Text style={styles.heroLabel}>{t.pe_hero_title}</Text>
              </View>
              <View style={styles.heroValueRow}>
                <Text style={[styles.heroValue, { fontSize: font(34) }]} numberOfLines={1}>
                  {formatRupees(estimate.value)}
                </Text>
                <Text style={styles.heroApprox}>{t.pe_approx_label}</Text>
              </View>
            </View>

            <View style={styles.formulaPill}>
              <Text style={styles.formulaLabel}>{t.pe_formula_label}</Text>
              <Text style={styles.formulaValue} numberOfLines={2}>
                {weightText} × {formatRupees(estimate.rate)}
                {` / ${estimate.unit}`}
              </Text>
            </View>
          </View>

          <View style={styles.rangeBlock}>
            <View style={styles.rangeHeadRow}>
              <Text style={styles.rangeTitle}>{t.pe_range_title}</Text>
              <Text style={styles.rangeValue}>
                {formatRupees(estimate.min)} — {formatRupees(estimate.max)}
              </Text>
            </View>

            <View style={styles.rangeTrack}>
              <View
                style={[
                  styles.rangeBand,
                  { left: `${BAND_START_PCT}%`, width: `${BAND_WIDTH_PCT}%` }
                ]}
              />
              <View style={[styles.rangePin, { left: `${pinLeftPct}%` }]} />
            </View>

            <View style={styles.rangeLegendRow}>
              <Text style={styles.rangeLegend}>
                {t.pe_range_low} ({formatRupees(estimate.min)})
              </Text>
              <Text style={[styles.rangeLegend, styles.rangeLegendMid]}>
                {t.pe_range_mid} ({formatRupees(estimate.value)})
              </Text>
              <Text style={styles.rangeLegend}>
                {t.pe_range_high} ({formatRupees(estimate.max)})
              </Text>
            </View>
          </View>

          <View style={styles.mandiRow}>
            <Text style={styles.mandiText} numberOfLines={1}>
              📍 {city ? `${city}${stateName ? `, ${stateName}` : ''}` : t.pe_mandi_update}
            </Text>
            <Text style={styles.mandiTime} numberOfLines={1}>
              🕘 {t.pe_today} {formatClock(lot.updatedAt || lot.createdAt)}
            </Text>
          </View>
        </View>
        {/* Last-7-days mandi trend (chart data = GET /prices/history) */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeadRow}>
            <View style={styles.trendHeadCol}>
              <Text style={styles.trendTitle} numberOfLines={1}>
                {t.pe_trend_title}
              </Text>
              <Text style={styles.trendSub} numberOfLines={1}>
                {labels.title} • {t.pe_trend_sub}
              </Text>
            </View>

            {trend ? (
              <View style={styles.trendBadge}>
                <Text style={styles.trendBadgeText}>
                  {trend.isUp ? '↑' : '↓'} {Math.abs(trend.changePct).toFixed(1)}%
                </Text>
              </View>
            ) : null}
          </View>

          {historyState === 'loading' ? (
            <View style={styles.trendStateBox}>
              <ActivityIndicator color={THEME.colors.primary} />
            </View>
          ) : null}

          {historyState === 'error' ? (
            <View style={styles.trendStateBox}>
              <Text style={styles.trendStateText}>{t.pe_est_unavailable}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={loadHistory}
                accessibilityRole="button"
                accessibilityLabel={t.lq_refresh_btn}
                style={styles.trendRetry}
              >
                <Text style={styles.trendRetryText}>↻ {t.lq_refresh_btn}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {historyState === 'empty' ? (
            <View style={styles.trendStateBox}>
              <Text style={styles.trendStateText}>{t.pe_no_trend}</Text>
            </View>
          ) : null}

          {historyState === 'ready' && trend ? (
            <View style={styles.chartBox}>
              <View style={styles.chartRow}>
                {trend.rows.map((row, index) => {
                  const price = trend.prices[index];
                  const isLatest = index === trend.rows.length - 1;
                  return (
                    <View key={`${row._id || row.validFrom || index}`} style={styles.chartCol}>
                      <Text style={[styles.chartValue, isLatest && styles.chartValueLatest]}>
                        {formatRupees(price)}
                      </Text>
                      <View style={styles.chartBarTrack}>
                        <View
                          style={[
                            styles.chartBar,
                            { height: `${barHeight(price, trend.min, trend.max)}%` },
                            isLatest && styles.chartBarLatest
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartDay, isLatest && styles.chartDayLatest]} numberOfLines={1}>
                        {dayLabel(row.validFrom || row.createdAt, t)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.chartFooter}>
                <Text style={styles.chartFooterText}>
                  {t.pe_trend_min}: {formatRupees(trend.min)}/{estimate.unit}
                </Text>
                <Text style={[styles.chartFooterText, styles.chartFooterMax]}>
                  {t.pe_trend_max}: {formatRupees(trend.max)}/{estimate.unit}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Trust & transparency */}
        <View style={styles.trustCard}>
          <View style={styles.trustIconTile}>
            <Text style={styles.trustIcon}>ⓘ</Text>
          </View>
          <View style={styles.trustTextCol}>
            <Text style={styles.trustTitle}>{t.pe_trust_title}</Text>
            <Text style={styles.trustDesc}>{t.pe_trust_desc}</Text>
          </View>
        </View>

        {/* Collector guarantee badges */}
        <View style={styles.badgeGrid}>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>✅</Text>
            <Text style={styles.badgeText} numberOfLines={2}>
              {t.pe_badge_verified}
            </Text>
          </View>
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>₹</Text>
            <Text style={styles.badgeText} numberOfLines={2}>
              {t.pe_badge_payment}
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleFindRecyclers}
          accessibilityRole="button"
          accessibilityLabel={t.pe_cta_find}
          style={[styles.ctaButton, { minHeight: scale(52) }]}
        >
          <Text style={[styles.ctaText, { fontSize: font(16) }]}>{t.pe_cta_find}</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSaveDraft}
          disabled={isSavingDraft}
          accessibilityRole="button"
          accessibilityLabel={t.pe_cta_draft}
          style={styles.draftButton}
        >
          <Text style={styles.draftIcon}>🔖</Text>
          <Text style={styles.draftText}>{t.pe_cta_draft}</Text>
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
  headerBackIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: THEME.colors.onSurface
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%'
  },
  headerTitle: {
    flexShrink: 1,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  headerStepPill: {
    marginLeft: 6,
    backgroundColor: THEME.colors.secondaryContainer,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  headerStepPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007230'
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    backgroundColor: THEME.colors.surfaceContainerHighest
  },
  stepperDotDone: {
    backgroundColor: THEME.colors.secondary
  },
  stepperWide: {
    width: 16,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    backgroundColor: THEME.colors.surfaceContainerHighest
  },
  stepperWideActive: {
    backgroundColor: THEME.colors.primaryContainer
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 12
  },

  // Material summary -----------------------------------------------------
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  summaryThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryThumbImage: {
    width: '100%',
    height: '100%'
  },
  summaryThumbEmoji: {
    fontSize: 26
  },
  summaryTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  summaryTitleIcon: {
    fontSize: 15,
    marginRight: 5
  },
  summaryTitle: {
    flexShrink: 1,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  summaryMetaStrong: {
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  summaryMetaDot: {
    color: THEME.colors.outlineVariant,
    marginHorizontal: 6
  },
  summaryMeta: {
    flexShrink: 1,
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant
  },
  summaryMetaValue: {
    fontWeight: '600',
    color: THEME.colors.onSurface
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editButtonIcon: {
    fontSize: 16
  },
  // Hero estimate card ---------------------------------------------------
  heroCard: {
    marginTop: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    overflow: 'hidden'
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  heroValueCol: {
    flex: 1,
    minWidth: 0
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  heroLabelIcon: {
    fontSize: 14,
    marginRight: 5
  },
  heroLabel: {
    fontSize: 13,
    color: THEME.colors.onSurfaceVariant
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  heroValue: {
    fontWeight: '800',
    letterSpacing: -0.5,
    color: THEME.colors.primaryContainer
  },
  heroApprox: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.secondary,
    marginLeft: 4
  },
  formulaPill: {
    maxWidth: '48%',
    marginLeft: 8,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted
  },
  formulaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 1
  },
  rangeBlock: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainerHigh
  },
  rangeHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  rangeTitle: {
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant
  },
  rangeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  rangeTrack: {
    height: 14,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer
  },
  rangeBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.secondaryContainer,
    opacity: 0.6
  },
  rangePin: {
    position: 'absolute',
    top: -1,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: THEME.colors.primaryContainer,
    borderWidth: 2,
    borderColor: THEME.colors.surfaceContainerLowest
  },
  rangeLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  rangeLegend: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '500',
    color: THEME.colors.textMuted
  },
  rangeLegendMid: {
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  mandiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainerHigh
  },
  mandiText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurface,
    marginRight: 8
  },
  mandiTime: {
    fontSize: 10,
    color: THEME.colors.textMuted
  },

  // Trend card -----------------------------------------------------------
  trendCard: {
    marginTop: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh
  },
  trendHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  trendHeadCol: {
    flex: 1,
    minWidth: 0
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  trendSub: {
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  trendBadge: {
    marginLeft: 8,
    backgroundColor: THEME.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: THEME.colors.secondary,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007230'
  },
  trendStateBox: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  trendStateText: {
    fontSize: 12,
    textAlign: 'center',
    color: THEME.colors.onSurfaceVariant
  },
  trendRetry: {
    marginTop: 10,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  trendRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  // Bar chart ------------------------------------------------------------
  chartBox: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  chartRow: {
    flexDirection: 'row',
    height: 132
  },
  chartCol: {
    flex: 1,
    alignItems: 'center'
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  chartValueLatest: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primaryContainer
  },
  chartBarTrack: {
    flex: 1,
    width: '86%',
    justifyContent: 'flex-end',
    marginVertical: 6
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: THEME.colors.outlineVariant,
    opacity: 0.55
  },
  chartBarLatest: {
    backgroundColor: THEME.colors.primaryContainer,
    opacity: 1
  },
  chartDay: {
    fontSize: 10,
    color: THEME.colors.outline
  },
  chartDayLatest: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainerHighest
  },
  chartFooterText: {
    fontSize: 10,
    color: THEME.colors.onSurfaceVariant
  },
  chartFooterMax: {
    fontWeight: '700',
    color: THEME.colors.secondary
  },

  // Trust + guarantee badges --------------------------------------------
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 14
  },
  trustIconTile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  trustIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  trustTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.onSurface
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 3
  },
  badgeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  badgeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceContainerHigh,
    borderRadius: 10,
    padding: 8
  },
  badgeIcon: {
    fontSize: 15,
    color: THEME.colors.secondary,
    marginRight: 6
  },
  badgeText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant
  },

  // Bottom bar -----------------------------------------------------------
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primaryContainer,
    borderRadius: 12
  },
  ctaText: {
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.onPrimary,
    marginLeft: 8
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 2
  },
  draftIcon: {
    fontSize: 15,
    marginRight: 6
  },
  draftText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  }
});
