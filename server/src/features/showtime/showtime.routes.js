import express from 'express';
import {
  createShowtime,
  getShowtimes,
  getShowtime,
  getSeats,
} from './showtime.controller.js';
import { validate } from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.middleware.js';
import { restrictToAdmin } from '../../middleware/admin.middleware.js';
import { createShowtimeSchema } from './showtime.validation.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

// Public routes
router.get('/', asyncHandler(getShowtimes));
router.get('/:id', asyncHandler(getShowtime));
router.get('/:id/seats', asyncHandler(getSeats));

// Admin routes
router.post(
  '/',
  protect,
  restrictToAdmin,
  validate(createShowtimeSchema),
  asyncHandler(createShowtime)
);

export default router;
