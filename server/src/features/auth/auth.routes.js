import express from 'express';
import { register, login, logout, refresh, getMe } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/logout', logout);
router.post('/refresh', asyncHandler(refresh));

// Protected routes
router.use(protect);

router.get('/me', getMe);

export default router;
