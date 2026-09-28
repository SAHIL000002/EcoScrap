const bcrypt = require('bcryptjs');
const { ROLES, LANGUAGES } = require('../utils/constants');

const seedUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', salt);

  return [
    // 1 Admin
    {
      userId: 'USR-2026-000001',
      name: 'Admin Supervisor',
      phone: '+919999900001',
      email: 'admin@kabadiwalaconnect.org',
      passwordHash: defaultPasswordHash,
      role: ROLES.ADMIN,
      preferredLanguage: LANGUAGES.EN,
      operatingLocation: 'HQ Central',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.076,
        longitude: 72.8777,
        coordinates: { type: 'Point', coordinates: [72.8777, 19.076] }
      },
      isActive: true
    },
    // Collector 1
    {
      userId: 'USR-2026-000002',
      name: 'Ramesh Kumar',
      phone: '+919876543210',
      email: 'ramesh.collector@example.com',
      passwordHash: defaultPasswordHash,
      role: ROLES.COLLECTOR,
      preferredLanguage: LANGUAGES.HI,
      operatingLocation: 'Dharavi Sector 3',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0435,
        longitude: 72.8567,
        coordinates: { type: 'Point', coordinates: [72.8567, 19.0435] }
      },
      isActive: true
    },
    // Collector 2
    {
      userId: 'USR-2026-000003',
      name: 'Suresh Patil',
      phone: '+919876543211',
      email: 'suresh.collector@example.com',
      passwordHash: defaultPasswordHash,
      role: ROLES.COLLECTOR,
      preferredLanguage: LANGUAGES.MR,
      operatingLocation: 'Kurla West Scrap Market',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        latitude: 19.0688,
        longitude: 72.8797,
        coordinates: { type: 'Point', coordinates: [72.8797, 19.0688] }
      },
      isActive: true
    },
    // Recycler 1 User
    {
      userId: 'USR-2026-000004',
      name: 'EcoGreen E-Waste Solutions',
      phone: '+919820011111',
      email: 'contact@ecogreenrecyclers.com',
      passwordHash: defaultPasswordHash,
      role: ROLES.RECYCLER,
      preferredLanguage: LANGUAGES.EN,
      operatingLocation: 'Turbhe MIDC, Navi Mumbai',
      location: {
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        latitude: 19.065,
        longitude: 73.015,
        coordinates: { type: 'Point', coordinates: [73.015, 19.065] }
      },
      isActive: true
    },
    // Recycler 2 User
    {
      userId: 'USR-2026-000005',
      name: 'Apex Metal & Battery Dismantlers',
      phone: '+919820022222',
      email: 'info@apexdismantlers.in',
      passwordHash: defaultPasswordHash,
      role: ROLES.RECYCLER,
      preferredLanguage: LANGUAGES.HI,
      operatingLocation: 'Kalyan Industrial Area',
      location: {
        city: 'Thane',
        state: 'Maharashtra',
        latitude: 19.2437,
        longitude: 73.1355,
        coordinates: { type: 'Point', coordinates: [73.1355, 19.2437] }
      },
      isActive: true
    },
    // Recycler 3 User
    {
      userId: 'USR-2026-000006',
      name: 'Maharshi Circular Plastics & Electronics',
      phone: '+919820033333',
      email: 'support@maharshicircular.org',
      passwordHash: defaultPasswordHash,
      role: ROLES.RECYCLER,
      preferredLanguage: LANGUAGES.MR,
      operatingLocation: 'Bhiwandi Logistics Hub',
      location: {
        city: 'Bhiwandi',
        state: 'Maharashtra',
        latitude: 19.2813,
        longitude: 73.0483,
        coordinates: { type: 'Point', coordinates: [73.0483, 19.2813] }
      },
      isActive: true
    }
  ];
};

module.exports = seedUsers;
