import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, MATERIAL_CATEGORIES } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { formatRupees, formatWeight, formatShortDate } from '../utils/format';

/**
 * Screen 11 — "मेरी कमाई / Earnings & Transactions".
 *
 * Data sources (both collector-scoped server-side through the JWT):
 *   GET /transactions/my    -> the sales list, payment mode and per-sale amount
 *   GET /users/me/earnings  -> the backend's own paid / pending aggregates
 *                              (TransactionService.getEarnings)
 *
 * The Paid / Pending tiles print the backend aggregates verbatim. The hero and
 * the 4-week chart are *time windows* over the same transaction amounts (the
 * backend exposes no per-week endpoint) — no rate, multiplier or price is ever
 * recalculated here.
 */

// A quote becomes a "sale" once the collector accepts it; the backend then
// cancels the other recyclers' rows.
const SALE_STATUSES = ['ACCEPTED', 'HANDOVER_PENDING', 'COMPLETED'];

// Stitch category filter bar.
const PAYMENT_FILTERS = [
  { id: 'ALL', labelKey: 'et_filter_all' },
  { id: 'CASH', labelKey: 'et_filter_cash' },
  { id: 'UPI', labelKey: 'et_filter_upi' },
  { id: 'BANK_TRANSFER', labelKey: 'et_filter_bank' }
];

/** Backend `PAYMENT_METHODS` enum -> shared payment-mode label. */
const PAYMENT_LABEL_KEY = {
  CASH: 'pay_cash',
  UPI: 'pay_upi',
  BANK_TRANSFER: 'pay_bank'
};

/** Backend `PAYMENT_STATUS` enum -> pill copy + tone. */
const PAYMENT_STATUS_KEY = {
  PAID: 'et_status_paid',
  PENDING: 'et_status_pending',
  PARTIAL: 'et_status_partial'
};
const PAYMENT_STATUS_TONE = {
  PAID: 'paid',
  PENDING: 'pending',
  PARTIAL: 'partial'
};

const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Amount of one transaction — the same field pair the backend aggregates over. */
const amountOf = (transaction) => {
  if (!transaction) return 0;
  if (transaction.finalPrice != null) return Number(transaction.finalPrice) || 0;
  return Number(transaction.quotedPrice) || 0;
};

/**
 * When the sale "happened" for the monthly/weekly windows: the handover time
 * when the backend froze it, otherwise the acceptance time, otherwise creation.
 */
const soldAt = (transaction) => {
  const value = transaction.completedAt || transaction.acceptedAt || transaction.createdAt;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

/** Total of every sale whose soldAt falls inside [from, to). */
const sumBetween = (rows, from, to) =>
  rows.reduce((total, row) => {
    const time = soldAt(row);
    if (time == null || time < from || time >= to) return total;
    return total + amountOf(row);
  }, 0);

const materialOf = (category) => MATERIAL_CATEGORIES.find((item) => item.id === category) || null;

const materialName = (category, t) => {
  const found = materialOf(category);
  return found ? t[found.labelKey] || found.id : category || '';
};

const materialEmoji = (category) => {
  const found = materialOf(category);
  return found ? found.emoji : '♻️';
};

export const EarningsTransactionsScreen = () => {
  const { t, user, setEarnings, setCurrentScreen } = useApp();
  const { gutter, font, scale, bottomInset } = useResponsive();

  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState(null); // GET /users/me/earnings payload
  const [listState, setListState] = useState('loading'); // loading | ready | error
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const navSpace = useBottomBarSpace(scale(64));

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ES';

  const loadEarnings = useCallback(
    async (mode = 'load') => {
      if (mode === 'refresh') setRefreshing(true);
      else setListState('loading');

      const [txnRes, earnRes] = await Promise.all([
        ApiService.getMyTransactions(),
        ApiService.getEarnings()
      ]);

      setRefreshing(false);

      if (txnRes?.isOffline || !txnRes?.success || !Array.isArray(txnRes.data)) {
        setTransactions([]);
        setListState('error');
        return;
      }

      setTransactions(txnRes.data);

      // Backend aggregates are the single source of truth for Paid / Pending,
      // and they are also cached in the app context for the dashboard card.
      if (earnRes?.success && earnRes.data) {
        setTotals(earnRes.data);
        setEarnings(earnRes.data);
      }

      setListState('ready');
    },
    [setEarnings]
  );

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  /** Only accepted/completed rows are sales; pure quotes are not payouts yet. */
  const saleRows = useMemo(
    () => transactions.filter((row) => SALE_STATUSES.includes(row.transactionStatus)),
    [transactions]
  );

  /** Hero: this calendar month vs the previous one, over the same amounts. */
  const monthly = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const thisMonth = sumBetween(saleRows, monthStart, Date.now() + 1);
    const lastMonth = sumBetween(saleRows, lastMonthStart, monthStart);

    // The Stitch "+x% vs last month" badge is printed only when the previous
    // month really has a baseline — never with an invented percentage.
    let changePercent = null;
    if (lastMonth > 0) {
      changePercent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    }

    return { thisMonth, lastMonth, changePercent, hasSales: saleRows.length > 0 };
  }, [saleRows]);

  /** Last four rolled weeks, oldest first (W1 … W4 = current week). */
  const weeks = useMemo(() => {
    const end = Date.now();
    return [3, 2, 1, 0].map((back, index) => {
      const to = end - back * WEEK_MS;
      const from = to - WEEK_MS;
      return { label: WEEK_LABELS[index], value: sumBetween(saleRows, from, to) };
    });
  }, [saleRows]);

  const trendMax = useMemo(() => Math.max(1, ...weeks.map((week) => week.value)), [weeks]);
  const hasTrend = useMemo(() => weeks.some((week) => week.value > 0), [weeks]);

  const visibleRows = useMemo(() => {
    if (paymentFilter === 'ALL') return saleRows;
    return saleRows.filter((row) => (row.paymentMethod || 'CASH') === paymentFilter);
  }, [saleRows, paymentFilter]);

  const handleHelp = () => Alert.alert(t.et_help_title, t.et_help_toast);

  /** One sales row: material + weight, recycler, date, amount, payout state. */
  const renderRow = (row) => {
    const recycler = row.recyclerId && typeof row.recyclerId === 'object' ? row.recyclerId : null;
    const amount = amountOf(row);
    const isPaid = row.paymentStatus === 'PAID';
    const tone = PAYMENT_STATUS_TONE[row.paymentStatus] || 'pending';
    const modeLabel = t[PAYMENT_LABEL_KEY[row.paymentMethod]] || t.pay_cash;
    const sold = soldAt(row);

    return (
      <View key={row._id || row.transactionId} style={styles.txnCard}>
        <View style={styles.txnTop}>
          <View style={styles.txnLeft}>
            <View style={styles.txnIconBox}>
              <Text style={styles.txnIcon}>{materialEmoji(row.materialCategory)}</Text>
            </View>
            <View style={styles.txnTextCol}>
              <Text style={styles.txnTitle} numberOfLines={1}>
                {materialName(row.materialCategory, t)}
                <Text style={styles.txnWeight}>{`  (${formatWeight(row.weight, row.weightUnit)})`}</Text>
              </Text>
              {recycler?.facilityName ? (
                <Text style={styles.txnRecycler} numberOfLines={1}>
                  {recycler.facilityName}
                </Text>
              ) : null}
              {sold ? (
                <Text style={styles.txnDate} numberOfLines={1}>
                  {formatShortDate(new Date(sold))}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.txnAmountCol}>
            <Text style={styles.txnAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {isPaid ? `+${formatRupees(amount)}` : formatRupees(amount)}
            </Text>
            <View style={[styles.txnStatusPill, styles[`txnStatus_${tone}`]]}>
              <View style={[styles.txnStatusDot, styles[`txnStatusDot_${tone}`]]} />
              <Text style={styles.txnStatusText} numberOfLines={1}>
                {t[PAYMENT_STATUS_KEY[row.paymentStatus]] || row.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.txnBottom}>
          <Text style={styles.txnMeta} numberOfLines={1}>
            {`${t.et_mode_label} ${modeLabel}`}
          </Text>
          <Text style={styles.txnId} numberOfLines={1}>
            {`${t.et_id_label} ${row.transactionId || row._id}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        left={
          <HeaderIconButton size={36} tone="plain">
            <Text style={styles.headerIcon}>💳</Text>
          </HeaderIconButton>
        }
        center={
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontSize: font(17) }]} numberOfLines={1}>
              {t.et_title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {t.et_subtitle}
            </Text>
          </View>
        }
        right={
          <View style={styles.headerRight}>
            <HeaderIconButton size={34} tone="plain">
              <Text style={styles.headerIcon}>📍</Text>
            </HeaderIconButton>
            <HeaderIconButton size={34} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{userInitials}</Text>
            </HeaderIconButton>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: gutter, paddingBottom: navSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEarnings('refresh')}
            colors={[THEME.colors.primaryLight]}
            tintColor={THEME.colors.primaryLight}
          />
        }
      >
        <Text style={styles.accountSummary} numberOfLines={2}>
          {t.et_account_summary}
        </Text>

        {/* Hero: this month's earnings + real month-over-month badge */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel} numberOfLines={2}>
                {t.et_hero_title}
              </Text>
              <Text
                style={[styles.heroValue, { fontSize: font(40) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {listState === 'loading' ? '…' : formatRupees(monthly.thisMonth)}
              </Text>
            </View>
            <View style={styles.heroIconBox}>
              <Text style={styles.heroIcon}>📈</Text>
            </View>
          </View>

          {monthly.changePercent != null ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>{monthly.changePercent >= 0 ? '↑' : '↓'}</Text>
              <Text style={styles.heroBadgeText} numberOfLines={2}>
                {`${Math.abs(monthly.changePercent)}% ${t.et_hero_indicator}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Paid / Pending tiles — printed verbatim from GET /users/me/earnings */}
        <View style={styles.tileGrid}>
          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <View style={[styles.tileDot, styles.tileDotPaid]} />
              <Text style={styles.tileLabel} numberOfLines={1}>
                {t.et_paid_title}
              </Text>
            </View>
            <Text
              style={[styles.tileValue, { fontSize: font(24) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {totals ? formatRupees(totals.totalEarned) : '—'}
            </Text>
            <View style={styles.tileFoot}>
              <Text style={styles.tileFootIcon}>✅</Text>
              <Text style={styles.tileFootText} numberOfLines={2}>
                {t.et_paid_sub}
              </Text>
            </View>
          </View>

          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <View style={[styles.tileDot, styles.tileDotPending]} />
              <Text style={styles.tileLabel} numberOfLines={1}>
                {t.et_pending_title}
              </Text>
            </View>
            <Text
              style={[styles.tileValue, styles.tileValuePending, { fontSize: font(24) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {totals ? formatRupees(totals.totalPending) : '—'}
            </Text>
            <View style={styles.tileFoot}>
              <Text style={styles.tileFootIcon}>⏳</Text>
              <Text style={styles.tileFootText} numberOfLines={2}>
                {t.et_pending_sub}
              </Text>
            </View>
          </View>
        </View>

        {/* Trust strip */}
        <View style={styles.guaranteeStrip}>
          <Text style={styles.guaranteeIcon}>✅</Text>
          <Text style={styles.guaranteeText} numberOfLines={3}>
            {t.et_guarantee_text}
          </Text>
        </View>

        {/* Earnings trend — four real calendar weeks of the same amounts */}
        <View style={styles.trendCard}>
          <View style={styles.trendHead}>
            <View style={styles.trendHeadText}>
              <Text style={styles.trendTitle} numberOfLines={1}>
                {t.et_trend_title}
              </Text>
              <Text style={styles.trendSub} numberOfLines={1}>
                {t.et_trend_sub}
              </Text>
            </View>
            <Text style={styles.trendHeadIcon}>📊</Text>
          </View>

          {hasTrend ? (
            <View style={styles.chartRow}>
              {weeks.map((week, index) => (
                <View key={week.label} style={styles.chartCol}>
                  <Text style={styles.chartValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    {formatRupees(week.value)}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        index === weeks.length - 1 && styles.chartBarCurrent,
                        { height: Math.max(6, Math.round((week.value / trendMax) * 96)) }
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, index === weeks.length - 1 && styles.chartLabelCurrent]}>
                    {week.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.trendEmpty}>{t.et_trend_empty}</Text>
          )}
        </View>

        {/* Recent sales + payment-mode filter */}
        <View style={styles.recentHead}>
          <Text style={styles.recentTitle} numberOfLines={1}>
            {t.et_recent_title}
          </Text>
          <Text style={styles.recentSub} numberOfLines={1}>
            {t.et_recent_sub}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {PAYMENT_FILTERS.map((item) => {
            const active = paymentFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => setPaymentFilter(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t[item.labelKey]}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
                  {t[item.labelKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.txnList}>
          {listState === 'loading' ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={THEME.colors.primary} />
            </View>
          ) : null}

          {listState === 'error' ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateIcon}>⚠️</Text>
              <Text style={styles.stateDesc}>{t.et_refresh_err}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => loadEarnings()}
                accessibilityRole="button"
                accessibilityLabel={t.lq_refresh_btn}
                style={styles.stateRetry}
              >
                <Text style={styles.stateRetryText}>{`↻ ${t.lq_refresh_btn}`}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {listState === 'ready'
            ? visibleRows.length > 0
              ? visibleRows.map((row) => renderRow(row))
              : (
                <View style={styles.stateBox}>
                  <Text style={styles.stateIcon}>🧾</Text>
                  <Text style={styles.stateTitle}>{t.et_empty_title}</Text>
                  <Text style={styles.stateDesc}>
                    {saleRows.length === 0 ? t.et_empty_desc : t.et_empty_filter}
                  </Text>
                </View>
              )
            : null}
        </View>

        {/* Direct assistance card (Stitch "हिसाब में कोई समस्या?") */}
        <View style={styles.helpCard}>
          <View style={styles.helpLeft}>
            <View style={styles.helpIconBox}>
              <Text style={styles.helpIcon}>🎧</Text>
            </View>
            <View style={styles.helpTextCol}>
              <Text style={styles.helpTitle} numberOfLines={2}>
                {t.et_help_title}
              </Text>
              <Text style={styles.helpSub} numberOfLines={2}>
                {t.et_help_sub}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleHelp}
            accessibilityRole="button"
            accessibilityLabel={t.et_help_btn}
            style={styles.helpButton}
          >
            <Text style={styles.helpButtonIcon}>📞</Text>
            <Text style={styles.helpButtonText} numberOfLines={1}>
              {t.et_help_btn}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Shared 4-destination bottom nav — "Earnings" is the active tab. */}
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
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('MY_LOTS')}
          accessibilityRole="button"
          accessibilityLabel={t.nav_my_lots}
        >
          <Text style={styles.navIcon}>📦</Text>
          <Text style={styles.navLabel} numberOfLines={1}>
            {t.nav_my_lots}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('EARNINGS')}
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          accessibilityLabel={t.nav_earnings}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>💳</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]} numberOfLines={1}>
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
  headerIcon: {
    fontSize: 16
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.primary
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerAvatar: {
    marginLeft: 6,
    backgroundColor: THEME.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  headerAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002109'
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 12
  },
  accountSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.onSurfaceVariant,
    marginBottom: 12
  },

  // Hero card ------------------------------------------------------------
  heroCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  heroLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 12
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },
  heroValue: {
    fontWeight: '800',
    letterSpacing: -0.8,
    color: THEME.colors.primary,
    marginTop: 4
  },
  heroIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: THEME.colors.secondaryContainer
  },
  heroIcon: {
    fontSize: 20
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.secondaryContainer
  },
  heroBadgeIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007230',
    marginRight: 5
  },
  heroBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#007230'
  },

  // Paid / Pending tiles -------------------------------------------------
  tileGrid: {
    flexDirection: 'row',
    marginBottom: 12
  },
  tile: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tileDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 6
  },
  tileDotPaid: {
    backgroundColor: THEME.colors.secondary
  },
  tileDotPending: {
    backgroundColor: THEME.colors.warning
  },
  tileLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  tileValue: {
    fontWeight: '800',
    letterSpacing: -0.4,
    color: THEME.colors.primary,
    marginTop: 6
  },
  tileValuePending: {
    color: '#92400e'
  },
  tileFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainer
  },
  tileFootIcon: {
    fontSize: 11,
    marginRight: 5
  },
  tileFootText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#007230'
  },

  // Trust strip ----------------------------------------------------------
  guaranteeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  guaranteeIcon: {
    fontSize: 15,
    marginRight: 8
  },
  guaranteeText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    color: THEME.colors.onSurfaceVariant
  },

  // Trend card -----------------------------------------------------------
  trendCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  trendHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  trendHeadText: {
    flexShrink: 1,
    minWidth: 0
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  trendSub: {
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  trendHeadIcon: {
    fontSize: 16
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceContainerHigh
  },
  chartCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    marginHorizontal: 3
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginBottom: 4
  },
  chartTrack: {
    width: '100%',
    height: 96,
    justifyContent: 'flex-end'
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: THEME.colors.surfaceContainerHighest
  },
  chartBarCurrent: {
    backgroundColor: THEME.colors.primaryContainer
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 8
  },
  chartLabelCurrent: {
    fontWeight: '800',
    color: THEME.colors.primary
  },
  trendEmpty: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.onSurfaceVariant
  },

  // Recent sales ---------------------------------------------------------
  recentHead: {
    marginBottom: 8
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  recentSub: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  filterRow: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8
  },
  filterChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant
  },
  filterChipTextActive: {
    fontWeight: '700',
    color: THEME.colors.onPrimary
  },

  // Transaction list -----------------------------------------------------
  txnList: {
    paddingTop: 10
  },
  txnCard: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  txnTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  txnLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 10
  },
  txnIconBox: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceContainer
  },
  txnIcon: {
    fontSize: 18
  },
  txnTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  txnWeight: {
    fontSize: 11,
    fontWeight: '400',
    color: THEME.colors.onSurfaceVariant
  },
  txnRecycler: {
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  txnDate: {
    fontSize: 11,
    color: THEME.colors.outline,
    marginTop: 1
  },
  txnAmountCol: {
    flexShrink: 0,
    alignItems: 'flex-end',
    maxWidth: '42%'
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: THEME.colors.secondary
  },
  txnStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.full
  },
  txnStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  txnStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  txnStatus_paid: {
    backgroundColor: THEME.colors.secondaryContainer
  },
  txnStatus_pending: {
    backgroundColor: '#fef3c7'
  },
  txnStatus_partial: {
    backgroundColor: THEME.colors.infoBg
  },
  txnStatusDot_paid: {
    backgroundColor: THEME.colors.secondary
  },
  txnStatusDot_pending: {
    backgroundColor: THEME.colors.warning
  },
  txnStatusDot_partial: {
    backgroundColor: THEME.colors.info
  },
  txnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainer
  },
  txnMeta: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginRight: 8
  },
  txnId: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '500',
    color: THEME.colors.outline
  },

  // States ---------------------------------------------------------------
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

  // Help card ------------------------------------------------------------
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 12
  },
  helpLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  helpIconBox: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryContainer
  },
  helpIcon: {
    fontSize: 16
  },
  helpTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  helpSub: {
    fontSize: 11,
    lineHeight: 16,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 1
  },
  helpButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  helpButtonIcon: {
    fontSize: 12,
    marginRight: 5
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary
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
