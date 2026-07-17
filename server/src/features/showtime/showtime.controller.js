import * as showtimeService from './showtime.service.js';
import { HTTP_STATUS } from '../../utils/constants.js';

export const createShowtime = async (req, res) => {
  const showtime = await showtimeService.createShowtime(req.body);

  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    data: { showtime },
  });
};

export const getShowtimes = async (req, res) => {
  // Extract query filters (e.g., movie, city, theater)
  const query = {};
  if (req.query.movie) query.movie = req.query.movie;
  if (req.query.city) query.city = req.query.city;
  if (req.query.theater) query.theater = req.query.theater;

  // By default, fetch showtimes in the future
  if (!req.query.all) {
    query.startTime = { $gte: new Date() };
  }

  const showtimes = await showtimeService.getShowtimes(query);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    results: showtimes.length,
    data: { showtimes },
  });
};

export const getShowtime = async (req, res) => {
  const showtime = await showtimeService.getShowtimeDetails(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { showtime },
  });
};

export const getSeats = async (req, res) => {
  const availability = await showtimeService.getSeatAvailability(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: availability,
  });
};
