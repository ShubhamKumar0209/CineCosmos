import express from 'express';
import {
  getTheaters,
  createTheater,
  getTheater,
  addScreen,
} from './theater.controller.js';
import { validate } from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.middleware.js';
import { restrictToAdmin } from '../../middleware/admin.middleware.js';
import {
  createTheaterSchema,
  addScreenSchema,
} from './theater.validation.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

// Public routes (optionally pass token for admin privileges to see inactive theaters)
router.get('/', asyncHandler(getTheaters));
router.get('/:id', asyncHandler(getTheater));

// Admin routes
router.use(protect);
router.use(restrictToAdmin);

router.post('/', validate(createTheaterSchema), asyncHandler(createTheater));
router.post('/:id/screens', validate(addScreenSchema), asyncHandler(addScreen));

export default router;
