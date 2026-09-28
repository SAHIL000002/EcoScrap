import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/theme';

class ApiService {
  static async request(endpoint, options = {}) {
    let token = null;
    try {
      token = await AsyncStorage.getItem('kc_token');
    } catch (e) {
      // ignore
    }

    // `isFormData` must not be forwarded to fetch(), and a FormData body must
    // keep the multipart boundary that React Native generates on its own, so
    // the JSON Content-Type is skipped for those requests.
    const { isFormData = false, ...fetchOptions } = options;

    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {})
    };

    const config = {
      ...fetchOptions,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`[API Network Error on ${endpoint}]:`, error.message);
      return { success: false, message: 'Network request failed. Operating in offline/cache mode.', isOffline: true };
    }
  }

  // Auth
  static login(phone, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
  }

  static getMe() {
    return this.request('/auth/me');
  }

  // Prices
  static getCurrentPrices(category = null) {
    let url = '/prices/current';
    if (category) url += `?materialCategory=${category}`;
    return this.request(url);
  }

  static getPriceHistory(category, limit = 7) {
    return this.request(`/prices/history?materialCategory=${category}&limit=${limit}`);
  }

  static getPriceByCategory(category) {
    return this.request(`/prices/${category}`);
  }

  // Lots
  static getMyLots() {
    return this.request('/lots/my');
  }

  static getLotById(lotId) {
    return this.request(`/lots/${lotId}`);
  }

  static createLot(lotData) {
    return this.request('/lots', {
      method: 'POST',
      body: JSON.stringify(lotData)
    });
  }

  /**
   * Multipart lot creation — used when the collector attaches a photo.
   * `POST /lots` runs multer `upload.array('images', 5)` + the same validators,
   * so every textual field travels as a form field and the photo as `images`.
   * The backend (ValuationService) is the single source of truth for the price.
   */
  static createLotMultipart(formData) {
    return this.request('/lots', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  static updateLot(lotId, updateData) {
    return this.request(`/lots/${lotId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  static getLotQuotes(lotId) {
    return this.request(`/lots/${lotId}/quotes`);
  }

  static requestRecyclerQuote(lotId, quoteData = {}) {
    // When collector requests quote from a specific recycler
    return this.request(`/lots/${lotId}/quote`, {
      method: 'POST',
      body: JSON.stringify(quoteData)
    });
  }

  // Recyclers
  static getNearbyRecyclers(lat = 19.0435, lng = 72.8567, category = null, radiusKm = 50) {
    let url = `/recyclers/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`;
    if (category) url += `&category=${category}`;
    return this.request(url);
  }

  static getRecyclers(params = {}) {
    let url = '/recyclers';
    const query = new URLSearchParams(params).toString();
    if (query) url += `?${query}`;
    return this.request(url);
  }

  static getRecyclerById(recyclerId) {
    return this.request(`/recyclers/${recyclerId}`);
  }

  // Quotes & Transactions
  static respondToQuote(quoteId, action) {
    return this.request(`/quotes/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  }

  static acceptQuote(quoteId) {
    return this.respondToQuote(quoteId, 'ACCEPT');
  }

  static rejectQuote(quoteId) {
    return this.respondToQuote(quoteId, 'REJECT');
  }

  static getMyTransactions() {
    return this.request('/transactions/my');
  }

  static getEarnings() {
    return this.request('/users/me/earnings');
  }

  // Traceability
  static getTraceability(lotId) {
    return this.request(`/traceability/${lotId}`);
  }

  // Safety
  static getSafetyGuides(language = 'HI') {
    return this.request(`/safety?language=${language}`);
  }
}

export default ApiService;

