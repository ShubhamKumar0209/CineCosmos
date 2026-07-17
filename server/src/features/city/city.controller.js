import * as cityService from './city.service.js';
import { HTTP_STATUS } from '../../utils/constants.js';

/**
 * Get all active cities.
 * Accessible to all users.
 */
export const getAllCities = async (req, res) => {
  // Only return active cities unless the user is an admin
  const query = req.user?.role === 'admin' ? {} : { isActive: true };
  const cities = await cityService.getAllCities(query);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    results: cities.length,
    data: { cities },
  });
};

/**
 * Create a new city.
 * Restricted to admins.
 */
export const createCity = async (req, res) => {
  const city = await cityService.createCity(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { city },
  });
};
