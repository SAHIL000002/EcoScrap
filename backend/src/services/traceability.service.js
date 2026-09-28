const Traceability = require('../models/Traceability');
const { generateHandoverReference } = require('../utils/generateId');
const { TRACEABILITY_STATUS } = require('../utils/constants');

class TraceabilityService {
  /**
   * Create a permanent handover / traceability record
   * Demonstrating: WHO, WHAT, HOW MUCH, WHEN, WHERE, TO WHOM, FOR HOW MUCH (Section 12)
   */
  static async createHandoverRecord({
    lotId,
    transactionId,
    collectorId,
    recyclerId,
    photos = [],
    weight,
    weightUnit = 'KG',
    gpsLocation = {},
    collectionLocation = {},
    handoverLocation = {},
    collectorNotes = '',
    recyclerNotes = ''
  }) {
    const handoverReference = generateHandoverReference();

    const traceability = new Traceability({
      traceabilityId: handoverReference,
      lotId,
      transactionId,
      collectorId,
      recyclerId,
      photos,
      weight,
      weightUnit,
      timestamp: new Date(),
      gpsLocation: {
        latitude: gpsLocation.latitude || null,
        longitude: gpsLocation.longitude || null,
        coordinates: {
          type: 'Point',
          coordinates: [
            gpsLocation.longitude ? parseFloat(gpsLocation.longitude) : 0,
            gpsLocation.latitude ? parseFloat(gpsLocation.latitude) : 0
          ]
        }
      },
      collectionLocation,
      handoverLocation,
      handoverReference,
      collectorConfirmation: {
        confirmed: true,
        confirmedAt: new Date(),
        notes: collectorNotes
      },
      recyclerConfirmation: {
        confirmed: true,
        confirmedAt: new Date(),
        notes: recyclerNotes
      },
      status: TRACEABILITY_STATUS.VERIFIED
    });

    return await traceability.save();
  }

  static async getByLotId(lotId) {
    const query = /^[0-9a-fA-F]{24}$/.test(lotId) ? { lotId } : { handoverReference: lotId };
    return await Traceability.findOne(query)
      .populate('lotId')
      .populate('transactionId')
      .populate('collectorId', 'name phone email preferredLanguage')
      .populate('recyclerId', 'facilityName authorizationNumber contactPhone city state');
  }

  static async getByHandoverReference(reference) {
    return await Traceability.findOne({ handoverReference: reference })
      .populate('lotId')
      .populate('transactionId')
      .populate('collectorId', 'name phone email')
      .populate('recyclerId', 'facilityName authorizationNumber contactPhone');
  }
}

module.exports = TraceabilityService;
