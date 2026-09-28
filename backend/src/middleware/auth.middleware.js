const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to verify JWT token and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Access denied. No token provided.', [], 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return ApiResponse.error(res, 'Invalid or expired token.', [], 401);
    }

    const user = await User.findById(decoded.id || decoded.userId).select('-passwordHash');

    if (!user) {
      return ApiResponse.error(res, 'User belonging to this token no longer exists.', [], 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'User account is inactive or disabled.', [], 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Authentication error: ' + error.message, [], 500);
  }
};

module.exports = {
  authenticate
};
