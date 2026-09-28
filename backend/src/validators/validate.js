const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return ApiResponse.error(res, 'Validation failed', errorMessages, 422);
  }
  next();
};

module.exports = validate;
