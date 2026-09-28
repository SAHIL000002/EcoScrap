const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await AuthService.register(req.body);
  return ApiResponse.success(res, 'User registered successfully', result, 201);
});

const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const result = await AuthService.login(phone, password);
  return ApiResponse.success(res, 'Login successful', result, 200);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await AuthService.getMe(req.user._id);
  return ApiResponse.success(res, 'User details retrieved', result, 200);
});

module.exports = {
  register,
  login,
  getMe
};
