import express from 'express';
import { getAllCities, createCity } from './city.controller.js';
import { validate } from '../../middleware/validate.js';
import { protect } from '../../middleware/auth.middleware.js';
import { restrictToAdmin } from '../../middleware/admin.middleware.js';
import { createCitySchema } from './city.validation.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

// Public route to get cities (optionally use protect to extract req.user if logged in, but not block)
// We'll use a custom middleware to just populate req.user if token exists, without erroring if not.
// For now, let's keep it simple: public users only get active cities. 
// If we want admin to get all cities, they must use an admin-specific route or we pass auth token.
router.get('/', asyncHandler(getAllCities));

// Admin only route
router.post('/', protect, restrictToAdmin, validate(createCitySchema), asyncHandler(createCity));

export default router;
