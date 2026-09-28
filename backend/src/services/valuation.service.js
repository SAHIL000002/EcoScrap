const PriceService = require('./price.service');

class ValuationService {
  /**
   * MVP Valuation Logic:
   * estimatedValue = approxWeight × currentPricePerUnit
   *
   * Also calculate:
   * estimatedMinValue (e.g. -10% variance for lower grade condition)
   * estimatedMaxValue (e.g. +10% variance for prime condition)
   *
   * Returns:
   * {
   *   pricePerUnit,
   *   unit,
   *   estimatedValue,
   *   estimatedMinValue,
   *   estimatedMaxValue
   * }
   */
  static async calculateValuation({ category, approxWeight, city = null, state = null, condition = 'USED' }) {
    const weight = parseFloat(approxWeight);
    if (isNaN(weight) || weight <= 0) {
      throw new Error('Valid positive approximate weight is required for valuation');
    }

    // Look up current benchmark price
    const priceRecord = await PriceService.getCurrentPrice(category, city, state);

    // Fallback default unit rates if seed / record not yet in DB
    const fallbackRates = {
      PCB: 280,
      BATTERY: 95,
      CABLE: 160,
      LCD: 45,
      MOTOR: 110,
      MAGNET: 75,
      MIXED_PLASTIC: 18,
      CRT: 15,
      OTHER: 20
    };

    const pricePerUnit = priceRecord ? priceRecord.buyingPrice : (fallbackRates[category] || 25);
    const unit = priceRecord ? priceRecord.unit : 'KG';

    // Base estimated value
    let baseValue = Math.round(weight * pricePerUnit);

    // Condition multiplier
    let conditionMultiplier = 1.0;
    if (condition === 'GOOD') conditionMultiplier = 1.05;
    else if (condition === 'DAMAGED') conditionMultiplier = 0.9;
    else if (condition === 'MIXED') conditionMultiplier = 0.95;

    const adjustedValue = Math.round(baseValue * conditionMultiplier);

    // Min & Max range (e.g. ~8% spread)
    const estimatedMinValue = Math.max(0, Math.round(adjustedValue * 0.92));
    const estimatedMaxValue = Math.round(adjustedValue * 1.08);

    return {
      pricePerUnit,
      unit,
      estimatedValue: adjustedValue,
      estimatedMinValue,
      estimatedMaxValue
    };
  }
}

module.exports = ValuationService;
