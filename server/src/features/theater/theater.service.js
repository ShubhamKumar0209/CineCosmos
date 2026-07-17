import Theater from './theater.model.js';
import Screen from './screen.model.js';
import City from '../city/city.model.js';
import AppError from '../../utils/AppError.js';
import { HTTP_STATUS } from '../../utils/constants.js';

export const getAllTheaters = async (query = {}) => {
  return await Theater.find(query).populate('city', 'name state').populate('screens', 'name totalSeats');
};

export const createTheater = async (theaterData) => {
  // Validate city exists
  const city = await City.findById(theaterData.city);
  if (!city) {
    throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
  }

  return await Theater.create(theaterData);
};

export const getTheaterById = async (id) => {
  const theater = await Theater.findById(id).populate('city').populate('screens');
  if (!theater) {
    throw new AppError('Theater not found', HTTP_STATUS.NOT_FOUND);
  }
  return theater;
};

export const addScreenToTheater = async (theaterId, screenData) => {
  const theater = await Theater.findById(theaterId);
  if (!theater) {
    throw new AppError('Theater not found', HTTP_STATUS.NOT_FOUND);
  }

  const screen = await Screen.create({
    ...screenData,
    theater: theaterId,
  });

  theater.screens.push(screen._id);
  await theater.save();

  return screen;
};
