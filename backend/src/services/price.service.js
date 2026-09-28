const Price = require('../models/Price');

class PriceService {
  /**
   * Get current active price for a material category and optionally location
   */
  static async getCurrentPrice(category, city = null, state = null) {
    const query = {
      materialCategory: category,
      isActive: true
    };

    if (city) {
      // First try matching city
      const cityPrice = await Price.findOne({ ...query, city: new RegExp(`^${city}$`, 'i') }).sort({ createdAt: -1 });
      if (cityPrice) return cityPrice;
    }

    if (state) {
      // Then try matching state
      const statePrice = await Price.findOne({ ...query, state: new RegExp(`^${state}$`, 'i') }).sort({ createdAt: -1 });
      if (statePrice) return statePrice;
    }

    // Default to latest active benchmark for that category
    const generalPrice = await Price.findOne(query).sort({ createdAt: -1 });
    return generalPrice;
  }

  /**
   * Query prices with optional filters
   */
  static async getPrices(filters = {}) {
    const query = {};

    if (filters.materialCategory) {
      query.materialCategory = filters.materialCategory;
    }
    if (filters.city) {
      query.city = new RegExp(filters.city, 'i');
    }
    if (filters.state) {
      query.state = new RegExp(filters.state, 'i');
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    return await Price.find(query).sort({ createdAt: -1 });
  }

  /**
   * Query price history for a category or across all
   */
  static async getPriceHistory(category = null, limit = 50) {
    const query = {};
    if (category) {
      query.materialCategory = category;
    }
    return await Price.find(query).sort({ validFrom: -1, createdAt: -1 }).limit(Number(limit));
  }

  /**
   * Create new price record while preserving historical records (Rule 7)
   */
  static async createPrice(priceData) {
    // When creating a new active price for category + city/state, mark previous current price validUntil to now
    if (priceData.isActive !== false) {
      await Price.updateMany(
        {
          materialCategory: priceData.materialCategory,
          city: priceData.city || 'General',
          isActive: true
        },
        {
          $set: {
            isActive: false,
            validUntil: new Date()
          }
        }
      );
    }

    const price = new Price({
      ...priceData,
      validFrom: priceData.validFrom || new Date(),
      isActive: priceData.isActive !== undefined ? priceData.isActive : true
    });

    return await price.save();
  }
}

module.exports = PriceService;
