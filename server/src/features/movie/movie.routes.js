import express from 'express';
import { getMovies, getMovie, syncMovies } from './movie.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { restrictToAdmin } from '../../middleware/admin.middleware.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getMovies));
router.get('/:id', asyncHandler(getMovie));

// Admin only routes
router.post('/sync', protect, restrictToAdmin, asyncHandler(syncMovies));

export default router;
