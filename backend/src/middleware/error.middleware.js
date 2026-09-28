const ApiResponse = require('../utils/apiResponse');

/**
 * Centralized error handling middleware
 * Handles 400, 401, 403, 404, 409, 422, 500 etc.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose Bad ObjectId CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Mongoose Duplicate Key (409 Conflict)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate resource error: value for field (${field}) already exists.`;
  }

  // Mongoose Validation Error (422)
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Max limit is 5MB.';
    } else {
      message = err.message;
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  return ApiResponse.error(res, message, errors, statusCode);
};

module.exports = errorHandler;
