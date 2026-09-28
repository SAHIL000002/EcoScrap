import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  Clipboard
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, CONDITIONS, API_BASE_URL } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';
import { ScreenHeader, HeaderIconButton, BottomActionBar, useBottomBarSpace } from '../components/Layout';
import ApiService from '../services/api.service';
import { categoryLabels } from '../utils/lotDraft';
import { formatRupees, formatWeight, formatShortDate, formatClock, formatDistance, shortId } from '../utils/format';

// Screen 09 ("Lot की जानकारी") shows the collector's own lot next to the
// recycler's quote. Every figure below comes from either POST/GET /lots or
// GET /lots/:lotId/quotes — the client only multiplies the backend's own
// numbers (total offer ÷ weight) the way the Stitch mock does.

/** `/uploads/x.jpg` -> absolute URL; Cloudinary URLs pass through untouched. */
const serverUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

const lotPhotoUri = (draftUri, images) => {
  if (draftUri) return draftUri;
  const first = Array.isArray(images) ? images[0] : null;
  return serverUrl(first);
};

/** "04:22:15" countdown to a quote's validity end, or null when it lapsed. */
const remainingClock = (value) => {
  const end = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(end)) return null;
  const left = Math.floor((end - Date.now()) / 1000);
  if (left <= 0) return null;
  const hours = String(Math.floor(left / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const seconds = String(left % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/** One flat quote row out of a GET /lots/:lotId/quotes transaction payload. */
const flattenQuote = (transaction) => {
  const rows = Array.isArray(transaction?.quotes) ? transaction.quotes : [];
  return rows.map((quote) => ({
    ...quote,
    transactionId: transaction._id,
    transactionStatus: transaction.transactionStatus,
    recycler: transaction.recyclerId,
    weight: transaction.weight,
    weightUnit: transaction.weightUnit
  }));
};

export const LotDetailsRecyclerQuoteScreen = () => {
  const {
    t,
    setCurrentScreen,
    createdLot,
    lotDraft,
    selectedRecycler,
    lotQuotes,
    setLotQuotes,
    selectedLot,
    setSelectedLot
  } = useApp();
  const { gutter, font, scale } = useResponsive();

  const [quotesState, setQuotesState] = useState('loading'); // loading | ready | empty | error
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [consent, setConsent] = useState(true);
  const [tick, setTick] = useState(0);

  const bottomBarSpace = useBottomBarSpace(scale(122));
  const lot = selectedLot || createdLot;

  useEffect(() => {
    if (!lot) {
      setCurrentScreen(selectedRecycler ? 'NEARBY_RECYCLERS' : 'MATERIAL_SELECTION');
    }
  }, [lot, selectedRecycler, setCurrentScreen]);

  // Keeps the quote validity countdown honest without a per-second render loop.
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadQuotes = useCallback(
    async (mode = 'load') => {
      const lotKey = lot?.lotId || lot?._id;
      if (!lotKey) return;

      if (mode === 'refresh') setIsRefreshing(true);
      else setQuotesState('loading');

      const res = await ApiService.getLotQuotes(lotKey);

      setIsRefreshing(false);

      if (res?.isOffline) {
        if (mode !== 'refresh') {
          setLotQuotes([]);
          setQuotesState('error');
        }
        return;
      }

      const transactions = res?.success && Array.isArray(res.data) ? res.data : [];
      const flat = transactions.flatMap((transaction) => flattenQuote(transaction));

      setLotQuotes(flat);
      setQuotesState(flat.length > 0 ? 'ready' : 'empty');
    },
    // Both journeys must retrigger the fetch: `createdLot` for a lot that was
    // just posted on Screen 06, `selectedLot` for a lot opened from My Lots.
    [lot?.lotId, lot?._id, setLotQuotes]
  );

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // The quote to headline: the recycler the collector tapped on Screen 08 when
  // that recycler actually quoted, otherwise the highest offer on the lot.
  const quote = useMemo(() => {
    if (!lotQuotes.length) return null;

    const accepted = lotQuotes.find((row) => row.status === 'ACCEPTED');
    if (accepted) return accepted;

    const selectedId = selectedRecycler?._id || selectedRecycler?.recyclerId;
    if (selectedId) {
      const fromSelected = lotQuotes.find(
        (row) => (row.recycler?._id || row.recycler?.recyclerId) === selectedId
      );
      if (fromSelected) return fromSelected;
    }

    return [...lotQuotes].sort(
      (a, b) => Number(b.quotedPrice || 0) - Number(a.quotedPrice || 0)
    )[0];
  }, [lotQuotes, selectedRecycler]);

  if (!lot) {
    return <View style={styles.container} />;
  }

  const labels = categoryLabels(lot.category, t);
  const condition = CONDITIONS.find((item) => item.id === lot.condition);
  const conditionText = condition ? t[condition.labelKey] || lot.condition : lot.condition || '';
  const photoUri = lotPhotoUri(lotDraft?.photoUri, lot.images);
  const weightText = formatWeight(lot.approxWeight, lot.weightUnit);
  const marketTotal = Number(lot.estimatedValue) || 0;
  const marketRate = Number(lot.pricePerUnit) || 0;
  const city = lot.collectionLocation?.city || lotDraft?.city || '';
  const stateName = lot.collectionLocation?.state || lotDraft?.state || '';
  const address = lot.collectionLocation?.address || '';

  // Backend stores a lump quotedPrice, so the per-kg rate the mock prints is
  // simply the backend's own total divided by the lot weight.
  const quoteTotal = quote ? Number(quote.quotedPrice) || 0 : 0;
  const quoteWeight = quote ? Number(quote.weight || lot.approxWeight) || 0 : 0;
  const quoteRate = quote && quoteWeight > 0 ? quoteTotal / quoteWeight : null;
  const diff = quote ? quoteTotal - marketTotal : 0;
  const isAccepted = quote?.status === 'ACCEPTED';
  const validityLeft = quote ? remainingClock(quote.validUntil) : null;
  const recycler = quote?.recycler || null;
  const recyclerDistance = formatDistance(selectedRecycler?.distanceKm);
  const contactPhone = recycler?.contactPhone || selectedRecycler?.contactPhone || null;

  const handleBack = () => {
    if (selectedLot) {
      setSelectedLot(null);
      setCurrentScreen('MY_LOTS');
    } else {
      setCurrentScreen('NEARBY_RECYCLERS');
    }
  };
  const handleRefresh = () => loadQuotes('refresh');

  const handleCopyLotId = () => {
    const lotId = String(lot.lotId || lot._id || '');
    try {
      Clipboard.setString(lotId);
      Alert.alert(t.lq_copy_btn, t.lq_copied);
    } catch (error) {
      // Clipboard is deprecated in RN core; never leave the collector stuck.
      Alert.alert(t.lq_lot_id_label, lotId);
    }
  };

  const handleCall = () => {
    if (!contactPhone) return;
    Linking.openURL(`tel:${contactPhone}`).catch(() => {
      Alert.alert(t.lq_btn_call, contactPhone);
    });
  };

  const handleReject = () => {
    if (!quote) return;
    Alert.alert(t.lq_btn_reject, t.lq_modal_desc, [
      { text: t.lq_modal_cancel_btn, style: 'cancel' },
      {
        text: t.lq_btn_reject,
        style: 'destructive',
        onPress: async () => {
          const res = await ApiService.rejectQuote(quote._id);
          if (!res?.success) {
            Alert.alert(t.lq_title, res?.message || t.network_err);
            return;
          }
          loadQuotes('refresh');
        }
      }
    ]);
  };

  /**
   * Accepting a quote is the collector's own action:
   * `PATCH /quotes/:quoteId { action: 'ACCEPT' }` marks this quote ACCEPTED,
   * books the lot as ACCEPTED and cancels the other recyclers' offers.
   */
  const handleConfirmAccept = async () => {
    if (!quote || isAccepting) return;
    setIsAccepting(true);

    const res = await ApiService.acceptQuote(quote._id);

    setIsAccepting(false);

    if (!res?.success) {
      Alert.alert(t.lq_title, res?.message || t.network_err);
      return;
    }

    setModalVisible(false);
    setLotQuotes(
      lotQuotes.map((row) =>
        row._id === quote._id
          ? { ...row, status: 'ACCEPTED' }
          : { ...row, status: row.status === 'PENDING' ? 'REJECTED' : row.status }
      )
    );
    Alert.alert(t.lq_title, t.lq_accepted_success);
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
            <Text style={[styles.headerTitle, { fontSize: font(16) }]} numberOfLines={1}>
              {t.lq_title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {t.lq_subtitle}
            </Text>
          </View>
        }
        right={
          <View style={styles.headerRightIcons}>
            <HeaderIconButton size={36} tone="plain">
              <Text style={styles.headerIcon}>↗</Text>
            </HeaderIconButton>
            <HeaderIconButton size={36} tone="plain">
              <Text style={styles.headerIcon}>ⓘ</Text>
            </HeaderIconButton>
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
        {/* Lot reference identifier */}
        <View style={styles.lotIdCard}>
          <View style={styles.lotIdLeft}>
            <View style={styles.lotIdIconTile}>
              <Text style={styles.lotIdIcon}>🏷️</Text>
            </View>
            <View style={styles.lotIdTextCol}>
              <Text style={styles.lotIdLabel} numberOfLines={1}>
                {t.lq_lot_id_label}
              </Text>
              <Text style={styles.lotIdValue} numberOfLines={1}>
                {lot.lotId || shortId(lot._id, 12)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCopyLotId}
            accessibilityRole="button"
            accessibilityLabel={t.lq_copy_btn}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>⧉ {t.lq_copy_btn}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrap material summary */}
        <View style={styles.materialCard}>
          <View style={styles.materialTopRow}>
            <View style={styles.thumb}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.thumbImage} resizeMode="cover" />
              ) : (
                <Text style={styles.thumbEmoji}>{labels.emoji}</Text>
              )}
              <View style={styles.thumbBadge}>
                <Text style={styles.thumbBadgeText} numberOfLines={1}>
                  {labels.title}
                </Text>
              </View>
            </View>

            <View style={styles.materialTextCol}>
              <View style={styles.materialBadgeRow}>
                <View style={styles.materialChip}>
                  <View style={styles.materialChipDot} />
                  <Text style={styles.materialChipText} numberOfLines={1}>
                    {labels.title}
                  </Text>
                </View>
                {photoUri ? (
                  <Text style={styles.photoVerified} numberOfLines={1}>
                    ✅ {t.md_photo_attached}
                  </Text>
                ) : null}
              </View>

              <Text style={[styles.materialTitle, { fontSize: font(17) }]} numberOfLines={2}>
                {labels.emoji} {labels.title}
              </Text>

              <Text style={styles.materialMeta} numberOfLines={2}>
                {t.md_weight_approx} {weightText} • {t.pe_condition_label}:{' '}
                <Text style={styles.materialMetaStrong}>{conditionText}</Text>
              </Text>

              <Text style={styles.materialLocation} numberOfLines={2}>
                📍 {address || `${city}${stateName ? `, ${stateName}` : ''}`}
              </Text>
            </View>
          </View>

          {/* Baseline market estimate from the backend valuation */}
          <View style={styles.marketPill}>
            <Text style={styles.marketLabel} numberOfLines={1}>
              📈 {t.lq_avg_rate}
            </Text>
            <View style={styles.marketValueCol}>
              <Text style={styles.marketValue}>{formatRupees(marketTotal)}</Text>
              {marketRate > 0 ? (
                <Text style={styles.marketRate} numberOfLines={1}>
                  ({formatRupees(marketRate)}/{lot.weightUnit || 'KG'})
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {quotesState === 'loading' ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={THEME.colors.primary} />
          </View>
        ) : null}

        {quotesState === 'error' ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>📡</Text>
            <Text style={styles.stateTitle}>{t.pe_est_unavailable}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel={t.lq_refresh_btn}
              style={styles.stateButton}
            >
              <Text style={styles.stateButtonText}>↻ {t.lq_refresh_btn}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {quotesState === 'empty' || (quotesState === 'ready' && !quote) ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateIcon}>⏳</Text>
            <Text style={styles.stateTitle}>{t.lq_waiting_title}</Text>
            <Text style={styles.stateDesc}>{t.lq_waiting_desc}</Text>

            {Number(selectedRecycler?.lotRate) > 0 ? (
              <View style={styles.indicativePill}>
                <Text style={styles.indicativeLabel}>{t.lq_indicative_rate}</Text>
                <Text style={styles.indicativeValue}>
                  {formatRupees(selectedRecycler.lotRate)}/{lot.weightUnit || 'KG'}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleRefresh}
              disabled={isRefreshing}
              accessibilityRole="button"
              accessibilityLabel={t.lq_refresh_btn}
              style={[styles.stateButton, isRefreshing && styles.stateButtonBusy]}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.stateButtonText}>↻ {t.lq_refresh_btn}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.stateHint}>{t.lq_no_quote_yet}</Text>
          </View>
        ) : null}
        {quotesState === 'ready' && quote ? (
          <View style={[styles.quoteCard, isAccepted && styles.quoteCardAccepted]}>
            {/* Top quote ribbon */}
            <View style={[styles.quoteRibbon, isAccepted && styles.quoteRibbonAccepted]}>
              <Text style={styles.quoteRibbonText} numberOfLines={1}>
                🏅 {isAccepted ? t.lq_accepted_badge : t.lq_top_quote_badge}
              </Text>
            </View>

            <View style={styles.quoteIdentity}>
              <View style={styles.quoteAuthRow}>
                <View style={styles.quoteAuthDot} />
                <Text style={styles.quoteAuthText} numberOfLines={1}>
                  {t.lq_auth_recycler}
                </Text>
              </View>
              <Text style={[styles.quoteRecyclerName, { fontSize: font(17) }]} numberOfLines={2}>
                {recycler?.facilityName || t.nr_badge_verified}
              </Text>
            </View>

            <View style={styles.quotePillRow}>
              {recyclerDistance ? (
                <View style={styles.quotePill}>
                  <Text style={styles.quotePillText} numberOfLines={1}>
                    📍 {recyclerDistance}
                  </Text>
                </View>
              ) : null}
              {recycler?.authorizationNumber ? (
                <View style={[styles.quotePill, styles.quotePillStrong]}>
                  <Text style={styles.quotePillStrongText} numberOfLines={1}>
                    ✅ {t.lq_cpcb_license}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Offer hero */}
            <View style={styles.offerBox}>
              <View style={styles.offerHeadRow}>
                <Text style={styles.offerLabel} numberOfLines={1}>
                  {t.lq_total_offer}
                </Text>
                {quoteRate != null ? (
                  <Text style={styles.offerRatePill}>
                    {formatRupees(quoteRate)}/{quote.weightUnit || lot.weightUnit || 'KG'}
                  </Text>
                ) : null}
              </View>

              <View style={styles.offerValueRow}>
                <Text style={[styles.offerValue, { fontSize: font(34) }]} numberOfLines={1}>
                  {formatRupees(quoteTotal)}
                </Text>
                {marketTotal > 0 ? (
                  <Text style={styles.offerStrike} numberOfLines={1}>
                    {formatRupees(marketTotal)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.compareBox}>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel} numberOfLines={1}>
                    {t.lq_market_est}
                  </Text>
                  <Text style={styles.compareValue}>{formatRupees(marketTotal)}</Text>
                </View>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel} numberOfLines={1}>
                    {t.lq_recycler_price}
                  </Text>
                  <Text style={[styles.compareValue, styles.compareValueStrong]}>
                    {formatRupees(quoteTotal)}
                  </Text>
                </View>
                <View style={styles.diffRow}>
                  <Text style={styles.diffLabel} numberOfLines={1}>
                    📈 {t.lq_profit_diff}
                  </Text>
                  <Text style={styles.diffValue} numberOfLines={1}>
                    {diff >= 0 ? '+' : '-'}
                    {formatRupees(Math.abs(diff))}
                  </Text>
                </View>
              </View>
            </View>
            {/* Pickup + validity */}
            <View style={styles.logisticsBox}>
              {quote.pickupAvailable ? (
                <View style={styles.logisticsRow}>
                  <Text style={styles.logisticsIcon}>🚚</Text>
                  <View style={styles.logisticsTextCol}>
                    <Text style={styles.logisticsTitle} numberOfLines={2}>
                      {t.lq_pickup_avail}
                    </Text>
                    <Text style={styles.logisticsSub} numberOfLines={2}>
                      {t.lq_pickup_schedule}
                    </Text>
                  </View>
                </View>
              ) : null}

              {quote.validUntil ? (
                <View style={styles.validityRow}>
                  <Text style={styles.validityText} numberOfLines={1}>
                    🕒 {formatShortDate(quote.validUntil)} • {formatClock(quote.validUntil)}
                  </Text>
                  {validityLeft ? (
                    <Text style={styles.validityBadge} numberOfLines={1}>
                      {validityLeft} {t.lq_time_left}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Recycler legal details */}
            <View style={styles.legalBox}>
              <Text style={styles.legalTitle} numberOfLines={1}>
                🏢 {t.lq_legal_details}
              </Text>

              {recycler?.authorizationNumber ? (
                <View style={styles.legalRow}>
                  <Text style={styles.legalKey} numberOfLines={1}>
                    {t.lq_cpcb_auth}
                  </Text>
                  <Text style={styles.legalValue} numberOfLines={1}>
                    {recycler.authorizationNumber}
                  </Text>
                </View>
              ) : null}

              <View style={styles.legalRow}>
                <Text style={styles.legalKey} numberOfLines={1}>
                  {t.lq_plant_address}
                </Text>
                <Text style={[styles.legalValue, styles.legalValueRight]} numberOfLines={2}>
                  {[recycler?.facilityLocation, recycler?.city || city, recycler?.state || stateName]
                    .filter(Boolean)
                    .join(', ') || address}
                </Text>
              </View>

              <View style={styles.legalRow}>
                <Text style={styles.legalKey} numberOfLines={1}>
                  {t.lq_pay_method}
                </Text>
                <Text style={[styles.legalValue, styles.legalValueStrong]} numberOfLines={2}>
                  {t.lq_pay_instant}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Payment guarantee strip */}
        <View style={styles.trustCard}>
          <View style={styles.trustIconTile}>
            <Text style={styles.trustIcon}>🛡️</Text>
          </View>
          <View style={styles.trustTextCol}>
            <Text style={styles.trustTitle} numberOfLines={1}>
              {t.lq_guarantee_title}
            </Text>
            <Text style={styles.trustDesc}>{t.lq_guarantee_desc}</Text>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          disabled={!quote || isAccepted}
          accessibilityRole="button"
          accessibilityLabel={t.lq_cta_accept}
          style={[
            styles.acceptButton,
            { minHeight: scale(54) },
            (!quote || isAccepted) && styles.acceptButtonDisabled
          ]}
        >
          <Text style={[styles.acceptText, { fontSize: font(16) }]} numberOfLines={1}>
            {isAccepted ? `✅ ${t.lq_accepted_badge}` : t.lq_cta_accept}
          </Text>
          {isAccepted ? null : <Text style={styles.acceptArrow}>→</Text>}
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleReject}
            disabled={!quote || isAccepted}
            accessibilityRole="button"
            accessibilityLabel={t.lq_btn_reject}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryText, styles.secondaryTextDanger]} numberOfLines={1}>
              ✕ {t.lq_btn_reject}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCall}
            disabled={!contactPhone}
            accessibilityRole="button"
            accessibilityLabel={t.lq_btn_call}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText} numberOfLines={1}>
              📞 {t.lq_btn_call}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomActionBar>
      {/* Accept confirmation sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingHorizontal: gutter, paddingBottom: scale(28) }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIconTile}>
                <Text style={styles.modalIcon}>🤝</Text>
              </View>
              <Text style={[styles.modalTitle, { fontSize: font(18) }]}>
                {t.lq_modal_title}
              </Text>
              <Text style={styles.modalDesc}>{t.lq_modal_desc}</Text>
            </View>

            <View style={styles.modalSummary}>
              <View style={styles.modalRow}>
                <Text style={styles.modalKey} numberOfLines={1}>
                  {t.lq_modal_material}
                </Text>
                <Text style={styles.modalValue} numberOfLines={1}>
                  {labels.title} • {weightText}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalKey} numberOfLines={1}>
                  {t.lq_modal_final_amount}
                </Text>
                <Text style={styles.modalAmount} numberOfLines={1}>
                  {formatRupees(quoteTotal)}
                </Text>
              </View>
              <View style={[styles.modalRow, styles.modalRowTop]}>
                <Text style={styles.modalKey} numberOfLines={1}>
                  {t.lq_modal_pickup_time}
                </Text>
                <Text style={[styles.modalValue, styles.modalValueStrong]} numberOfLines={2}>
                  {quote?.pickupAvailable ? t.lq_modal_tomorrow : t.nr_pickup_direct}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setConsent((value) => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              accessibilityLabel={t.lq_modal_consent}
              style={styles.consentRow}
            >
              <View style={[styles.consentBox, consent && styles.consentBoxChecked]}>
                {consent ? <Text style={styles.consentTick}>✓</Text> : null}
              </View>
              <Text style={styles.consentText}>{t.lq_modal_consent}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleConfirmAccept}
              disabled={!consent || isAccepting}
              accessibilityRole="button"
              accessibilityLabel={t.lq_modal_confirm_btn}
              style={[
                styles.modalConfirm,
                { minHeight: scale(52) },
                (!consent || isAccepting) && styles.acceptButtonDisabled
              ]}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.modalConfirmText, { fontSize: font(16) }]} numberOfLines={1}>
                  ✅ {t.lq_modal_confirm_btn}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t.lq_modal_cancel_btn}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>{t.lq_modal_cancel_btn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontWeight: '800',
    color: THEME.colors.primary
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    fontSize: 16,
    color: THEME.colors.onSurfaceVariant
  },

  // Scroll body ----------------------------------------------------------
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 12
  },

  // Lot id card ----------------------------------------------------------
  lotIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 16
  },
  lotIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  lotIdIconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceContainer
  },
  lotIdIcon: {
    fontSize: 16
  },
  lotIdTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10
  },
  lotIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: THEME.colors.textMuted
  },
  lotIdValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: THEME.colors.primary,
    marginTop: 1
  },
  copyButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },

  // Material card --------------------------------------------------------
  materialCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 20
  },
  materialTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  thumbEmoji: {
    fontSize: 38
  },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 59, 27, 0.8)'
  },
  thumbBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  materialTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14
  },
  materialBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: 'rgba(177, 242, 190, 0.4)'
  },
  materialChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: THEME.colors.primary
  },
  materialChipText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  photoVerified: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginLeft: 6
  },
  materialTitle: {
    fontWeight: '800',
    color: THEME.colors.onSurface,
    marginTop: 4
  },
  materialMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 3
  },
  materialMetaStrong: {
    fontWeight: '700',
    color: THEME.colors.onSurface
  },
  materialLocation: {
    fontSize: 11,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 5
  },
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceContainerLow
  },
  marketLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginRight: 8
  },
  marketValueCol: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  marketValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  marketRate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginLeft: 5
  },
  // Quote states ---------------------------------------------------------
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    borderRadius: 16
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
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: THEME.colors.primaryContainer
  },
  stateButtonBusy: {
    opacity: 0.85
  },
  stateButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  stateHint: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 10
  },
  indicativePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: 'rgba(124, 249, 148, 0.4)'
  },
  indicativeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginRight: 6
  },
  indicativeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary
  },

  // Quote hero card ------------------------------------------------------
  quoteCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: 'rgba(0, 110, 45, 0.4)',
    borderRadius: 20,
    overflow: 'hidden'
  },
  quoteCardAccepted: {
    borderColor: THEME.colors.secondary
  },
  quoteRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    backgroundColor: THEME.colors.secondary
  },
  quoteRibbonAccepted: {
    backgroundColor: THEME.colors.primaryContainer
  },
  quoteRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  quoteIdentity: {
    paddingRight: 96
  },
  quoteAuthRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quoteAuthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    backgroundColor: THEME.colors.secondary
  },
  quoteAuthText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  quoteRecyclerName: {
    fontWeight: '800',
    lineHeight: 22,
    color: THEME.colors.primary,
    marginTop: 2
  },
  quotePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10
  },
  quotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainer
  },
  quotePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  quotePillStrong: {
    backgroundColor: 'rgba(177, 242, 190, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(150, 213, 163, 1)'
  },
  quotePillStrongText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary
  },

  // Offer box ------------------------------------------------------------
  offerBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 110, 45, 0.2)',
    backgroundColor: 'rgba(124, 249, 148, 0.14)'
  },
  offerHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  offerLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant,
    marginRight: 8
  },
  offerRatePill: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceContainerLowest
  },
  offerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  offerValue: {
    fontWeight: '800',
    letterSpacing: -0.5,
    color: THEME.colors.primary
  },
  offerStrike: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 10
  },
  compareBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 201, 190, 0.4)'
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  compareLabel: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant,
    marginRight: 8
  },
  compareValue: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.onSurface
  },
  compareValueStrong: {
    fontWeight: '800',
    color: THEME.colors.primary
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(98, 223, 125, 1)',
    backgroundColor: 'rgba(124, 249, 148, 0.4)'
  },
  diffLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#007230',
    marginRight: 8
  },
  diffValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007230',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceContainerLowest
  },
  // Logistics + validity ------------------------------------------------
  logisticsBox: {
    marginTop: 12
  },
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.4)',
    backgroundColor: 'rgba(243, 244, 239, 0.7)'
  },
  logisticsIcon: {
    fontSize: 17,
    marginRight: 8
  },
  logisticsTextCol: {
    flex: 1,
    minWidth: 0
  },
  logisticsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  logisticsSub: {
    fontSize: 11,
    lineHeight: 15,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    backgroundColor: 'rgba(255, 251, 235, 0.85)'
  },
  validityText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    marginRight: 8
  },
  validityBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d'
  },

  // Legal details --------------------------------------------------------
  legalBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 201, 190, 0.5)'
  },
  legalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 8
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  legalKey: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginRight: 10
  },
  legalValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    color: THEME.colors.onSurface
  },
  legalValueRight: {
    flex: 1.4,
    fontWeight: '500'
  },
  legalValueStrong: {
    flex: 1.4,
    fontWeight: '700',
    color: THEME.colors.secondary
  },

  // Trust strip ----------------------------------------------------------
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(192, 201, 190, 0.4)',
    backgroundColor: 'rgba(243, 244, 239, 0.7)'
  },
  trustIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(177, 242, 190, 1)'
  },
  trustIcon: {
    fontSize: 19
  },
  trustTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  trustDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },

  // Bottom CTAs ----------------------------------------------------------
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryContainer
  },
  acceptButtonDisabled: {
    opacity: 0.5
  },
  acceptText: {
    fontWeight: '800',
    color: THEME.colors.onPrimary,
    marginHorizontal: 8
  },
  acceptArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary
  },
  secondaryTextDanger: {
    color: THEME.colors.outline
  },
  // Accept confirmation sheet -------------------------------------------
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.outlineVariant
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: THEME.colors.outlineVariant
  },
  modalHeader: {
    alignItems: 'center'
  },
  modalIconTile: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(124, 249, 148, 0.5)'
  },
  modalIcon: {
    fontSize: 22
  },
  modalTitle: {
    fontWeight: '800',
    color: THEME.colors.primary
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 4
  },
  modalSummary: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.outlineVariant,
    backgroundColor: THEME.colors.surfaceContainerLow
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  modalRowTop: {
    marginBottom: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 201, 190, 0.4)'
  },
  modalKey: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.onSurfaceVariant,
    marginRight: 8
  },
  modalValue: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    color: THEME.colors.onSurface
  },
  modalValueStrong: {
    color: THEME.colors.secondary
  },
  modalAmount: {
    flex: 1.2,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    color: THEME.colors.primary
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8
  },
  consentBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: THEME.colors.outline
  },
  consentBoxChecked: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary
  },
  consentTick: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.onPrimary
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.onSurface
  },
  modalConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: THEME.colors.secondary
  },
  modalConfirmText: {
    fontWeight: '800',
    color: THEME.colors.onSecondary
  },
  modalCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  }
});
