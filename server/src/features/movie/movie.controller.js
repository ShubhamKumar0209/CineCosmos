import * as movieService from './movie.service.js';
import { HTTP_STATUS } from '../../utils/constants.js';
import AppError from '../../utils/AppError.js';

export const getMovies = async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  const movies = await movieService.getAllMovies(filter);

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    results: movies.length,
    data: { movies },
  });
};

export const getMovie = async (req, res) => {
  const movie = await movieService.getMovieById(req.params.id);
  if (!movie) {
    throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { movie },
  });
};

export const syncMovies = async (req, res) => {
  const results = await movieService.syncMoviesFromTMDB();

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Movies synced successfully',
    data: results,
  });
};
