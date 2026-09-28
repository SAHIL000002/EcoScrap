const Recycler = require('../models/Recycler');
const { AUTHORIZATION_STATUS } = require('../utils/constants');

class RecyclerService {
  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  static async findMatchingRecyclers({
    category = null,
    latitude = null,
    longitude = null,
    city = null,
    maxDistanceKm = 50
  }) {
    const baseQuery = {
      authorizationStatus: AUTHORIZATION_STATUS.VERIFIED
    };

    if (category) {
      baseQuery.materialsAccepted = category;
    }

    const verifiedRecyclers = await Recycler.find(baseQuery).lean();

    const scoredRecyclers = verifiedRecyclers.map((rec) => {
      let score = 0;
      const scoreBreakdown = {};

      if (rec.pickupAvailable) {
        score += 20;
        scoreBreakdown.pickup = 20;
      }

      let distanceKm = null;
      if (
        latitude != null &&
        longitude != null &&
        rec.coordinates &&
        rec.coordinates.coordinates &&
        rec.coordinates.coordinates.length === 2 &&
        (rec.coordinates.coordinates[0] !== 0 || rec.coordinates.coordinates[1] !== 0)
      ) {
        const [recLng, recLat] = rec.coordinates.coordinates;
        distanceKm = RecyclerService.calculateDistanceKm(latitude, longitude, recLat, recLng);

        if (distanceKm !== null) {
          if (distanceKm <= 15) {
            score += 30;
            scoreBreakdown.distance = 30;
          } else if (distanceKm <= 30) {
            score += 20;
            scoreBreakdown.distance = 20;
          } else if (distanceKm <= 60) {
            score += 10;
            scoreBreakdown.distance = 10;
          }
        }
      }

      if (city && rec.serviceArea && rec.serviceArea.length > 0) {
        const match = rec.serviceArea.some(
          (area) => area.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(area.toLowerCase())
        );
        if (match || (rec.city && rec.city.toLowerCase() === city.toLowerCase())) {
          score += 20;
          scoreBreakdown.serviceArea = 20;
        }
      } else if (city && rec.city && rec.city.toLowerCase() === city.toLowerCase()) {
        score += 20;
        scoreBreakdown.serviceArea = 20;
      }

      if (category && rec.offeredRates && rec.offeredRates.length > 0) {
        const rateObj = rec.offeredRates.find((r) => r.materialCategory === category);
        if (rateObj && rateObj.ratePerUnit > 0) {
          score += 30;
          scoreBreakdown.rate = 30;
        }
      } else if (rec.offeredRates && rec.offeredRates.length > 0) {
        score += 15;
        scoreBreakdown.rate = 15;
      }

      return {
        ...rec,
        distanceKm,
        matchScore: score,
        scoreBreakdown
      };
    });

    let filtered = scoredRecyclers;
    if (latitude != null && longitude != null && maxDistanceKm) {
      filtered = scoredRecyclers.filter((r) => r.distanceKm === null || r.distanceKm <= maxDistanceKm);
    }

    filtered.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

    return filtered;
  }

  static async getNearbyRecyclers({ lat, lng, radiusKm = 50, category = null }) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    return await RecyclerService.findMatchingRecyclers({
      category,
      latitude,
      longitude,
      maxDistanceKm: radius
    });
  }

  static async getRecyclerById(id) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { recyclerId: id };
    const recycler = await Recycler.findOne(query).populate('userId', 'name phone email preferredLanguage');
    return recycler;
  }

  static async getRecyclerByUserId(userId) {
    return await Recycler.findOne({ userId });
  }

  static async updateProfile(userId, updateData) {
    const recycler = await Recycler.findOne({ userId });
    if (!recycler) {
      const error = new Error('Recycler profile not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.latitude != null && updateData.longitude != null) {
      recycler.coordinates = {
        type: 'Point',
        coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
      };
    }

    const fields = [
      'facilityName',
      'facilityLocation',
      'city',
      'state',
      'materialsAccepted',
      'contactPhone',
      'contactEmail',
      'offeredRates',
      'pickupAvailable',
      'serviceArea'
    ];

    fields.forEach((field) => {
      if (updateData[field] !== undefined) {
        recycler[field] = updateData[field];
      }
    });

    return await recycler.save();
  }
}

module.exports = RecyclerService;

