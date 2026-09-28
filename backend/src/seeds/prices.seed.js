const { MATERIAL_CATEGORIES, WEIGHT_UNITS } = require('../utils/constants');

const seedPrices = () => {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  return [
    // Historical prices (30 days ago) - Rule 7 preserved
    {
      materialCategory: MATERIAL_CATEGORIES.PCB,
      materialSubCategory: 'Motherboards & Telecom Green PCB',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 260,
      sellingPrice: 285,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(60),
      validUntil: daysAgo(30),
      source: 'Benchmark Index v1',
      isActive: false
    },
    {
      materialCategory: MATERIAL_CATEGORIES.PCB,
      materialSubCategory: 'Motherboards & Telecom Green PCB',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 275,
      sellingPrice: 300,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(30),
      validUntil: daysAgo(5),
      source: 'Benchmark Index v2',
      isActive: false
    },
    // Current active PCB
    {
      materialCategory: MATERIAL_CATEGORIES.PCB,
      materialSubCategory: 'Motherboards & Telecom Green PCB',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 280,
      sellingPrice: 310,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(5),
      validUntil: null,
      source: 'CPCB Recycler Aggregation',
      isActive: true
    },
    // CABLE historical and current
    {
      materialCategory: MATERIAL_CATEGORIES.CABLE,
      materialSubCategory: 'Copper Insulated Wires',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 145,
      sellingPrice: 165,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(30),
      validUntil: daysAgo(7),
      source: 'Benchmark Index v1',
      isActive: false
    },
    {
      materialCategory: MATERIAL_CATEGORIES.CABLE,
      materialSubCategory: 'Copper Insulated Wires',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 160,
      sellingPrice: 180,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(7),
      validUntil: null,
      source: 'Market Benchmark',
      isActive: true
    },
    // BATTERY historical and current
    {
      materialCategory: MATERIAL_CATEGORIES.BATTERY,
      materialSubCategory: 'Lead Acid & Li-ion Packs',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 85,
      sellingPrice: 100,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(30),
      validUntil: daysAgo(10),
      source: 'Benchmark Index v1',
      isActive: false
    },
    {
      materialCategory: MATERIAL_CATEGORIES.BATTERY,
      materialSubCategory: 'Lead Acid & Li-ion Packs',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 95,
      sellingPrice: 110,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(10),
      validUntil: null,
      source: 'Authorized Battery Aggregators',
      isActive: true
    },
    // LCD
    {
      materialCategory: MATERIAL_CATEGORIES.LCD,
      materialSubCategory: 'Monitors & Flat Screen Displays',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 40,
      sellingPrice: 55,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(30),
      validUntil: daysAgo(3),
      source: 'Benchmark Index v1',
      isActive: false
    },
    {
      materialCategory: MATERIAL_CATEGORIES.LCD,
      materialSubCategory: 'Monitors & Flat Screen Displays',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 45,
      sellingPrice: 60,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(3),
      validUntil: null,
      source: 'Market Benchmark',
      isActive: true
    },
    // MOTOR
    {
      materialCategory: MATERIAL_CATEGORIES.MOTOR,
      materialSubCategory: 'Copper Wound Electric Motors & Pumps',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 110,
      sellingPrice: 130,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(15),
      validUntil: null,
      source: 'Market Benchmark',
      isActive: true
    },
    // MIXED_PLASTIC
    {
      materialCategory: MATERIAL_CATEGORIES.MIXED_PLASTIC,
      materialSubCategory: 'E-Waste ABS/HIPS Rigid Casing Plastics',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 18,
      sellingPrice: 26,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(20),
      validUntil: null,
      source: 'Plastic Dismantler Exchange',
      isActive: true
    },
    // MAGNET
    {
      materialCategory: MATERIAL_CATEGORIES.MAGNET,
      materialSubCategory: 'Ferrite and Neodymium speaker/hard-drive magnets',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 75,
      sellingPrice: 95,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(20),
      validUntil: null,
      source: 'Market Benchmark',
      isActive: true
    },
    // CRT
    {
      materialCategory: MATERIAL_CATEGORIES.CRT,
      materialSubCategory: 'Cathode Ray Tubes Glass & Housing',
      city: 'Mumbai',
      state: 'Maharashtra',
      buyingPrice: 15,
      sellingPrice: 22,
      unit: WEIGHT_UNITS.KG,
      validFrom: daysAgo(20),
      validUntil: null,
      source: 'Hazardous Waste Safe Handler',
      isActive: true
    }
  ];
};

module.exports = seedPrices;
