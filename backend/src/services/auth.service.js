const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Recycler = require('../models/Recycler');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { ROLES } = require('../utils/constants');

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        phone: user.phone,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static async register(userData) {
    const { name, phone, password, email, role, preferredLanguage, location, facilityName, authorizationNumber } = userData;

    // Check duplicate phone
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      const error = new Error('A user with this phone number already exists');
      error.statusCode = 409;
      throw error;
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        const error = new Error('A user with this email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      phone,
      email: email || undefined,
      passwordHash,
      role: role || ROLES.COLLECTOR,
      preferredLanguage: preferredLanguage || 'HI',
      location: location || { city: '', state: '', latitude: null, longitude: null }
    });

    await user.save();

    // If registered as RECYCLER, also initialize Recycler profile
    if (user.role === ROLES.RECYCLER) {
      const recycler = new Recycler({
        userId: user._id,
        facilityName: facilityName || `${user.name}'s Recycling Center`,
        city: location?.city || 'Default City',
        state: location?.state || 'Default State',
        coordinates: {
          type: 'Point',
          coordinates: [
            location?.longitude ? parseFloat(location.longitude) : 0,
            location?.latitude ? parseFloat(location.latitude) : 0
          ]
        },
        authorizationNumber: authorizationNumber || `AUTH-${Date.now()}`,
        contactPhone: user.phone,
        contactEmail: user.email || ''
      });
      await recycler.save();
    }

    const token = this.generateToken(user);
    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    return {
      user: userSafe,
      token
    };
  }

  static async login(phone, password) {
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) {
      const error = new Error('Invalid phone number or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account has been deactivated');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid phone number or password');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);
    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    let recyclerProfile = null;
    if (user.role === ROLES.RECYCLER) {
      recyclerProfile = await Recycler.findOne({ userId: user._id });
    }

    return {
      user: userSafe,
      recyclerProfile,
      token
    };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    let recyclerProfile = null;
    if (user.role === ROLES.RECYCLER) {
      recyclerProfile = await Recycler.findOne({ userId: user._id });
    }

    return {
      user,
      recyclerProfile
    };
  }
}

module.exports = AuthService;
