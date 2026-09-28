const ApiResponse = require('../utils/apiResponse');

const notFound = (req, res, next) => {
  return ApiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, [], 404);
};

module.exports = notFound;
