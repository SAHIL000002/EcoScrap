import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../i18n/translations';
import ApiService from '../services/api.service';
import StorageUtil from '../services/storage.service';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('HI');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // App domain state
  const [earnings, setEarnings] = useState({ totalEarned: 3770, pendingPayout: 1250, activeLotsCount: 3 });
  const [lots, setLots] = useState([]);
  const [prices, setPrices] = useState([]);
  
  // Navigation State strictly within approved 12 Stitch screens
  const [currentScreen, setCurrentScreen] = useState('SPLASH'); 
  const [selectedLot, setSelectedLot] = useState(null);

  // Phase 3 lot-creation workflow state (Screen 05 → Screen 06 → …).
  // Holds the backend material category enum value (e.g. 'PCB'), never a label.
  // It is intentionally local/temporary: no lot is written to the backend until
  // the collector finishes the weight + photo + price estimate steps.
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Phase 4/5 lot-creation workflow state (Screen 06 → 07) and Phase 5
  // recycler/quote state (Screen 08 → 09).
  //
  // `lotDraft` keeps the details the collector is still editing on-device.
  // Nothing is written to the backend while drafting: the single POST happens
  // on Screen 06's "कीमत देखें" CTA so the backend ValuationService (and only the
  // backend) decides the money values stored in `createdLot` / `priceEstimate`.
  const [lotDraft, setLotDraft] = useState(null);
  const [createdLot, setCreatedLot] = useState(null);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [selectedRecycler, setSelectedRecycler] = useState(null);
  const [lotQuotes, setLotQuotes] = useState([]);
  const [deviceLocation, setDeviceLocation] = useState(null);

  // Clears everything the lot → quote journey produced. Called when the
  // collector starts a brand new lot from Screen 05.
  const resetLotWorkflow = () => {
    setCreatedLot(null);
    setPriceEstimate(null);
    setSelectedRecycler(null);
    setLotQuotes([]);
  };

  const t = translations[language] || translations.HI;

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const savedLang = await StorageUtil.getItem('kc_lang');
      if (savedLang && translations[savedLang]) {
        setLanguage(savedLang);
      }

      const savedToken = await StorageUtil.getSecure('kc_token');
      const savedUser = await StorageUtil.getItem('kc_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Session restore error:', e.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const changeLanguage = async (newLang) => {
    if (!translations[newLang]) return;
    setLanguage(newLang);
    try {
      await StorageUtil.setItem('kc_lang', newLang);
    } catch (e) {
      console.warn('Failed to persist language:', e.message);
    }
  };

  const login = async (phone, password = 'Password@123') => {
    setIsLoading(true);
    try {
      const res = await ApiService.login(phone, password);
      setIsLoading(false);

      if (res && res.success && res.data) {
        const loggedInUser = res.data.user;
        const authToken = res.data.token;

        setUser(loggedInUser);
        setToken(authToken);

        // Store secure token & local user state
        await StorageUtil.saveSecure('kc_token', authToken);
        await StorageUtil.setItem('kc_user', JSON.stringify(loggedInUser));

        if (loggedInUser.preferredLanguage && translations[loggedInUser.preferredLanguage]) {
          changeLanguage(loggedInUser.preferredLanguage);
        }

        setCurrentScreen('DASHBOARD');
        return { success: true };
      }

      // If backend responded with error
      if (res && res.message && !res.isOffline) {
        return { success: false, message: res.message };
      }

      // Fallback for offline mode or network error during demo
      if (phone === '+919876543210' || phone === '9876543210') {
        const mockCollector = {
          _id: 'mock_collector_1',
          name: 'Ramesh Kumar (कलेक्टर)',
          phone: '+919876543210',
          role: 'COLLECTOR',
          preferredLanguage: language,
          location: { city: 'Mumbai', state: 'Maharashtra', latitude: 19.0435, longitude: 72.8567 }
        };
        setUser(mockCollector);
        setToken('mock_jwt_token_collector');
        await StorageUtil.saveSecure('kc_token', 'mock_jwt_token_collector');
        await StorageUtil.setItem('kc_user', JSON.stringify(mockCollector));
        setCurrentScreen('DASHBOARD');
        return { success: true };
      }

      return {
        success: false,
        isOffline: res?.isOffline || false,
        message: res?.message || t.login_failed_err || 'लॉगिन असफल रहा'
      };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        message: err.message || t.network_err || 'सर्वर त्रुटि'
      };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await StorageUtil.removeSecure('kc_token');
      await StorageUtil.removeItem('kc_user');
    } catch (e) {
      // ignore
    }
    setCurrentScreen('LOGIN');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        user,
        token,
        isLoading,
        isInitializing,
        isOnline,
        setIsOnline,
        earnings,
        setEarnings,
        lots,
        setLots,
        prices,
        setPrices,
        currentScreen,
        setCurrentScreen,
        selectedLot,
        setSelectedLot,
        selectedMaterial,
        setSelectedMaterial,
        lotDraft,
        setLotDraft,
        createdLot,
        setCreatedLot,
        priceEstimate,
        setPriceEstimate,
        selectedRecycler,
        setSelectedRecycler,
        lotQuotes,
        setLotQuotes,
        deviceLocation,
        setDeviceLocation,
        resetLotWorkflow,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);