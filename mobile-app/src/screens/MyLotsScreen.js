import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { categoryLabels } from '../utils/lotDraft';
import { formatRupees, formatWeight, formatShortDate } from '../utils/format';

/**
 * Screen 10 — "मेरे Lots" (My Lots).
 *
 * Every number on this screen comes from the backend:
 *   GET /lots/my          -> the collector's own lots (JWT scoped: collectorId
 *                            is taken from `req.user`, never sent by the app)
 *   GET /transactions/my  -> the same collector's quote/handover rows, which is
 *                            where the recycler, the agreed amount and the
 *                            payment mode of a lot live
 * The screen only *picks* fields and formats them; it never re-prices a lot.
 */

// Backend `LOT_STATUS` enum (backend/src/utils/constants.js) — display order
// identical to the Stitch mock's card states.
const LOT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  QUOTE_PENDING: 'QUOTE_PENDING',
  QUOTE_RECEIVED: 'QUOTE_RECEIVED',
  ACCEPTED: 'ACCEPTED',
  HANDOVER_PENDING: 'HANDOVER_PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// A transaction is "the accepted one" once the collector has accepted a quote;
// the backend cancels every other recycler's row at that moment.
const ACCEPTED_TXN_STATUSES = ['ACCEPTED', 'HANDOVER_PENDING', 'COMPLETED'];

// Stitch filter pills. Counts are derived from the real lot list.
const TABS = [
  { id: 'ALL', labelKey: 'ml_tab_all' },
  { id: 'PENDING', labelKey: 'ml_tab_pending' },
  { id: 'ACCEPTED', labelKey: 'ml_tab_accepted' },
  { id: 'COMPLETED', labelKey: 'ml_tab_completed' }
];

/** Which filter pill a backend lot status belongs to. */
const TAB_FOR_STATUS = {
  [LOT_STATUS.DRAFT]: 'PENDING',
  [LOT_STATUS.PUBLISHED]: 'PENDING',
  [LOT_STATUS.QUOTE_PENDING]: 'PENDING',
  [LOT_STATUS.QUOTE_RECEIVED]: 'PENDING',
  [LOT_STATUS.ACCEPTED]: 'ACCEPTED',
  [LOT_STATUS.HANDOVER_PENDING]: 'ACCEPTED',
  [LOT_STATUS.COMPLETED]: 'COMPLETED',
  // Cancelled lots are not one of the three Stitch pills; they stay reachable
  // through "सभी (All)" so the collector can always audit them.
  [LOT_STATUS.CANCELLED]: 'ALL'
};

/** Status pill copy per backend status. */
const STATUS_TEXT_KEY = {
  [LOT_STATUS.DRAFT]: 'ml_status_pending',
  [LOT_STATUS.PUBLISHED]: 'ml_status_published',
  [LOT_STATUS.QUOTE_PENDING]: 'ml_status_pending',
  [LOT_STATUS.QUOTE_RECEIVED]: 'ml_status_quote_received',
  [LOT_STATUS.ACCEPTED]: 'ml_status_accepted',
  [LOT_STATUS.HANDOVER_PENDING]: 'ml_status_handover_pending',
  [LOT_STATUS.COMPLETED]: 'ml_status_completed',
  [LOT_STATUS.CANCELLED]: 'ml_status_cancelled'
};

/** Pill tone: live/accepted = green, offer/processing = amber, done = grey. */
const STATUS_TONE = {
  [LOT_STATUS.DRAFT]: 'pending',
  [LOT_STATUS.PUBLISHED]: 'live',
  [LOT_STATUS.QUOTE_PENDING]: 'pending',
  [LOT_STATUS.QUOTE_RECEIVED]: 'offer',
  [LOT_STATUS.ACCEPTED]: 'accepted',
  [LOT_STATUS.HANDOVER_PENDING]: 'accepted',
  [LOT_STATUS.COMPLETED]: 'done',
  [LOT_STATUS.CANCELLED]: 'cancelled'
};

/** Primary CTA copy per status — matches the mock's card-by-card wording. */
const CTA_TEXT_KEY = {
  [LOT_STATUS.DRAFT]: 'ml_btn_details',
  [LOT_STATUS.PUBLISHED]: 'ml_btn_details',
  [LOT_STATUS.QUOTE_PENDING]: 'ml_btn_details',
  [LOT_STATUS.QUOTE_RECEIVED]: 'ml_btn_view_quote',
  [LOT_STATUS.ACCEPTED]: 'ml_btn_handover',
  [LOT_STATUS.HANDOVER_PENDING]: 'ml_btn_handover',
  [LOT_STATUS.COMPLETED]: 'ml_btn_view_receipt',
  [LOT_STATUS.CANCELLED]: 'ml_btn_details'
};

/** Backend `PAYMENT_METHODS` enum -> shared payment-mode label. */
const PAYMENT_LABEL_KEY = {
  CASH: 'pay_cash',
  UPI: 'pay_upi',
  BANK_TRANSFER: 'pay_bank'
};

/** Stable key for a lot, whichever id shape it arrived in. */
const lotKeyOf = (lot) => String(lot?._id || lot?.lotId || '');

/** A populated `lotId` on a transaction -> the same key as `lotKeyOf`. */
const txnLotKeyOf = (transaction) => String(transaction?.lotId?._id || transaction?.lotId || '');

/**
 * The amount the collector sees for a transaction. `finalPrice` is written by
 * the backend at handover, `quotedPrice` by the recycler when quoting — this is
 * the same field pair the backend's own earnings aggregation reads.
 */
const amountOf = (transaction) => {
  if (!transaction) return null;
  if (transaction.finalPrice != null) return Number(transaction.finalPrice) || 0;
  if (transaction.quotedPrice != null) return Number(transaction.quotedPrice) || 0;
  return null;
};

/**
 * One lot can carry several transactions (one per recycler that quoted). The
 * lot card shows the row that matters: the accepted/completed one when there
 * is one, otherwise the freshest quote.
 */
const pickTransaction = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const rank = (transaction) => {
    const acceptedIndex = ACCEPTED_TXN_STATUSES.indexOf(transaction.transactionStatus);
    if (acceptedIndex >= 0) return 100 + acceptedIndex;
    return transaction.transactionStatus === 'QUOTED' ? 50 : 10;
  };

  return [...rows].sort((a, b) => rank(b) - rank(a))[0];
};

export const MyLotsScreen = () => {
  const { t, user, isOnline, setCurrentScreen, setSelectedLot, setSelectedRecycler } = useApp();
  const { gutter, font, scale, bottomInset } = useResponsive();

  const [lots, setLots] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [listState, setListState] = useState('loading'); // loading | ready | empty | error
  const [tab, setTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // The floating "+ नया कबाड़ बेचें" pill sits directly above the 64px nav bar,
  // so the scrollable feed reserves room for both.
  const navSpace = useBottomBarSpace(scale(64) + scale(56));

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ES';

  const loadLots = useCallback(
    async (mode = 'load') => {
      if (mode === 'refresh') setRefreshing(true);
      else setListState('loading');

      // Both calls are collector-scoped server-side through the JWT — the app
      // never sends a collector id.
      const [lotsRes, txnRes] = await Promise.all([
        ApiService.getMyLots(),
        ApiService.getMyTransactions()
      ]);

      setRefreshing(false);

      if (lotsRes?.isOffline || !lotsRes?.success || !Array.isArray(lotsRes.data)) {
        setLots([]);
        setTransactions([]);
        setListState('error');
        return;
      }

      const rows = lotsRes.data;
      setLots(rows);
      setTransactions(txnRes?.success && Array.isArray(txnRes.data) ? txnRes.data : []);
      setListState(rows.length > 0 ? 'ready' : 'empty');
    },
    []
  );

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  /** lotId -> every transaction row that lot produced, most relevant first. */
  const transactionByLot = useMemo(() => {
    const grouped = new Map();
    transactions.forEach((transaction) => {
      const key = txnLotKeyOf(transaction);
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(transaction);
    });
    return grouped;
  }, [transactions]);

  /** Pill counters over the collector's real lots. */
  const counts = useMemo(() => {
    const base = { ALL: lots.length, PENDING: 0, ACCEPTED: 0, COMPLETED: 0 };
    lots.forEach((lot) => {
      const group = TAB_FOR_STATUS[lot.status] || 'PENDING';
      if (group !== 'ALL') base[group] += 1;
    });
    return base;
  }, [lots]);

  const visibleLots = useMemo(() => {
    if (tab === 'ALL') return lots;
    return lots.filter((lot) => (TAB_FOR_STATUS[lot.status] || 'PENDING') === tab);
  }, [lots, tab]);

  /**
   * Screen 09 serves two journeys: a brand-new lot (`createdLot`, reached from
   * Screen 08) and an existing lot opened from this list (`selectedLot`). The
   * stale recycler selection of the previous journey must not leak in, so it is
   * cleared here — Screen 09's back button then returns to this list.
   */
  const openLot = (lot) => {
    setSelectedRecycler(null);
    setSelectedLot(lot);
    setCurrentScreen('LOT_DETAILS');
  };

  /**
   * "डिजिटल रसीद देखें" — the receipt document is a later release (Phase 8+),
   * so the collector gets an honest message instead of a dead button, exactly
   * like the "next step" notice Screen 05 already uses.
   */
  const handleCardAction = (lot) => {
    if (lot.status === LOT_STATUS.COMPLETED) {
      Alert.alert(t.ml_receipt_soon_title, t.ml_receipt_soon_msg);
      return;
    }
    openLot(lot);
  };

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert(t.ml_call_recycler, phone));
  };

  const handleSellScrap = () => setCurrentScreen('MATERIAL_SELECTION');

  /**
   * One lot card.
   *
   * Amount priority (never computed by the app, only selected):
   *   ACCEPTED / HANDOVER_PENDING  -> accepted transaction's finalPrice/quotedPrice
   *   QUOTE_RECEIVED               -> that transaction's quotedPrice
   *   COMPLETED                    -> finalPrice (falls back to quotedPrice)
   *   every other status           -> the lot's own backend valuation
   */
  const renderCard = (lot) => {
    const status = lot.status || LOT_STATUS.PUBLISHED;
    const labels = categoryLabels(lot.category, t);
    const weightText = formatWeight(lot.approxWeight, lot.weightUnit);
    const created = formatShortDate(lot.createdAt);

    const related = pickTransaction(transactionByLot.get(lotKeyOf(lot)));
    const txnAmount = amountOf(related);
    const hasAccepted = related && ACCEPTED_TXN_STATUSES.includes(related.transactionStatus);
    const estimated = Number(lot.estimatedValue) || 0;

    let amount = estimated;
    let amountLabel = t.ml_price_est;
    let rateText = '';

    if (status === LOT_STATUS.COMPLETED) {
      amount = txnAmount != null ? txnAmount : estimated;
      amountLabel = t[PAYMENT_LABEL_KEY[related?.paymentMethod]] || t.ml_price_agreed;
    } else if (status === LOT_STATUS.ACCEPTED || status === LOT_STATUS.HANDOVER_PENDING) {
      amount = txnAmount != null ? txnAmount : estimated;
      amountLabel = hasAccepted ? t.ml_price_agreed : t.ml_price_est;
    } else if (status === LOT_STATUS.QUOTE_RECEIVED && related) {
      amount = txnAmount != null ? txnAmount : estimated;
      amountLabel = t.ml_price_best_offer;
      const weighable = Number(related.weight || lot.approxWeight) || 0;
      // Same display-only division the lot screen already does: the backend
      // stores one lump quote, the mock prints it as a per-KG rate.
      if (weighable > 0) rateText = `${formatRupees(amount / weighable)} ${t.per_kg}`;
    }

    const recycler =
      related && related.recyclerId && typeof related.recyclerId === 'object' ? related.recyclerId : null;
    const recyclerName = recycler?.facilityName || '';
    const recyclerCity = recycler?.city || lot.collectionLocation?.city || '';
    const tone = STATUS_TONE[status] || 'pending';
    const isActiveCard = status === LOT_STATUS.ACCEPTED || status === LOT_STATUS.HANDOVER_PENDING;
    const ctaText = t[CTA_TEXT_KEY[status]] || t.ml_btn_details;

    return (
      <View key={lotKeyOf(lot)} style={[styles.card, isActiveCard && styles.cardActive]}>
        {/* Card header: lot id + created date */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardIdRow}>
            <Text style={styles.cardIdIcon}>{status === LOT_STATUS.COMPLETED ? '🧾' : '📋'}</Text>
            <Text style={styles.cardId} numberOfLines={1}>
              {lot.lotId || lot._id}
            </Text>
          </View>
          {created ? (
            <Text style={styles.cardDate} numberOfLines={1}>
              {created}
            </Text>
          ) : null}
        </View>

        {/* Material + amount bento */}
        <View style={styles.cardMaterialRow}>
          <View style={styles.cardMaterialCol}>
            <View style={styles.cardMaterialTitleRow}>
              <Text style={styles.cardMaterialIcon}>{labels.emoji}</Text>
              <Text style={[styles.cardMaterialTitle, { fontSize: font(17) }]} numberOfLines={2}>
                {labels.title}
              </Text>
            </View>
            <Text style={styles.cardWeight} numberOfLines={1}>
              {weightText}
            </Text>
          </View>

          <View style={styles.cardAmountCol}>
            <Text
              style={[styles.cardAmount, { fontSize: font(26) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatRupees(amount)}
            </Text>
            <Text style={styles.cardAmountLabel} numberOfLines={1}>
              {amountLabel}
            </Text>
            {rateText ? (
              <Text style={styles.cardRate} numberOfLines={1}>
                {rateText}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Verified recycler row — rendered only when the lot really has a
            counterpart recycler row in GET /transactions/my. */}
        {recyclerName ? (
          <View style={styles.recyclerRow}>
            <View style={styles.recyclerLeft}>
              <Text style={styles.recyclerVerified}>✅</Text>
              <View style={styles.recyclerTextCol}>
                <Text style={styles.recyclerName} numberOfLines={1}>
                  {recyclerName}
                </Text>
                <Text style={styles.recyclerSub} numberOfLines={1}>
                  {t.ml_verified_recycler}
                  {recyclerCity ? ` • ${recyclerCity}` : ''}
                </Text>
              </View>
            </View>
            {recycler?.contactPhone ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCall(recycler.contactPhone)}
                accessibilityRole="button"
                accessibilityLabel={t.ml_call_recycler}
                style={styles.recyclerCallButton}
              >
                <Text style={styles.recyclerCallIcon}>📞</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Status pill */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, styles[`status_${tone}`]]}>
            <View style={[styles.statusDot, styles[`statusDot_${tone}`]]} />
            <Text style={styles.statusText} numberOfLines={2}>
              {t[STATUS_TEXT_KEY[status]] || status}
            </Text>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleCardAction(lot)}
          accessibilityRole="button"
          accessibilityLabel={ctaText}
          style={[
            styles.cardCta,
            isActiveCard && styles.cardCtaStrong,
            status === LOT_STATUS.QUOTE_RECEIVED && styles.cardCtaOutline,
            status === LOT_STATUS.COMPLETED && styles.cardCtaSurface
          ]}
        >
          <Text
            style={[
              styles.cardCtaText,
              (isActiveCard || status === LOT_STATUS.QUOTE_RECEIVED) && styles.cardCtaTextStrong
            ]}
            numberOfLines={1}
          >
            {status === LOT_STATUS.COMPLETED ? `🧾 ${ctaText}` : ctaText}
          </Text>
          {status !== LOT_STATUS.COMPLETED ? <Text style={styles.cardCtaArrow}>→</Text> : null}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        left={
          <View style={styles.headerBrand}>
            <Text style={styles.headerBrandIcon}>📍</Text>
            <Text style={styles.headerBrandText} numberOfLines={1}>
              {t.app_name}
            </Text>
          </View>
        }
        right={
          <HeaderIconButton size={36} style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userInitials}</Text>
          </HeaderIconButton>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: navSpace }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLots('refresh')}
            colors={[THEME.colors.primaryLight]}
            tintColor={THEME.colors.primaryLight}
          />
        }
      >
        {/* index 0 — sync pill + screen title */}
        <View style={[styles.titleBlock, { paddingHorizontal: gutter }]}>
          <View style={styles.syncPill}>
            <Text style={styles.syncIcon}>{isOnline ? '☁️' : '📡'}</Text>
            <Text style={styles.syncText} numberOfLines={1}>
              {isOnline ? t.online_synced : t.ml_offline_pill}
            </Text>
            <View style={[styles.syncDot, !isOnline && styles.syncDotOffline]} />
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={[styles.title, { fontSize: font(22) }]} numberOfLines={2}>
                {t.ml_title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {t.ml_subtitle}
              </Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText} numberOfLines={1}>
                {`${counts.ALL} ${t.ml_total_count}`}
              </Text>
            </View>
          </View>
        </View>

        {/* index 1 — sticky filter pills */}
        <View style={[styles.filterBar, { paddingHorizontal: gutter }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setTab(item.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t[item.labelKey]}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {t[item.labelKey]}
                  </Text>
                  <View style={[styles.chipCountBadge, active && styles.chipCountBadgeActive]}>
                    <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>
                      {counts[item.id] || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* index 2 — lots feed */}
        <View style={[styles.listWrap, { paddingHorizontal: gutter }]}>
          {listState === 'loading' ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={THEME.colors.primary} />
            </View>
          ) : null}

          {listState === 'error' ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateIcon}>⚠️</Text>
              <Text style={styles.stateDesc}>{t.ml_refresh_err}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => loadLots()}
                accessibilityRole="button"
                accessibilityLabel={t.lq_refresh_btn}
                style={styles.stateRetry}
              >
                <Text style={styles.stateRetryText}>{`↻ ${t.lq_refresh_btn}`}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {listState === 'ready' || listState === 'empty' ? (
            visibleLots.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateIcon}>📦</Text>
                <Text style={styles.stateTitle}>{t.ml_empty_title}</Text>
                <Text style={styles.stateDesc}>{tab === 'ALL' ? t.ml_empty_desc : t.ml_empty_filter}</Text>
              </View>
            ) : (
              visibleLots.map((lot) => renderCard(lot))
            )
          ) : null}
        </View>
      </ScrollView>

      {/* Contextual quick trigger — Stitch `fixed bottom-20` pill, anchored
          above the nav bar so both stay reachable. */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrap, { bottom: scale(64) + Math.max(bottomInset, scale(8)) + 8 }]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSellScrap}
          accessibilityRole="button"
          accessibilityLabel={t.ml_btn_sell_scrap}
          style={styles.sellPill}
        >
          <Text style={styles.sellPillIcon}>➕</Text>
          <Text style={styles.sellPillText} numberOfLines={1}>
            {t.ml_btn_sell_scrap}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shared 4-destination bottom nav (Stitch). "My Lots" is the active tab;
          Profile ships in a later phase, so it stays a plain label. */}
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
          accessibilityState={{ selected: true }}
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
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1
  },
  headerBrandIcon: {
    fontSize: 17,
    marginRight: 6
  },
  headerBrandText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  headerAvatar: {
    backgroundColor: THEME.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  headerAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002109'
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 0
  },

  // Title block ----------------------------------------------------------
  titleBlock: {
    paddingTop: 12,
    paddingBottom: 10
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.6)'
  },
  syncIcon: {
    fontSize: 12,
    marginRight: 5
  },
  syncText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 6,
    backgroundColor: THEME.colors.secondary
  },
  syncDotOffline: {
    backgroundColor: THEME.colors.warning
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 12
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  countPill: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },

  // Sticky filter pills --------------------------------------------------
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
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  chipTextActive: {
    color: THEME.colors.onPrimary,
    fontWeight: '700'
  },
  chipCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainerHigh
  },
  chipCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)'
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  chipCountTextActive: {
    color: THEME.colors.onPrimary
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

  // Lot card -------------------------------------------------------------
  card: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  cardActive: {
    borderWidth: 2,
    borderColor: 'rgba(0, 110, 45, 0.3)'
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceContainerHigh
  },
  cardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0
  },
  cardIdIcon: {
    fontSize: 14,
    marginRight: 6
  },
  cardId: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: THEME.colors.primary
  },
  cardDate: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.outline,
    marginLeft: 8
  },
  cardMaterialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  cardMaterialCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 10
  },
  cardMaterialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardMaterialIcon: {
    fontSize: 18,
    marginRight: 6
  },
  cardMaterialTitle: {
    flexShrink: 1,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  cardWeight: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 3
  },
  cardAmountCol: {
    flexShrink: 0,
    alignItems: 'flex-end',
    maxWidth: '46%'
  },
  cardAmount: {
    fontWeight: '800',
    letterSpacing: -0.4,
    color: THEME.colors.primary
  },
  cardAmountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.secondary,
    marginTop: 2
  },
  cardRate: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },

  // Verified recycler strip ---------------------------------------------
  recyclerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.4)',
    borderRadius: 10
  },
  recyclerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0
  },
  recyclerVerified: {
    fontSize: 15,
    marginRight: 8
  },
  recyclerTextCol: {
    flexShrink: 1,
    minWidth: 0
  },
  recyclerName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  recyclerSub: {
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 1
  },
  recyclerCallButton: {
    flexShrink: 0,
    width: 34,
    height: 34,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  recyclerCallIcon: {
    fontSize: 14
  },

  // Status pill ----------------------------------------------------------
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  status_live: {
    backgroundColor: 'rgba(124, 249, 148, 0.3)',
    borderColor: 'rgba(0, 110, 45, 0.25)'
  },
  status_pending: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderColor: THEME.colors.outlineVariant
  },
  status_offer: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a'
  },
  status_accepted: {
    backgroundColor: 'rgba(124, 249, 148, 0.5)',
    borderColor: 'rgba(0, 110, 45, 0.3)'
  },
  status_done: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderColor: THEME.colors.surfaceContainerHighest
  },
  status_cancelled: {
    backgroundColor: THEME.colors.errorContainer,
    borderColor: 'rgba(186, 26, 26, 0.2)'
  },
  statusDot_live: {
    backgroundColor: THEME.colors.secondary
  },
  statusDot_pending: {
    backgroundColor: THEME.colors.outline
  },
  statusDot_offer: {
    backgroundColor: '#f59e0b'
  },
  statusDot_accepted: {
    backgroundColor: THEME.colors.secondary
  },
  statusDot_done: {
    backgroundColor: THEME.colors.outline
  },
  statusDot_cancelled: {
    backgroundColor: THEME.colors.error
  },

  // Card CTA -------------------------------------------------------------
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    backgroundColor: THEME.colors.surfaceContainerLow
  },
  cardCtaStrong: {
    backgroundColor: THEME.colors.primaryContainer,
    borderColor: THEME.colors.primaryContainer
  },
  cardCtaOutline: {
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: THEME.colors.primaryContainer
  },
  cardCtaSurface: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderColor: THEME.colors.outlineVariant
  },
  cardCtaText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  cardCtaTextStrong: {
    color: THEME.colors.onPrimary
  },
  cardCtaArrow: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },

  // Floating quick trigger ----------------------------------------------
  floatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  sellPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(177, 242, 190, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6
  },
  sellPillIcon: {
    fontSize: 16,
    marginRight: 8,
    color: THEME.colors.surfaceContainerLowest
  },
  sellPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.surfaceContainerLowest
  },

  // Bottom navigation ----------------------------------------------------
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainerHighest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  navItemActive: {
    backgroundColor: THEME.colors.secondaryContainer
  },
  navIcon: {
    fontSize: 18
  },
  navIconActive: {
    fontSize: 19
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  navLabelActive: {
    fontWeight: '800',
    color: '#007230'
  }
});
