const { AUTHORIZATION_STATUS, MATERIAL_CATEGORIES, WEIGHT_UNITS } = require('../utils/constants');

const seedRecyclers = (createdUsers) => {
  const r1User = createdUsers.find((u) => u.phone === '+919820011111');
  const r2User = createdUsers.find((u) => u.phone === '+919820022222');
  const r3User = createdUsers.find((u) => u.phone === '+919820033333');

  return [
    {
      userId: r1User._id,
      recyclerId: 'REC-2026-000101',
      facilityName: 'EcoGreen E-Waste Solutions',
      facilityLocation: 'Plot 42, Turbhe MIDC, TTC Industrial Area',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      coordinates: {
        type: 'Point',
        coordinates: [73.015, 19.065] // [lng, lat]
      },
      materialsAccepted: [
        MATERIAL_CATEGORIES.PCB,
        MATERIAL_CATEGORIES.CABLE,
        MATERIAL_CATEGORIES.LCD,
        MATERIAL_CATEGORIES.BATTERY
      ],
      authorizationNumber: 'CPCB-MH-EW-2024-0891',
      authorizationType: 'CPCB Authorized E-Waste Dismantler & Recycler',
      authorizationStatus: AUTHORIZATION_STATUS.VERIFIED,
      contactPhone: '+919820011111',
      contactEmail: 'contact@ecogreenrecyclers.com',
      offeredRates: [
        { materialCategory: MATERIAL_CATEGORIES.PCB, ratePerUnit: 290, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.CABLE, ratePerUnit: 170, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.LCD, ratePerUnit: 50, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.BATTERY, ratePerUnit: 100, unit: WEIGHT_UNITS.KG }
      ],
      pickupAvailable: true,
      serviceArea: ['Mumbai', 'Navi Mumbai', 'Thane', 'Raigad'],
      isVerified: true
    },
    {
      userId: r2User._id,
      recyclerId: 'REC-2026-000102',
      facilityName: 'Apex Metal & Battery Dismantlers',
      facilityLocation: 'Shed 12, Kalyan Industrial Estate',
      city: 'Thane',
      state: 'Maharashtra',
      coordinates: {
        type: 'Point',
        coordinates: [73.1355, 19.2437]
      },
      materialsAccepted: [
        MATERIAL_CATEGORIES.BATTERY,
        MATERIAL_CATEGORIES.MOTOR,
        MATERIAL_CATEGORIES.MAGNET,
        MATERIAL_CATEGORIES.CABLE
      ],
      authorizationNumber: 'CPCB-MH-BAT-2023-0144',
      authorizationType: 'CPCB Registered Battery Waste Recycler',
      authorizationStatus: AUTHORIZATION_STATUS.VERIFIED,
      contactPhone: '+919820022222',
      contactEmail: 'info@apexdismantlers.in',
      offeredRates: [
        { materialCategory: MATERIAL_CATEGORIES.BATTERY, ratePerUnit: 105, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.MOTOR, ratePerUnit: 115, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.MAGNET, ratePerUnit: 80, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.CABLE, ratePerUnit: 165, unit: WEIGHT_UNITS.KG }
      ],
      pickupAvailable: true,
      serviceArea: ['Thane', 'Kalyan', 'Dombivli', 'Mumbai Suburban'],
      isVerified: true
    },
    {
      userId: r3User._id,
      recyclerId: 'REC-2026-000103',
      facilityName: 'Maharshi Circular Plastics & Electronics',
      facilityLocation: 'Warehouse 9, Padgha Bypass Road, Bhiwandi',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      coordinates: {
        type: 'Point',
        coordinates: [73.0483, 19.2813]
      },
      materialsAccepted: [
        MATERIAL_CATEGORIES.MIXED_PLASTIC,
        MATERIAL_CATEGORIES.CRT,
        MATERIAL_CATEGORIES.PCB,
        MATERIAL_CATEGORIES.OTHER
      ],
      authorizationNumber: 'CPCB-MH-PL-2024-5521',
      authorizationType: 'State Pollution Control Board Authorized Recycling Facility',
      authorizationStatus: AUTHORIZATION_STATUS.VERIFIED,
      contactPhone: '+919820033333',
      contactEmail: 'support@maharshicircular.org',
      offeredRates: [
        { materialCategory: MATERIAL_CATEGORIES.MIXED_PLASTIC, ratePerUnit: 22, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.CRT, ratePerUnit: 18, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.PCB, ratePerUnit: 275, unit: WEIGHT_UNITS.KG },
        { materialCategory: MATERIAL_CATEGORIES.OTHER, ratePerUnit: 25, unit: WEIGHT_UNITS.KG }
      ],
      pickupAvailable: false,
      serviceArea: ['Bhiwandi', 'Thane', 'Navi Mumbai', 'Mumbai'],
      isVerified: true
    }
  ];
};

module.exports = seedRecyclers;
