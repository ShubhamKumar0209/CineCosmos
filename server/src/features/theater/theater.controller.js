import * as theaterService from './theater.service.js';
import { HTTP_STATUS } from '../../utils/constants.js';

export const getTheaters = async (req, res) => {
  // If city is provided in query, filter by it
  const filter = {};
  if (req.query.city) {
    filter.city = req.query.city;
  }
  
  // Non-admins only see active theaters
  if (req.user?.role !== 'admin') {
    filter.isActive = true;
  }

  const theaters = await theaterService.getAllTheaters(filter);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    results: theaters.length,
    data: { theaters },
  });
};

export const createTheater = async (req, res) => {
  const theater = await theaterService.createTheater(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { theater },
  });
};

export const getTheater = async (req, res) => {
  const theater = await theaterService.getTheaterById(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { theater },
  });
};

export const addScreen = async (req, res) => {
  const screen = await theaterService.addScreenToTheater(req.params.id, req.body);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { screen },
  });
};
