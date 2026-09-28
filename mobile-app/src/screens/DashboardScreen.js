import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { THEME, MATERIAL_CATEGORIES } from '../constants/theme';
import ApiService from '../services/api.service';
import { useResponsive } from '../hooks/useResponsive';

export const DashboardScreen = () => {
  const { user, t, earnings, setEarnings, prices, setPrices, setCurrentScreen, isOnline } = useApp();
  const { width, gutter, bottomInset, font, scale } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('HOME'); // 'HOME', 'MY_LOTS', 'EARNINGS', 'PROFILE'

  // The bottom navigation is a fixed, edge-to-edge bar (Stitch). Its real height
  // is derived from the scaled item height plus the device gesture/nav inset, so
  // the scrollable content always reserves exactly enough space underneath.
  const navBarHeight = scale(64) + Math.max(bottomInset, scale(8));

  // Hero card copy must never run under the decorative watermark.
  const heroTextMaxWidth = Math.max(180, width - gutter * 2 - 36 - scale(44));

  // Dynamic user details
  const collectorName = user?.name ? user.name.split(' ')[0] : t.collector_default_name;
  const userCity = user?.location?.city || 'Gorakhpur';
  const userState = user?.location?.state ? (user.location.state === 'Maharashtra' ? 'MH' : 'UP') : 'UP';
  const locationDisplay = `${userCity}, ${userState}`;
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RK';

  // Sample verified benchmark rates matching Stitch
  const marketRates = [
    {
      id: 'pcb',
      title: t.cat_pcb || 'PCB / ई-कचरा',
      icon: '📟',
      price: '₹280',
      change: '↑ 4.2%',
      isUp: true
    },
    {
      id: 'cable',
      title: t.cat_cable || 'कॉपर / केबल तार',
      icon: '🔌',
      price: '₹160',
      change: '↑ 2.1%',
      isUp: true
    },
    {
      id: 'battery',
      title: t.cat_battery || 'Battery / बैटरी',
      icon: '🔋',
      price: '₹95',
      change: '↑ 1.5%',
      isUp: true
    },
    {
      id: 'motor',
      title: t.cat_motor || 'Motor मोटर',
      icon: '⚙️',
      price: '₹110',
      change: '↑ 3.0%',
      isUp: true
    }
  ];

  // Two nearby verified recyclers directly matching Stitch design
  const nearbyRecyclers = [
    {
      id: 'rec_1',
      name: 'Green E-Recyclers',
      distance: '4.2 km',
      pickupAvailable: true,
      maxRate: '₹285/kg',
      materials: ['PCB', 'Cable', 'Battery'],
      verified: true
    },
    {
      id: 'rec_2',
      name: 'Shreeram Eco-Tech',
      distance: '6.5 km',
      pickupAvailable: false,
      tag: 'Spot Payment',
      maxRate: '₹280/kg',
      materials: ['E-Waste & Metals'],
      verified: true
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [earnRes, priceRes] = await Promise.all([
        ApiService.getEarnings(),
        ApiService.getCurrentPrices()
      ]);
      if (earnRes?.success && earnRes.data) {
        setEarnings(earnRes.data);
      }
      if (priceRes?.success && Array.isArray(priceRes.data)) {
        setPrices(priceRes.data);
      }
    } catch (e) {
      console.warn('Dashboard fetch error:', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSellScrap = () => {
    // Phase 3 flow: Dashboard → Material Selection (Screen 05)
    setCurrentScreen('MATERIAL_SELECTION');
  };

  const handleAudioListen = () => {
    Alert.alert('🔊 Audio Guide', `${t.safety_reminder_title}: ${t.safety_reminder_desc}`);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top App Bar / Brand Header (responsive: the location block shrinks
          before the trailing actions, so nothing collides or clips) */}
      <View style={[styles.topHeader, { paddingHorizontal: gutter }]}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationPinIcon}>📍</Text>
          <View style={styles.locationTextCol}>
            <Text style={styles.brandTitleText} numberOfLines={1} ellipsizeMode="tail">
              EcoScrap
            </Text>
            <TouchableOpacity style={styles.locationSubRow} activeOpacity={0.8}>
              <Text style={styles.locationSubText} numberOfLines={1} ellipsizeMode="tail">
                {locationDisplay}
              </Text>
              <Text style={styles.arrowDownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trailing Action: Notification Bell & Collector Avatar */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
        </View>
      </View>

      {/* Main Scrollable Dashboard Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter, paddingBottom: navBarHeight + 24 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDashboardData}
            colors={[THEME.colors.primaryLight]}
            tintColor={THEME.colors.primaryLight}
          />
        }
      >
        {/* Collector Greeting & Online/Sync Status Bar */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <View style={styles.greetingNameRow}>
              <Text style={[styles.greetingText, { fontSize: font(20) }]}>
                {t.welcome}, {collectorName}
              </Text>
              <Text style={styles.waveHand}>👋</Text>
            </View>
            <Text style={styles.greetingSub}>{t.what_to_sell_today}</Text>
          </View>

          {/* Online/Offline Status Pill (wraps below the greeting on narrow
              screens instead of colliding with it) */}
          <View style={styles.syncStatusPill}>
            <View style={styles.syncDotGreen} />
            <Text style={styles.syncStatusText}>
              {isOnline ? t.online_synced : t.offline_mode}
            </Text>
          </View>
        </View>

        {/* 1. PRIMARY ACTION (Strongest Hero Card - Selling Scrap) */}
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.heroCard}
          onPress={handleSellScrap}
        >
          {/* Ambient Background Watermark */}
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Text style={styles.watermarkText}>♻️</Text>
          </View>

          <View style={styles.heroCardContent}>
            {/* Immediate Pickup Badge */}
            <View style={styles.pickupBadge}>
              <Text style={styles.truckIcon}>🚚</Text>
              <Text style={styles.pickupBadgeText}>{t.pickup_available}</Text>
            </View>

            {/* Title & Description */}
            <View style={styles.heroTitleGroup}>
              <View style={styles.heroCameraRow}>
                <Text style={styles.heroCameraIcon}>📷</Text>
                <Text style={[styles.heroMainTitle, { fontSize: font(24) }]}>
                  {t.sell_scrap_title}
                </Text>
              </View>
              <Text style={[styles.heroDesc, { maxWidth: heroTextMaxWidth }]}>
                {t.sell_scrap_desc}
              </Text>
            </View>

            {/* Accessible Large Tap Button */}
            <View style={[styles.heroActionBtn, { minHeight: scale(48) }]}>
              <Text style={styles.addPhotoIcon}>📸</Text>
              <Text style={[styles.heroActionBtnText, { fontSize: font(16) }]}>
                {t.take_photo_action}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. TODAY'S RATES SECTION (“आज के भाव”) */}
        <View style={styles.ratesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📈</Text>
              <Text style={[styles.sectionTitle, { fontSize: font(17) }]}>
                {t.todays_rates_title}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>{t.view_all}</Text>
              <Text style={styles.arrowSmall}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scrollable Rate Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ratesScrollContent}
          >
            {marketRates.map(rate => (
              <View key={rate.id} style={[styles.rateCard, { width: scale(155) }]}>
                <View style={styles.rateCardTop}>
                  <View style={styles.rateIconBox}>
                    <Text style={styles.rateCardIcon}>{rate.icon}</Text>
                  </View>
                  <View style={styles.rateChangePill}>
                    <Text style={styles.rateChangeText}>{rate.change}</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.rateCardTitle} numberOfLines={1}>
                    {rate.title}
                  </Text>
                  <View style={styles.ratePriceRow}>
                    <Text style={styles.ratePrice}>{rate.price}</Text>
                    <Text style={styles.rateUnit}> {t.per_kg}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 3. EARNINGS CARD (“मेरी कमाई”) */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeaderRow}>
            <View style={styles.earningsHeaderLeft}>
              <View style={styles.walletIconBox}>
                <Text style={styles.walletIcon}>👛</Text>
              </View>
              <View style={styles.earningsTitleCol}>
                <Text style={styles.earningsTitle} numberOfLines={2}>
                  {t.my_earnings_title}
                </Text>
                <Text style={styles.earningsSub} numberOfLines={2}>
                  {t.monthly_payout_sub}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ledgerBtn}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen('EARNINGS')}
            >
              <Text style={styles.ledgerBtnText}>{t.view_history_btn}</Text>
              <Text style={styles.ledgerArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.earningsValuesRow}>
            <View style={styles.earningsAmountCol}>
              <Text
                style={[styles.totalEarnedNumber, { fontSize: font(32) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                ₹{earnings?.totalEarned ? earnings.totalEarned.toLocaleString('en-IN') : '4,850'}
              </Text>
              <Text style={styles.earnedSubtext}>{t.sent_to_account}</Text>
            </View>

            <View style={styles.pendingBox}>
              <Text style={styles.hourglassIcon}>⏳</Text>
              <View style={styles.pendingTextCol}>
                <Text style={styles.pendingLabel} numberOfLines={2}>
                  {t.pending_label}
                </Text>
                <Text style={styles.pendingValue}>
                  ₹{earnings?.totalPending ? earnings.totalPending.toLocaleString('en-IN') : '1,200'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. NEARBY AUTHORIZED RECYCLERS (“पास के Authorized Recyclers”) */}
        <View style={styles.recyclersSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🛡️</Text>
              <Text style={[styles.sectionTitle, { fontSize: font(17) }]}>
                {t.nearby_recyclers_title}
              </Text>
            </View>
            <View style={styles.activeRecyclerCountPill}>
              <Text style={styles.activeRecyclerCountText}>
                2 {t.available_count_suffix}
              </Text>
            </View>
          </View>

          {/* Stack of Verified Recycler Cards */}
          <View style={styles.recyclerCardsStack}>
            {nearbyRecyclers.map(rec => (
              <View key={rec.id} style={styles.recyclerCard}>
                <View style={styles.recyclerTopRow}>
                  <View style={styles.recyclerInfoLeft}>
                    <View style={styles.recyclerNameRow}>
                      <View style={styles.activeDot} />
                      <Text style={styles.recyclerName} numberOfLines={1} ellipsizeMode="tail">
                        {rec.name}
                      </Text>
                      <Text style={styles.verifiedCheck}>✓</Text>
                    </View>

                    <View style={styles.recyclerMetaRow}>
                      <Text style={styles.metaDistance}>
                        📍 {rec.distance} {t.away_suffix}
                      </Text>
                      <Text style={styles.metaDivider}>•</Text>
                      {rec.pickupAvailable ? (
                        <Text style={styles.metaPickupGreen}>
                          🚚 {t.pickup_available}
                        </Text>
                      ) : (
                        <Text style={styles.metaSpotPayment}>
                          💳 {rec.tag || 'Spot Payment'}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.rateBadgeBox}>
                    <Text style={styles.rateBadgeText}>
                      {rec.maxRate} {t.up_to}
                    </Text>
                  </View>
                </View>

                {/* Bottom Material Pills & View Action */}
                <View style={styles.recyclerBottomRow}>
                  <View style={styles.materialTagsRow}>
                    {rec.materials.map((mat, idx) => (
                      <View key={idx} style={styles.materialTag}>
                        <Text style={styles.materialTagText}>{mat}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.viewRecyclerBtn,
                      rec.pickupAvailable ? styles.viewRecyclerBtnPrimary : styles.viewRecyclerBtnSecondary
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      Alert.alert(rec.name, `${t.nearby_recyclers_title} - ${rec.maxRate}`);
                    }}
                  >
                    <Text
                      style={[
                        styles.viewRecyclerText,
                        rec.pickupAvailable ? styles.viewRecyclerTextWhite : styles.viewRecyclerTextDark
                      ]}
                    >
                      {t.view_btn}
                    </Text>
                    <Text
                      style={[
                        styles.viewRecyclerArrow,
                        rec.pickupAvailable ? styles.viewRecyclerTextWhite : styles.viewRecyclerTextDark
                      ]}
                    >
                      →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. SAFETY REMINDER CARD (Accessibility for Low-Literacy Informal Collectors) */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyLeftGroup}>
            <View style={styles.safetyWarningBox}>
              <Text style={styles.safetyWarningIcon}>⚠️</Text>
            </View>
            <View style={styles.safetyTextGroup}>
              <Text style={styles.safetyTitle}>{t.safety_reminder_title}</Text>
              <Text style={styles.safetyDesc}>{t.safety_reminder_desc}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.listenAudioBtn}
            activeOpacity={0.85}
            onPress={handleAudioListen}
          >
            <Text style={styles.listenSpeakerIcon}>🔊</Text>
            <Text style={styles.listenBtnText}>{t.listen_btn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 6. FIXED BOTTOM NAVIGATION BAR from Stitch (owns its own gesture-bar
          inset and grows with the label height, so labels never clip) */}
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
        {/* 1. Home */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'HOME' && styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('HOME')}
        >
          <Text style={[styles.navIcon, activeTab === 'HOME' && styles.navIconActive]}>♻️</Text>
          <Text
            style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]}
            numberOfLines={1}
          >
            {t.nav_home}
          </Text>
        </TouchableOpacity>

        {/* 2. My Lots */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'MY_LOTS' && styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('MY_LOTS')}
        >
          <Text style={[styles.navIcon, activeTab === 'MY_LOTS' && styles.navIconActive]}>📦</Text>
          <Text
            style={[styles.navLabel, activeTab === 'MY_LOTS' && styles.navLabelActive]}
            numberOfLines={1}
          >
            {t.nav_my_lots}
          </Text>
        </TouchableOpacity>

        {/* 3. Earnings */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'EARNINGS' && styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setCurrentScreen('EARNINGS')}
        >
          <Text style={[styles.navIcon, activeTab === 'EARNINGS' && styles.navIconActive]}>💳</Text>
          <Text
            style={[styles.navLabel, activeTab === 'EARNINGS' && styles.navLabelActive]}
            numberOfLines={1}
          >
            {t.nav_earnings}
          </Text>
        </TouchableOpacity>

        {/* 4. Profile */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'PROFILE' && styles.navItemActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('PROFILE')}
        >
          <Text style={[styles.navIcon, activeTab === 'PROFILE' && styles.navIconActive]}>👤</Text>
          <Text
            style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}
            numberOfLines={1}
          >
            {t.nav_profile}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    columnGap: 10,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 227, 0.6)'
  },
  locationContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationTextCol: {
    flex: 1,
    minWidth: 0
  },
  locationPinIcon: {
    fontSize: 22,
    marginRight: 8
  },
  brandTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.3
  },
  locationSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1
  },
  locationSubText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  arrowDownIcon: {
    fontSize: 9,
    color: THEME.colors.onSurfaceVariant,
    marginLeft: 3
  },
  headerRightActions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceContainer,
    marginRight: 10,
    position: 'relative'
  },
  bellIcon: {
    fontSize: 17
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.danger,
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#b1f2be',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#96d5a3'
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 16
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 10,
    marginBottom: 16
  },
  greetingLeft: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0
  },
  greetingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  greetingText: {
    flexShrink: 1,
    fontWeight: '800',
    color: THEME.colors.onSurface,
    letterSpacing: -0.3
  },
  waveHand: {
    fontSize: 20,
    marginLeft: 4
  },
  greetingSub: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.onSurfaceVariant,
    marginTop: 2
  },
  syncStatusPill: {
    flexShrink: 0,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  syncDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: THEME.colors.secondary,
    marginRight: 6
  },
  syncStatusText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.secondary
  },
  heroCard: {
    backgroundColor: THEME.colors.primaryContainer,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#003b1b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4
  },
  watermarkContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.12
  },
  watermarkText: {
    fontSize: 120
  },
  heroCardContent: {
    zIndex: 10
  },
  pickupBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10
  },
  truckIcon: {
    fontSize: 12,
    marginRight: 5
  },
  pickupBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  heroTitleGroup: {
    marginBottom: 14
  },
  heroCameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginBottom: 4
  },
  heroCameraIcon: {
    fontSize: 22,
    marginRight: 8
  },
  heroMainTitle: {
    flexShrink: 1,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4
  },
  heroDesc: {
    flexShrink: 1,
    fontSize: 13,
    color: '#b1f2be',
    lineHeight: 18
  },
  heroActionBtn: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#7ffc97',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  addPhotoIcon: {
    flexShrink: 0,
    fontSize: 18,
    marginRight: 8
  },
  heroActionBtnText: {
    flexShrink: 1,
    fontWeight: '800',
    color: '#002109',
    textAlign: 'center'
  },
  ratesSection: {
    marginBottom: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 12
  },
  sectionHeaderLeft: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 6
  },
  sectionTitle: {
    flexShrink: 1,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  viewAllRow: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.secondary,
    marginRight: 3
  },
  arrowSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  ratesScrollContent: {
    paddingRight: 10,
    gap: 12
  },
  rateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  rateCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rateIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rateCardIcon: {
    fontSize: 20
  },
  rateChangePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999
  },
  rateChangeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  rateCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.onSurface,
    marginBottom: 2
  },
  ratePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  ratePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  rateUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.outline
  },
  earningsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  earningsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceContainer,
    paddingBottom: 12,
    marginBottom: 12
  },
  earningsHeaderLeft: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  earningsTitleCol: {
    flexShrink: 1,
    minWidth: 0
  },
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  walletIcon: {
    fontSize: 18
  },
  earningsTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  earningsSub: {
    flexShrink: 1,
    fontSize: 12,
    color: THEME.colors.onSurfaceVariant
  },
  ledgerBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  ledgerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.secondary,
    marginRight: 3
  },
  ledgerArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.secondary
  },
  earningsValuesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 12
  },
  earningsAmountCol: {
    flexShrink: 1,
    minWidth: 0
  },
  totalEarnedNumber: {
    flexShrink: 1,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
    lineHeight: 36
  },
  earnedSubtext: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.outline,
    marginTop: 2
  },
  pendingBox: {
    flexShrink: 0,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14
  },
  hourglassIcon: {
    flexShrink: 0,
    fontSize: 18,
    marginRight: 8
  },
  pendingTextCol: {
    flexShrink: 1,
    minWidth: 0
  },
  pendingLabel: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.outline
  },
  pendingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.onSurface,
    marginTop: 1
  },
  recyclersSection: {
    marginBottom: 20
  },
  activeRecyclerCountPill: {
    flexShrink: 0,
    backgroundColor: THEME.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999
  },
  activeRecyclerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.onSurfaceVariant
  },
  recyclerCardsStack: {
    gap: 12
  },
  recyclerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  recyclerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 8,
    marginBottom: 10
  },
  recyclerInfoLeft: {
    flex: 1,
    minWidth: 0
  },
  recyclerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  activeDot: {
    flexShrink: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.secondary,
    marginRight: 6
  },
  recyclerName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.onSurface
  },
  verifiedCheck: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.secondary,
    marginLeft: 4
  },
  recyclerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  metaDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  metaDivider: {
    fontSize: 12,
    color: THEME.colors.outline,
    marginHorizontal: 5
  },
  metaPickupGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.secondary
  },
  metaSpotPayment: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.outline
  },
  rateBadgeBox: {
    flexShrink: 0,
    backgroundColor: '#b1f2be',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary
  },
  recyclerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceContainer,
    paddingTop: 10
  },
  materialTagsRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  materialTag: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  materialTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.onSurfaceVariant
  },
  viewRecyclerBtn: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewRecyclerBtnPrimary: {
    backgroundColor: THEME.colors.primary
  },
  viewRecyclerBtnSecondary: {
    backgroundColor: THEME.colors.surfaceContainerHigh
  },
  viewRecyclerText: {
    fontSize: 13,
    fontWeight: '800',
    marginRight: 4
  },
  viewRecyclerArrow: {
    fontSize: 13,
    fontWeight: '800'
  },
  viewRecyclerTextWhite: {
    color: '#ffffff'
  },
  viewRecyclerTextDark: {
    color: THEME.colors.onSurface
  },
  safetyCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  safetyLeftGroup: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  safetyWarningBox: {
    flexShrink: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  safetyWarningIcon: {
    fontSize: 20
  },
  safetyTextGroup: {
    flex: 1,
    minWidth: 0
  },
  safetyTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    lineHeight: 18
  },
  safetyDesc: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 2
  },
  listenAudioBtn: {
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  listenSpeakerIcon: {
    fontSize: 16
  },
  listenBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
    marginTop: 1
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 227, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
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