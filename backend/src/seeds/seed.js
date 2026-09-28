const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Recycler = require('../models/Recycler');
const Price = require('../models/Price');
const SafetyGuide = require('../models/SafetyGuide');
const MaterialLot = require('../models/MaterialLot');
const Transaction = require('../models/Transaction');
const Traceability = require('../models/Traceability');

const seedUsers = require('./users.seed');
const seedRecyclers = require('./recyclers.seed');
const seedPrices = require('./prices.seed');
const seedSafetyGuides = require('./safety.seed');

const runSeed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Cleaning old seed collections...');
    await Promise.all([
      User.deleteMany({}),
      Recycler.deleteMany({}),
      Price.deleteMany({}),
      SafetyGuide.deleteMany({}),
      MaterialLot.deleteMany({}),
      Transaction.deleteMany({}),
      Traceability.deleteMany({})
    ]);

    // 1. Seed Users (1 Admin, 2 Collectors, 3 Recyclers)
    console.log('[Seed] Seeding Users...');
    const usersData = await seedUsers();
    const createdUsers = await User.insertMany(usersData);
    console.log(`[Seed] Seeded ${createdUsers.length} users successfully.`);

    // 2. Seed Recycler Profiles
    console.log('[Seed] Seeding Recycler Profiles...');
    const recyclersData = seedRecyclers(createdUsers);
    const createdRecyclers = await Recycler.insertMany(recyclersData);
    console.log(`[Seed] Seeded ${createdRecyclers.length} verified recyclers successfully.`);

    // 3. Seed Prices
    console.log('[Seed] Seeding Benchmark & Historical Prices...');
    const pricesData = seedPrices();
    const createdPrices = await Price.insertMany(pricesData);
    console.log(`[Seed] Seeded ${createdPrices.length} price records successfully.`);

    // 4. Seed Safety Guides (Hindi, Marathi, English)
    console.log('[Seed] Seeding Safety Guides...');
    const safetyData = seedSafetyGuides();
    const createdSafety = await SafetyGuide.insertMany(safetyData);
    console.log(`[Seed] Seeded ${createdSafety.length} safety guide records successfully.`);

    console.log('====================================================');
    console.log('✅ Kabadiwala Connect Database Seed Completed Successfully!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

runSeed();
