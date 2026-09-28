const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to restrict route to specific roles
 * Usage: authorize('COLLECTOR'), authorize('RECYCLER', 'ADMIN')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required before checking roles.', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access forbidden: requires one of [${allowedRoles.join(', ')}] roles. Your role is ${req.user.role}.`,
        [],
        403
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
